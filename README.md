# vue3-scan-qr

Javascript QR Code Scanner based on [Cosmo Wolfe's javascript port](https://github.com/cozmo/jsqr) and [Vue3](https://github.com/vuejs/core).

## Installation

To install via npm:

```bash
npm install --save vue3-scan-qr
```

To install via yarn:

```bash
yarn add vue3-scan-qr
```

## Usage

`main.js`

```js
import VScan from "vue3-scan-qr";
import "../node_modules/vue3-scan-qr/dist/style.css";

createApp(App).use(VScan).mount("#app");
```

`app.vue`

```html
<script setup>
    import { ref } from "vue";

    const showScan = ref(false);

    function output(code) {
        console.log(code);
        showScan.value = false;
    }

    function errorCatch(error) {
        console.log(error);
    }
</script>

<template>
    <div>
        <button @click="showScan = true">Scan</button>
        <v-scan
            v-model:visible="showScan"
            @scanned="output"
            @error-catch="errorCatch"
            :head-tip="Tip messages"
        ></v-scan>
    </div>
</template>
```

### Arguments

-   `visible` - Boolean
-   `scanned` - Function(code), code is the QR code scanned
-   `error-catch` - Function(error)
-   `head-tip` - String
