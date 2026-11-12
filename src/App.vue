<script setup>
import { onMounted } from "vue";
import ToastContainer from "./components/ToastContainer.vue";
import { useSettingStore } from "./stores/setting";

const settingStore = useSettingStore();

onMounted(() => {
  settingStore.fetchSettings();
});
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
