<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useSettingStore } from "../stores/setting";

const router = useRouter();
const authStore = useAuthStore();
const settingStore = useSettingStore();

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};
</script>

<template>
  <nav class="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <!-- Logo / Library Name -->
        <RouterLink to="/" class="flex items-center space-x-2">
          <span class="text-xl font-bold text-emerald-700">
            {{ settingStore.settings.library_name || "Library" }}
          </span>
        </RouterLink>

        <!-- Navigation Links -->
        <div class="flex items-center space-x-4">
          <RouterLink
            to="/"
            class="text-slate-600 hover:text-emerald-600 text-sm font-medium"
            >Home</RouterLink
          >

          <RouterLink
            to="/books"
            class="text-slate-600 hover:text-emerald-600 text-sm font-medium"
            >বইয়ের তালিকা</RouterLink
          >

          <!-- Admin Links -->
          <RouterLink
            v-if="authStore.isAdmin"
            to="/admin/books"
            class="text-slate-600 hover:text-emerald-600 text-sm font-medium"
          >
            বই ম্যানেজমেন্ট
          </RouterLink>
          <RouterLink
            to="/my-borrows"
            v-if="authStore.isAuthenticated && !authStore.isAdmin"
            class="text-slate-600 hover:text-emerald-600 text-sm font-medium"
            >আমার বইসমূহ</RouterLink
          >

          <RouterLink
            to="/admin/borrows"
            v-if="authStore.isAdmin"
            class="text-slate-600 hover:text-emerald-600 text-sm font-medium"
            >ইস্যু/জমা ডেস্ক</RouterLink
          >

          <RouterLink
            v-if="authStore.isAdmin"
            to="/admin/settings-edit"
            class="text-slate-600 hover:text-emerald-600 text-sm font-medium"
          >
            সেটিংস এডিট
          </RouterLink>

          <!-- Auth Buttons -->
          <template v-if="authStore.isAuthenticated">
            <span
              class="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold"
            >
              {{ authStore.user?.name }} ({{
                authStore.user?.role === "admin" ? "এডমিন" : "পাঠক"
              }})
            </span>
            <button
              @click="handleLogout"
              class="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition"
            >
              লগআউট
            </button>
          </template>

          <template v-else>
            <RouterLink
              to="/login"
              class="text-sm text-slate-700 hover:text-emerald-600 font-medium"
            >
              লগইন
            </RouterLink>
            <RouterLink
              to="/register"
              class="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-medium transition"
            >
              নিবন্ধন
            </RouterLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>
