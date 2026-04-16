import { createApp } from 'vue';
import './styles/index.css';
import './styles/themes/index.scss';
import './styles/dialog-cockpit.scss';
import './styles/action-buttons.scss';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia';
import router from './router';
import { useAppStore } from './stores/app';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(ElementPlus);

const appStore = useAppStore(pinia);
appStore.initTheme();

app.mount('#app');
