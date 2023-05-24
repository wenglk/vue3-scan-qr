import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    // 配置打包入口出口
    build: {
        rollupOptions: {
            external: ["vue"], //打包的时候不需要打包的依赖
            // 打包抛出一个全局方法
            output: {
                globals: {
                    vue: "Vue",
                },
            },
        },
        // 入口
        lib: {
            entry: "./components/index.js",
            // 需要提供一个name 这个名字尽量不和 npm 上发布的包名一致，否则也会推送不到npm
            name: "vue3-scan-qr",
        },
    },
});
