import { createApp } from "vue";

import App from "./ui/App.vue";
import router from "./ui/router";
import store from "./ui/store";

import "material-design-icons/iconfont/material-icons.css";
import "./ui/assets/global.scss";

createApp(App).use(store).use(router).mount("#app");
