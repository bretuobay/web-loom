import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Import the router
import './assets/shared-styles.css'; // Import shared styles
// import './assets/main.css'; // Remove if shared-styles replaces it, or keep if it has base resets
import './style.css'; // Keep for very basic resets or global settings not in shared

const app = createApp(App);

app.use(router); // Use the router

app.mount('#app');
