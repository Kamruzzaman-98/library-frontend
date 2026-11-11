<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

const errorMessage = ref('');

const handleLogin = async () => {
  errorMessage.value = '';
  const result = await authStore.login(form);
  if (result.success) {
    // অ্যাডমিন হলে সেটিংস এডিটে পাঠাবে, রিডার হলে হোমে
    if (authStore.isAdmin) {
      router.push('/admin/dashboard');
    } else {
      router.push('/');
    }
  } else {
    errorMessage.value = result.message;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div class="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 class="text-2xl font-bold text-center text-slate-800 mb-6">পাঠাগার অ্যাকাউন্টে লগইন</h2>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700">ইমেইল</label>
          <input v-model="form.email" type="email" required class="mt-1 w-full border rounded-lg p-2" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">পাসওয়ার্ড</label>
          <input v-model="form.password" type="password" required class="mt-1 w-full border rounded-lg p-2" />
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition"
        >
          {{ authStore.loading ? 'লগইন হচ্ছে...' : 'লগইন করুন' }}
        </button>
      </form>
    </div>
  </div>
</template>