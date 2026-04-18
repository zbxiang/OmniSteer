import { createApp } from 'vue';
import './styles/tailwind.css';
import globalStyles from './styles/index.scss?raw';
import './styles/themes/index.scss';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia';
import router from './router';
import { useAppStore } from './stores/app';
import { permissionDirective } from './utils/auth';

const globalStyleTag = document.createElement('style');
globalStyleTag.setAttribute('data-style-source', 'src/styles/index.scss');
globalStyleTag.textContent = globalStyles;
document.head.appendChild(globalStyleTag);

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.directive('permission', permissionDirective);

const appStore = useAppStore(pinia);
appStore.initTheme();

app.mount('#app');
