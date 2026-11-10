
import { defineStore } from 'pinia';
import apiClient from '../api/axios';

export const useSettingStore = defineStore('setting', {

    state: () => ({
        settings: {},
        loading: false,
        updating: false,
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
        },

        async updateSettings(updatedData) {

            this.updating = true;

            try {

                const response = await apiClient.post('/settings', {
                    settings: updatedData,
                });

                this.settings = {
                    ...this.settings,
                    ...updatedData,
                };

                return {
                    success: true,
                    message: response.data.message,
                };

            } catch (error) {

                return {
                    success: false,
                    message: error.response?.data?.message ||
                        'Update error!',
                };

            } finally {

                this.updating = false;

            }
        }
    }
});
