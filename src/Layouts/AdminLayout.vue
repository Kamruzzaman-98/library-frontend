<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useSettingStore } from "../stores/setting";
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const settingStore = useSettingStore();

const isSidebarCollapsed = ref(false);
const isMobileDrawerOpen = ref(false);

const menuItems = [
  { name: "ড্যাশবোর্ড", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "বই ও ক্যাটাগরি", path: "/admin/books", icon: BookOpen },
  { name: "বিতরণ ও জমা ডেস্ক", path: "/admin/borrows", icon: ArrowLeftRight },
  { name: "নোটিশ বোর্ড", path: "/admin/notices", icon: Bell },
  { name: "পাঠাগার সেটিংস", path: "/admin/settings", icon: Settings },
];

const isActive = (path) => route.path === path;

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex">
    <!-- Mobile Backdrop -->
    <div
      v-if="isMobileDrawerOpen"
      @click="isMobileDrawerOpen = false"
      class="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
    ></div>

    <!-- Sidebar (Desktop & Mobile) -->
    <aside
      :class="[
        isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
        isMobileDrawerOpen
          ? 'translate-x-0'
          : '-translate-x-full lg:translate-x-0',
      ]"
      class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out shadow-xl"
    >
      <!-- Sidebar Brand Header -->
      <div
        class="h-16 flex items-center justify-between px-4 border-b border-slate-800"
      >
        <div
          v-if="!isSidebarCollapsed"
          class="flex items-center space-x-2 overflow-hidden"
        >
          <div
            class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0"
          >
            পা
          </div>
          <span class="font-bold text-white text-sm truncate">
            {{ settingStore.settings.library_name || "এডমিন প্যানেল" }}
          </span>
        </div>
        <div v-else class="w-full flex justify-center">
          <div
            class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold"
          >
            পা
          </div>
        </div>

        <!-- Mobile Close Button -->
        <button
          @click="isMobileDrawerOpen = false"
          class="lg:hidden text-slate-400 hover:text-white"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation Menu Links -->
      <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          @click="isMobileDrawerOpen = false"
          :class="[
            isActive(item.path)
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white',
            isSidebarCollapsed ? 'justify-center px-2' : 'px-3',
          ]"
          class="flex items-center py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
          :title="isSidebarCollapsed ? item.name : ''"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span v-if="!isSidebarCollapsed" class="ml-3 truncate">{{
            item.name
          }}</span>
        </RouterLink>
      </nav>

      <!-- Bottom Collapse & Logout -->
      <div class="p-3 border-t border-slate-800 space-y-2">
        <button
          @click="isSidebarCollapsed = !isSidebarCollapsed"
          class="hidden lg:flex w-full items-center justify-center py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-xs transition"
        >
          <ChevronLeft v-if="!isSidebarCollapsed" class="w-4 h-4 mr-1" />
          <ChevronRight v-else class="w-4 h-4" />
          <span v-if="!isSidebarCollapsed">মেনু ছোট করুন</span>
        </button>

        <button
          @click="handleLogout"
          :class="isSidebarCollapsed ? 'justify-center' : 'px-3'"
          class="w-full flex items-center py-2.5 rounded-lg text-red-400 hover:bg-red-950/50 hover:text-red-300 text-sm font-medium transition"
        >
          <LogOut class="w-5 h-5 shrink-0" />
          <span v-if="!isSidebarCollapsed" class="ml-3">লগআউট</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Admin Header -->
      <header
        class="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30"
      >
        <div class="flex items-center space-x-3">
          <button
            @click="isMobileDrawerOpen = true"
            class="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu class="w-5 h-5" />
          </button>
          <span class="text-sm font-semibold text-slate-700 hidden sm:inline">
            প্রশাসনিক নিয়ন্ত্রণ কক্ষ
          </span>
        </div>

        <div class="flex items-center space-x-4">
          <!-- লাইভ ওয়েবসাইট ভিজিট বাটন -->
          <RouterLink
            to="/"
            target="_blank"
            class="flex items-center space-x-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
          >
            <span>মূল সাইট দেখুন</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </RouterLink>

          <!-- Admin Profile Badge -->
          <div
            class="flex items-center space-x-2 border-l pl-4 border-slate-200"
          >
            <div
              class="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold"
            >
              {{ authStore.user?.name?.charAt(0) || "A" }}
            </div>
            <div class="hidden sm:block text-left">
              <div class="text-xs font-bold text-slate-800 leading-tight">
                {{ authStore.user?.name }}
              </div>
              <div class="text-[10px] text-emerald-600 font-semibold">
                সুপার অ্যাডমিন
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Dynamic Admin Page Content -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <RouterView />
      </main>
    </div>
  </div>
</template>
