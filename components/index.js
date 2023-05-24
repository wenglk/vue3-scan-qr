import scan from "./scan/index.vue";

const install = (app) => {
    app.component(scan.name, scan);
};

export default install;
