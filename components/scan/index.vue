<script lang="ts">
export default {
    name: "vScan",
};
</script>
<script setup lang="ts">
import { reactive, ref, watch, nextTick, onBeforeUnmount } from "vue";
import jsQR from "jsqr";

interface CodeLocation {
    x: number;
    y: number;
}

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
        required: true,
    },
    headTip: {
        type: String,
        default: "若当前浏览器无法扫码，请切换其他浏览器尝试",
    },
});
const emit = defineEmits<{
    (event: "error-catch", error: ErrorEvent): void;
    (event: "scanned", code: string): string;
    (event: "update:visible", value: Boolean): void;
}>();
const video = ref();
const canvas = ref();
const canvasRef = ref();
const showBanner = ref(true);
const showPlay = ref(false);
const active = ref(false);
const previousCode = ref();
const scanedNum = ref(0);
const videoWH = reactive({
    width: document.documentElement.clientWidth || document.body.clientWidth,
    height: document.documentElement.clientHeight || document.body.clientHeight,
});

watch(
    () => active,
    (val) => {
        if (!val) fullStop();
    }
);
watch(
    () => props.visible,
    (val) => {
        if (val == true) {
            nextTick(() => {
                setup();
            });
        } else fullStop();
    }
);

// 画线
function drawLine(begin: CodeLocation, end: CodeLocation) {
    canvas.value.beginPath();
    canvas.value.moveTo(begin.x, begin.y);
    canvas.value.lineTo(end.x, end.y);
    canvas.value.lineWidth = 2;
    canvas.value.strokeStyle = "#03C03C";
    canvas.value.stroke();
}
// 画框
function drawBox(location: any) {
    drawLine(location.topLeftCorner, location.topRightCorner);
    drawLine(location.topRightCorner, location.bottomRightCorner);
    drawLine(location.bottomRightCorner, location.bottomLeftCorner);
    drawLine(location.bottomLeftCorner, location.topLeftCorner);
}

// 初始化
function setup() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        previousCode.value = null;
        scanedNum.value = 0;
        active.value = true;
        canvas.value = (canvasRef.value as HTMLCanvasElement).getContext("2d");
        const handleSuccess = (stream: any) => {
            if (video.value.srcObject !== undefined) {
                video.value.srcObject = stream;
            } else if ((window as any).videoEl.mozSrcObject !== undefined) {
                video.value.mozSrcObject = stream;
            } else if (window.URL.createObjectURL) {
                video.value.src = window.URL.createObjectURL(stream);
            } else if (window.webkitURL) {
                video.value.src = window.webkitURL.createObjectURL(stream);
            } else {
                video.value.src = stream;
            }
            video.value.playsInline = true;
            const playPromise = video.value.play();
            playPromise.catch(() => (showPlay.value = true));
            playPromise.then(run);
        };
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: "environment" } })
            .then(handleSuccess)
            .catch(() => {
                navigator.mediaDevices
                    .getUserMedia({ video: true })
                    .then(handleSuccess)
                    .catch((error) => {
                        emit("error-catch", error);
                    });
            });
    }
}

function tick() {
    if (
        video.value &&
        video.value.readyState === video.value.HAVE_ENOUGH_DATA
    ) {
        canvasRef.value.height = videoWH.height;
        canvasRef.value.width = videoWH.width;
        canvas.value.drawImage(
            video.value,
            0,
            0,
            canvasRef.value.width,
            canvasRef.value.height
        );
        const imageData = canvas.value.getImageData(
            0,
            0,
            canvasRef.value.width,
            canvasRef.value.height
        );
        let code;
        try {
            code = jsQR(imageData.data, imageData.width, imageData.height);
        } catch (e) {
            console.error(e);
        }
        if (code) {
            drawBox(code.location);
            found(code.data);
        }
    }
    run();
}
function run() {
    if (active) {
        requestAnimationFrame(tick);
    }
}
function found(code: string) {
    if (previousCode.value !== code) {
        previousCode.value = code;
    } else if (previousCode.value === code) {
        scanedNum.value += 1;
    }
    if (scanedNum.value > 2) {
        active.value = false;
        scanedNum.value = 0;
        emit("scanned", code);
    }
}
// 完全停止
function fullStop() {
    if (video.value && video.value.srcObject) {
        video.value.srcObject.getTracks().forEach((t: any) => t.stop());
    }
}

onBeforeUnmount(() => {
    fullStop();
});
</script>

