
import { createRouter, createWebHistory } from 'vue-router';

import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import SettingsEditView from '../views/SettingsEditView.vue';

import { useAuthStore } from '../stores/auth';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomeView,
    },
    {
        path: '/admin/settings-edit',
        name: 'SettingsEdit',
        component: SettingsEditView,
        meta: { requiresAdmin: true },
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

router.beforeEach((to) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAdmin && !authStore.isAdmin) {
        return '/login';
    }

    return true;
});

export default router;
