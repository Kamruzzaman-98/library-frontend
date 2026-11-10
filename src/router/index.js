
import { createRouter, createWebHistory } from 'vue-router';

import HomeView from '../views/HomeView.vue';
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
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