<template>
    <div class="scaner" ref="scaner" v-if="props.visible">
        <div class="banner" v-if="showBanner">
            <i class="close_icon" @click="() => (showBanner = false)"></i>
            <p class="text">{{ headTip }}</p>
        </div>
        <div class="cover">
            <p class="line"></p>
            <span class="square top left"></span>
            <span class="square top right"></span>
            <span class="square bottom right"></span>
            <span class="square bottom left"></span>
            <!-- <p class="tips">将二维码放入框内，即可自动扫描</p> -->
        </div>
        <video
            v-show="showPlay"
            class="source"
            ref="video"
            :width="videoWH.width"
            :height="videoWH.height"
            controls
        ></video>
        <canvas v-show="!showPlay" ref="canvasRef" />
        <img
            src="./close.png"
            class="scan-close"
            @click="emit('update:visible', false)"
        />
    </div>
</template>

<style scoped>
.scaner {
    background: #000000;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
}
.scan-close {
    position: absolute;
    left: 50%;
    bottom: 80px;
    transform: translateX(-50%);
}
.scaner .banner {
    width: 340px;
    position: absolute;
    top: 16px;
    left: 50%;
    margin-left: -170px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 8px;
    box-sizing: border-box;
    padding: 12px;
    opacity: 0.9;
    box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.2);
}
.scaner .banner .text {
    padding: 0 30px 0 0;
    margin: 0;
    color: #ffffff;
    font-size: 12px;
    text-align: justify;
    text-align-last: left;
}
.scaner .banner .close_icon {
    display: inline-block;
    height: 24px;
    width: 24px;
    background: url("./close.png") no-repeat center;
    background-size: auto 100%;
    position: absolute;
    right: 8px;
    top: 8px;
}
.scaner .cover {
    height: 220px;
    width: 220px;
    position: absolute;
    top: 50%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
    -moz-transform: translate(-50%, -50%);
    -ms-transform: translate(-50%, -50%);
    -o-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
    border: 0.5px solid #999999;
    z-index: 1111;
}
.scaner .cover .line {
    width: 200px;
    height: 1px;
    margin-left: 10px;
    background: #5f68e8;
    background: linear-gradient(
        to right,
        transparent,
        #5f68e8,
        #0165ff,
        #5f68e8,
        transparent
    );
    position: absolute;
    -webkit-animation: scan 1.75s infinite linear;
    -moz-animation: scan 1.75s infinite linear;
    -ms-animation: scan 1.75s infinite linear;
    -o-animation: scan 1.75s infinite linear;
    animation: scan 1.75s infinite linear;
    -webkit-animation-fill-mode: both;
    -moz-animation-fill-mode: both;
    -ms-animation-fill-mode: both;
    -o-animation-fill-mode: both;
    animation-fill-mode: both;
    border-radius: 1px;
}
.scaner .cover .square {
    display: inline-block;
    height: 20px;
    width: 20px;
    position: absolute;
}
.scaner .cover .square.top {
    top: 0;
    border-top: 1px solid #5f68e8;
}
.scaner .cover .square.left {
    left: 0;
    border-left: 1px solid #5f68e8;
}
.scaner .cover .square.bottom {
    bottom: 0;
    border-bottom: 1px solid #5f68e8;
}
.scaner .cover .square.right {
    right: 0;
    border-right: 1px solid #5f68e8;
}
.scaner .cover .tips {
    position: absolute;
    bottom: -48px;
    width: 100%;
    font-size: 14px;
    color: #ffffff;
    opacity: 0.8;
}
@-webkit-keyframes scan {
    0% {
        top: 0;
    }
    25% {
        top: 50px;
    }
    50% {
        top: 100px;
    }
    75% {
        top: 150px;
    }
    100% {
        top: 200px;
    }
}
@-moz-keyframes scan {
    0% {
        top: 0;
    }
    25% {
        top: 50px;
    }
    50% {
        top: 100px;
    }
    75% {
        top: 150px;
    }
    100% {
        top: 200px;
    }
}
@-o-keyframes scan {
    0% {
        top: 0;
    }
    25% {
        top: 50px;
    }
    50% {
        top: 100px;
    }
    75% {
        top: 150px;
    }
    100% {
        top: 200px;
    }
}
@keyframes scan {
    0% {
        top: 0;
    }
    25% {
        top: 50px;
    }
    50% {
        top: 100px;
    }
    75% {
        top: 150px;
    }
    100% {
        top: 200px;
    }
}
</style>
