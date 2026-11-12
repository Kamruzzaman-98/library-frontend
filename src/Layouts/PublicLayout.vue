<script setup>
import Navbar from "../components/Navbar.vue";
import { useSettingStore } from "../stores/setting";

const settingStore = useSettingStore();
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <Navbar />
    <main class="flex-grow">
      <RouterView />
    </main>
    <footer
      class="bg-slate-900 text-slate-400 py-8 px-4 mt-12 border-t border-slate-800"
    >
      <div
        class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm gap-4"
      >
        <div>
          <span class="text-white font-bold text-base">{{
            settingStore.settings.library_name || "পাঠাগার"
          }}</span>
          <p class="text-xs mt-1">{{ settingStore.settings.address }}</p>
        </div>
        <div class="text-xs text-slate-500">
          &copy; {{ new Date().getFullYear() }} সর্বস্বত্ব সংরক্ষিত | কমিউনিটি
          ডিজিটাল লাইব্রেরি সিস্টেম
        </div>
      </div>
    </footer>
  </div>
</template>
