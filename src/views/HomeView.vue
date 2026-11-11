<script setup>
import { ref, onMounted } from "vue";
import { useSettingStore } from "../stores/setting";
import apiClient from "../api/axios";

const settingStore = useSettingStore();
const notices = ref([]);

const fetchNotices = async () => {
  try {
    const res = await apiClient.get("/notices");
    notices.value = res.data.data;
  } catch (err) {
    console.error("নোটিশ পেতে সমস্যা হয়েছে:", err);
  }
};

onMounted(() => {
  settingStore.fetchSettings();
  fetchNotices();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <!-- হিরো সেকশন -->
    <header class="bg-emerald-700 text-white py-16 px-4 text-center">
      <h1 class="text-4xl font-extrabold tracking-tight">
        {{ settingStore.settings.library_name || "পাঠাগার" }}
      </h1>
      <p class="mt-3 text-emerald-100 text-lg">
        {{ settingStore.settings.tagline }}
      </p>
      <div class="mt-6 flex justify-center space-x-3">
        <RouterLink
          to="/books"
          class="bg-white text-emerald-800 font-semibold px-5 py-2.5 rounded-lg shadow hover:bg-emerald-50 transition"
        >
          বইয়ের ক্যাটালগ দেখুন
        </RouterLink>
      </div>
    </header>

    <main class="max-w-5xl mx-auto py-10 px-4 space-y-8">
      <!-- জরুরি নোটিশ বোর্ড সেকশন -->
      <section
        v-if="notices.length > 0"
        class="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl shadow-sm"
      >
        <div class="flex items-center space-x-2 mb-3">
          <span
            class="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"
          ></span>
          <h2 class="text-xl font-bold text-amber-900">জরুরি নোটিশ বোর্ড</h2>
        </div>
        <div class="space-y-4">
          <div
            v-for="notice in notices"
            :key="notice.id"
            class="bg-white p-4 rounded-lg border border-amber-200 shadow-xs"
          >
            <div class="flex justify-between items-center mb-1">
              <h3 class="font-bold text-slate-800">{{ notice.title }}</h3>
              <span class="text-xs text-slate-400 font-mono">{{
                notice.published_at
              }}</span>
            </div>
            <p class="text-sm text-slate-600 whitespace-pre-line">
              {{ notice.content }}
            </p>
          </div>
        </div>
      </section>

      <!-- লক্ষ্য ও উদ্দেশ্য -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section
          class="bg-white p-6 rounded-xl shadow-sm border border-slate-100"
        >
          <h2 class="text-xl font-bold text-emerald-800 mb-2">আমাদের লক্ষ্য</h2>
          <p class="text-slate-600 leading-relaxed">
            {{ settingStore.settings.mission }}
          </p>
        </section>

        <section
          class="bg-white p-6 rounded-xl shadow-sm border border-slate-100"
        >
          <h2 class="text-xl font-bold text-emerald-800 mb-2">উদ্দেশ্য</h2>
          <p class="text-slate-600 leading-relaxed">
            {{ settingStore.settings.vision }}
          </p>
        </section>
      </div>

      <!-- যোগাযোগ ও ঠিকানা -->
      <section class="bg-slate-100 p-6 rounded-xl text-sm text-slate-600">
        <p><strong>যোগাযোগ:</strong> {{ settingStore.settings.phone }}</p>
        <p class="mt-1">
          <strong>ঠিকানা:</strong> {{ settingStore.settings.address }}
        </p>
      </section>
    </main>
  </div>
</template>
