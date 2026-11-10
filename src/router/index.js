
import { createRouter, createWebHistory } from 'vue-router';

import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import SettingsEditView from '../views/SettingsEditView.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomeView,
    },
    {
        path: '/settings-edit',
        name: 'SettingsEdit',
        component: SettingsEditView,
        // meta: { requiresAdmin: true },
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
        next('/login');
    } else {
        next();
    }
});

export default router;
