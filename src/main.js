import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'vuetify/styles';
import vuetify from './plugins/vuetify';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import './assets/style.css';
import App from './App.vue';

const pinia = createPinia();

const app = createApp(App);
app.use(Toast);
app.use(pinia);
app.use(vuetify);
app.mount('#app');
