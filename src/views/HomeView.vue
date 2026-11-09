<script setup>
import { onMounted } from 'vue';
import { useSettingStore } from '../stores/setting';

const settingStore = useSettingStore();

onMounted(() => {
  settingStore.fetchSettings();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <!-- লোডিং স্টেট -->
    <div v-if="settingStore.loading" class="text-center py-20 text-lg font-medium">
      লোড হচ্ছে...
    </div>

    <!-- ল্যান্ডিং পেজ কন্টেন্ট -->
    <div v-else>
      <!-- হিরো সেকশন -->
      <header class="bg-emerald-700 text-white py-16 px-4 text-center">
        <h1 class="text-4xl font-extrabold tracking-tight">
          {{ settingStore.settings.library_name || 'পাঠাগার' }}
        </h1>
        <p class="mt-3 text-emerald-100 text-lg">
          {{ settingStore.settings.tagline }}
        </p>
      </header>

      <!-- লক্ষ্য ও উদ্দেশ্য -->
      <main class="max-w-4xl mx-auto py-12 px-4 space-y-8">
        <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 class="text-2xl font-bold text-emerald-800 mb-2">আমাদের লক্ষ্য</h2>
          <p class="text-slate-600 leading-relaxed">{{ settingStore.settings.mission }}</p>
        </section>

        <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 class="text-2xl font-bold text-emerald-800 mb-2">উদ্দেশ্য</h2>
          <p class="text-slate-600 leading-relaxed">{{ settingStore.settings.vision }}</p>
        </section>

        <section class="bg-slate-100 p-6 rounded-xl text-sm text-slate-500">
          <p><strong>যোগাযোগ:</strong> {{ settingStore.settings.phone }}</p>
          <p><strong>ঠিকানা:</strong> {{ settingStore.settings.address }}</p>
        </section>
      </main>
    </div>
  </div>
</template>