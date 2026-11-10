<script setup>
import { reactive, onMounted } from 'vue';
import { useSettingStore } from '../stores/setting';

const settingStore = useSettingStore();
const form = reactive({
  library_name: '',
  tagline: '',
  mission: '',
  vision: '',
  phone: '',
  address: '',
});

onMounted(async () => {
  await settingStore.fetchSettings();
  Object.assign(form, settingStore.settings);
});

const handleSave = async () => {
  const result = await settingStore.updateSettings(form);
  alert(result.message);
};
</script>

<template>
  <div class="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-xl my-10">
    <h2 class="text-2xl font-bold mb-6 text-slate-800">পাঠাগারের তথ্য এডিট করুন</h2>
    
    <form @submit.prevent="handleSave" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700">পাঠাগারের নাম</label>
        <input v-model="form.library_name" type="text" class="mt-1 w-full border rounded-lg p-2" required />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700">স্লোগান / ট্যাগলাইন</label>
        <input v-model="form.tagline" type="text" class="mt-1 w-full border rounded-lg p-2" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700">আমাদের লক্ষ্য (Mission)</label>
        <textarea v-model="form.mission" rows="3" class="mt-1 w-full border rounded-lg p-2"></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700">আমাদের উদ্দেশ্য (Vision)</label>
        <textarea v-model="form.vision" rows="3" class="mt-1 w-full border rounded-lg p-2"></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700">যোগাযোগের ফোন নম্বর</label>
          <input v-model="form.phone" type="text" class="mt-1 w-full border rounded-lg p-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">ঠিকানা</label>
          <input v-model="form.address" type="text" class="mt-1 w-full border rounded-lg p-2" />
        </div>
      </div>

      <button 
        type="submit" 
        :disabled="settingStore.updating"
        class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition"
      >
        {{ settingStore.updating ? 'সেভ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন' }}
      </button>
    </form>
  </div>
</template>