<script setup>
import { onMounted } from "vue";
import Navbar from "./components/Navbar.vue";
import ToastContainer from "./components/ToastContainer.vue";
import { useSettingStore } from "./stores/setting";
import { useToastStore } from "./stores/toast";

const settingStore = useSettingStore();
const toastStore = useToastStore();

onMounted(() => {
  settingStore.fetchSettings();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <Navbar />

    <div class="flex-grow">
      <RouterView />
    </div>

    <ToastContainer />
  </div>
</template>
