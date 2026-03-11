import router from './router.js';

// Setup Axios Interceptor
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers['Authentication-Token'] = token;
    }
    return config;
});

axios.interceptors.response.use(response => response, error => {
    if (error.response && error.response.status === 401) {
        // Only redirect to login if we're not already on login/register page
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
            localStorage.clear();
            router.push('/login');
        }
    }
    return Promise.reject(error);
});

const { createApp } = Vue;

const App = {
    template: `
        <div id="main">
            <div id="canvas">
                <router-view></router-view>
            </div>
        </div>
    `
};

const app = createApp(App);
app.use(router);
app.mount('#app');
