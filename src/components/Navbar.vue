<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useSettingStore } from "../stores/setting";
import apiClient from "../api/axios";

const router = useRouter();
const authStore = useAuthStore();
const settingStore = useSettingStore();

const isMobileMenuOpen = ref(false);
const notifiedBooks = ref([]);

const fetchUserNotifications = async () => {
  if (!authStore.isAuthenticated || authStore.isAdmin) {
    notifiedBooks.value = [];
    return;
  }
  try {
    const res = await apiClient.get("/my-reservations");
    notifiedBooks.value = res.data.data.filter(
      (item) => item.status === "notified",
    );
  } catch (err) {
    console.error("নোটিফিকেশন চেক এরর:", err);
  }
};

onMounted(() => {
  fetchUserNotifications();
});

watch(
  () => authStore.isAuthenticated,
  (loggedIn) => {
    if (loggedIn) fetchUserNotifications();
    else notifiedBooks.value = [];
  },
);

const closeMenu = () => {
  isMobileMenuOpen.value = false;
};

const handleLogout = async () => {
  closeMenu();
  await authStore.logout();
  router.push("/login");
};
</script>

<template>
  <!-- ১. প্রফেশনাল টপ অ্যালার্ট ব্যানার (শুধুমাত্র বই ফেরত এলে দেখাবে) -->
  <div
    v-if="notifiedBooks.length > 0"
    class="bg-emerald-600 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium shadow-2xs"
  >
    <span
      >সুখবর! আপনার রিজার্ভ করা
      <strong>"{{ notifiedBooks[0].book?.title }}"</strong> বইটি পাঠাগারে ফেরত
      এসেছে।
    </span>
    <RouterLink
      to="/my-borrows"
      class="underline font-bold ml-1 hover:text-emerald-100"
    >
      এখনই সংগ্রহ করুন &rarr;
    </RouterLink>
  </div>

  <!-- ২. ক্লিন ও মিনিমাল নেভিগেশন বার -->
  <nav class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <!-- Logo -->
        <RouterLink
          to="/"
          @click="closeMenu"
          class="flex items-center space-x-2"
        >
          <span
            class="text-lg sm:text-xl font-bold text-emerald-700 truncate max-w-[220px] sm:max-w-none"
          >
            {{ settingStore.settings.library_name || "পাঠাগার" }}
          </span>
        </RouterLink>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center space-x-6">
          <RouterLink
            to="/"
            class="text-slate-600 hover:text-emerald-600 text-sm font-medium transition"
            >হোম</RouterLink
          >
          <RouterLink
            to="/books"
            class="text-slate-600 hover:text-emerald-600 text-sm font-medium transition"
            >বইয়ের তালিকা</RouterLink
          >

          <!-- Reader Link + Subtle Counter Badge -->
          <RouterLink
            v-if="authStore.isAuthenticated && !authStore.isAdmin"
            to="/my-borrows"
            class="text-slate-600 hover:text-emerald-600 text-sm font-medium flex items-center space-x-1.5 transition"
          >
            <span>আমার বইসমূহ</span>
            <span
              v-if="notifiedBooks.length > 0"
              class="bg-emerald-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none"
              title="রিজার্ভ করা বই ফেরত এসেছে"
            >
              {{ notifiedBooks.length }}
            </span>
          </RouterLink>

          <!-- Admin Shortcut Button -->
          <RouterLink
            v-if="authStore.isAdmin"
            to="/admin/dashboard"
            class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition"
          >
            অ্যাডমিন প্যানেল &rarr;
          </RouterLink>

          <!-- Auth Section -->
          <template v-if="authStore.isAuthenticated">
            <span
              class="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold"
            >
              {{ authStore.user?.name }}
            </span>
            <button
              @click="handleLogout"
              class="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition"
            >
              লগআউট
            </button>
          </template>

          <template v-else>
            <RouterLink
              to="/login"
              class="text-sm text-slate-700 hover:text-emerald-600 font-medium"
              >লগইন</RouterLink
            >
            <RouterLink
              to="/register"
              class="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-medium transition"
            >
              নিবন্ধন
            </RouterLink>
          </template>
        </div>

        <!-- Mobile Hamburger Button -->
        <div class="flex items-center md:hidden">
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none relative"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                v-if="!isMobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span
              v-if="notifiedBooks.length > 0 && !isMobileMenuOpen"
              class="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full"
            ></span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Drawer Menu -->
    <div
      v-show="isMobileMenuOpen"
      class="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3"
    >
      <RouterLink
        to="/"
        @click="closeMenu"
        class="block text-slate-700 font-medium py-2"
        >হোম</RouterLink
      >
      <RouterLink
        to="/books"
        @click="closeMenu"
        class="block text-slate-700 font-medium py-2"
        >বইয়ের তালিকা</RouterLink
      >

      <RouterLink
        v-if="authStore.isAuthenticated && !authStore.isAdmin"
        to="/my-borrows"
        @click="closeMenu"
        class="flex items-center justify-between text-slate-700 font-medium py-2"
      >
        <span>আমার বইসমূহ</span>
        <span
          v-if="notifiedBooks.length > 0"
          class="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full"
        >
          {{ notifiedBooks.length }} টি বই প্রস্তুত
        </span>
      </RouterLink>

      <RouterLink
        v-if="authStore.isAdmin"
        to="/admin/dashboard"
        @click="closeMenu"
        class="block text-center bg-slate-900 text-white font-semibold py-2 rounded-lg text-sm"
      >
        অ্যাডমিন প্যানেল &rarr;
      </RouterLink>

      <div class="pt-3 border-t border-slate-100 flex flex-col space-y-2">
        <template v-if="authStore.isAuthenticated">
          <div class="text-xs text-slate-500">
            লগইন রয়েছেন: <strong>{{ authStore.user?.name }}</strong>
          </div>
          <button
            @click="handleLogout"
            class="w-full text-center bg-red-50 text-red-600 font-medium py-2 rounded-lg text-sm"
          >
            লগআউট করুন
          </button>
        </template>
        <template v-else>
          <RouterLink
            to="/login"
            @click="closeMenu"
            class="w-full text-center border border-slate-200 py-2 rounded-lg font-medium text-sm"
            >লগইন</RouterLink
          >
          <RouterLink
            to="/register"
            @click="closeMenu"
            class="w-full text-center bg-emerald-600 text-white py-2 rounded-lg font-medium text-sm"
            >নিবন্ধন</RouterLink
          >
        </template>
      </div>
    </div>
  </nav>
</template>
