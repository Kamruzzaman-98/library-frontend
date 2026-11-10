<script setup>
import { onMounted } from "vue";
import Navbar from "./components/Navbar.vue";
import { useSettingStore } from "./stores/setting";

const settingStore = useSettingStore();

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
  </div>
</template>
