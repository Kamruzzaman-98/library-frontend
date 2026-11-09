import { defineStore } from 'pinia';
import apiClient from '../api/axios';

export const useSettingStore = defineStore('setting', {
    state: () => ({
        settings: {},
        loading: false,
    }),
    actions: {
        async fetchSettings() {
            this.loading = true;
            try {
                const response = await apiClient.get('/settings');
                this.settings = response.data.data;
            } catch (error) {
                console.error('Settings load failed:', error);
            } finally {
                this.loading = false;
            }
        },
    },
});