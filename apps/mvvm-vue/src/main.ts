import { createApp } from 'vue';
import './style.css';
import '@repo/shared/styles';

import App from './App.vue';
import router from './router';

createApp(App).use(router).mount('#app');

// const app = createApp({
//   components: {
//     Header,
//     Footer,
//     Container,
//   },
// });
// app.use(router);
// app.mount("#app");
