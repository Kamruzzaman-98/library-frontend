<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import apiClient from "../api/axios";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  name: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  password_confirmation: "",
});

const errors = ref({});
const loading = ref(false);

const handleRegister = async () => {
  loading.value = true;
  errors.value = {};
  try {
    const response = await apiClient.post("/register", form);
    // সরাসরি লগইন স্টেটে সেট করা
    authStore.token = response.data.token;
    authStore.user = response.data.user;
    localStorage.setItem("auth_token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    router.push("/");
  } catch (error) {
    if (error.response && error.response.status === 422) {
      errors.value = error.response.data.errors;
    } else {
      alert("রেজিস্ট্রেশন ব্যর্থ হয়েছে! পুনরায় চেষ্টা করুন।");
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4"
  >
    <div
      class="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200"
    >
      <h2 class="text-2xl font-bold text-center text-slate-800 mb-6">
        নতুন পাঠক নিবন্ধন
      </h2>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >আপনার পুরো নাম</label
          >
          <input
            v-model="form.name"
            type="text"
            required
            class="mt-1 w-full border rounded-lg p-2"
          />
          <p v-if="errors.name" class="text-xs text-red-500 mt-1">
            {{ errors.name[0] }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">ইমেইল</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="mt-1 w-full border rounded-lg p-2"
          />
          <p v-if="errors.email" class="text-xs text-red-500 mt-1">
            {{ errors.email[0] }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700"
            >মোবাইল নম্বর</label
          >
          <input
            v-model="form.phone"
            type="text"
            required
            class="mt-1 w-full border rounded-lg p-2"
          />
          <p v-if="errors.phone" class="text-xs text-red-500 mt-1">
            {{ errors.phone[0] }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700"
            >এলাকার ঠিকানা / গ্রাম</label
          >
          <input
            v-model="form.address"
            type="text"
            class="mt-1 w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700"
            >পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label
          >
          <input
            v-model="form.password"
            type="password"
            required
            class="mt-1 w-full border rounded-lg p-2"
          />
          <p v-if="errors.password" class="text-xs text-red-500 mt-1">
            {{ errors.password[0] }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700"
            >পাসওয়ার্ড নিশ্চিত করুন</label
          >
          <input
            v-model="form.password_confirmation"
            type="password"
            required
            class="mt-1 w-full border rounded-lg p-2"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition"
        >
          {{ loading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "নিবন্ধন সম্পন্ন করুন" }}
        </button>

        <p class="text-center text-sm text-slate-600 mt-4">
          আগে থেকেই অ্যাকাউন্ট আছে?
          <RouterLink
            to="/login"
            class="text-emerald-600 font-semibold hover:underline"
            >লগইন করুন</RouterLink
          >
        </p>
      </form>
    </div>
  </div>
</template>
