import { defineStore } from 'pinia';
import apiClient from '../api/axios';

export const useSettingStore = defineStore('setting', {

    state: () => ({
        settings: {},
        loading: false,
        error: null,
    }),

    actions: {

        async fetchSettings() {

            this.loading = true;
            this.error = null;

            try {

                const response = await apiClient.get('/settings');

                this.settings = response.data.data;

                console.log('Settings Loaded:', this.settings);

            } catch (error) {

                console.error('Settings load failed:', error);

                this.error = error.message;

            } finally {

                this.loading = false;

            }
        }
    }
});