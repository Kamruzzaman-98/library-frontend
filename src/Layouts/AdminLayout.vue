<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useSettingStore } from "../stores/setting";
import { HeartHandshake } from "lucide-vue-next";
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
const isDesktop = ref(window.innerWidth >= 1024);

const updateScreenWidth = () => {
  isDesktop.value = window.innerWidth >= 1024;
  if (isDesktop.value) isMobileDrawerOpen.value = false;
};

onMounted(() => {
  window.addEventListener("resize", updateScreenWidth);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScreenWidth);
});

const menuItems = [
  { name: "ড্যাশবোর্ড", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "বই ও ক্যাটাগরি", path: "/admin/books", icon: BookOpen },
  { name: "বিতরণ ও জমা ডেস্ক", path: "/admin/borrows", icon: ArrowLeftRight },
  { name: "নোটিশ বোর্ড", path: "/admin/notices", icon: Bell },
  { name: "অনুদান ও কমিটি", path: "/admin/community", icon: HeartHandshake },
  { name: "পাঠাগার সেটিংস", path: "/admin/settings", icon: Settings },
];

const isActive = (path) => route.path === path;

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};
</script>

<template>
  <!-- রুট কন্টেইনার: পুরো পর্দা জুড়ে ফিক্সড (inset: 0) -->
  <div
    style="
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      display: flex;
      overflow: hidden;
    "
    class="bg-slate-100"
  >
    <!-- Mobile Backdrop -->
    <div
      v-if="isMobileDrawerOpen && !isDesktop"
      @click="isMobileDrawerOpen = false"
      style="
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        z-index: 40;
      "
    ></div>

    <!-- বাম পাশের সাইডবার -->
    <aside
      :style="{
        width: isDesktop ? (isSidebarCollapsed ? '80px' : '256px') : '256px',
        height: '100%',
        flexShrink: 0,
        position: isDesktop ? 'relative' : 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transform: isDesktop
          ? 'none'
          : isMobileDrawerOpen
            ? 'translateX(0)'
            : 'translateX(-100%)',
        transition: 'all 0.25s ease',
      }"
      class="bg-slate-900 text-slate-300 shadow-xl"
    >
      <!-- Sidebar Top Brand -->
      <div
        class="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0"
      >
        <div
          v-if="!isSidebarCollapsed || !isDesktop"
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

        <button
          v-if="!isDesktop"
          @click="isMobileDrawerOpen = false"
          class="text-slate-400 hover:text-white"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Middle Scrollable Menu -->
      <nav
        style="flex: 1; overflow-y: auto; min-height: 0"
        class="px-3 py-4 space-y-1.5"
      >
        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          @click="isMobileDrawerOpen = false"
          :class="[
            isActive(item.path)
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white',
            isSidebarCollapsed && isDesktop ? 'justify-center px-2' : 'px-3',
          ]"
          class="flex items-center py-2.5 rounded-lg text-sm font-medium transition-colors"
          :title="isSidebarCollapsed ? item.name : ''"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span
            v-if="!isSidebarCollapsed || !isDesktop"
            class="ml-3 truncate"
            >{{ item.name }}</span
          >
        </RouterLink>
      </nav>

      <!-- Bottom Fixed Logout & Collapse -->
      <div
        class="p-3 border-t border-slate-800 space-y-1.5 shrink-0 bg-slate-900"
      >
        <button
          v-if="isDesktop"
          @click="isSidebarCollapsed = !isSidebarCollapsed"
          class="flex w-full items-center justify-center py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-xs transition"
        >
          <ChevronLeft v-if="!isSidebarCollapsed" class="w-4 h-4 mr-1" />
          <ChevronRight v-else class="w-4 h-4" />
          <span v-if="!isSidebarCollapsed">মেনু ছোট করুন</span>
        </button>

        <button
          @click="handleLogout"
          :class="isSidebarCollapsed && isDesktop ? 'justify-center' : 'px-3'"
          class="w-full flex items-center py-2.5 rounded-lg text-red-400 hover:bg-red-950/60 hover:text-red-300 text-sm font-medium transition"
        >
          <LogOut class="w-5 h-5 shrink-0" />
          <span v-if="!isSidebarCollapsed || !isDesktop" class="ml-3"
            >লগআউট</span
          >
        </button>
      </div>
    </aside>

    <!-- ডান পাশের মেইন র‍্যাপার -->
    <div
      style="
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-width: 0;
        overflow: hidden;
      "
    >
      <!-- Top Bar -->
      <header
        class="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-xs"
      >
        <div class="flex items-center space-x-3">
          <button
            v-if="!isDesktop"
            @click="isMobileDrawerOpen = true"
            class="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu class="w-5 h-5" />
          </button>
          <span class="text-sm font-semibold text-slate-700">
            প্রশাসনিক নিয়ন্ত্রণ কক্ষ
          </span>
        </div>

        <div class="flex items-center space-x-4">
          <RouterLink
            to="/"
            target="_blank"
            class="flex items-center space-x-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
          >
            <span>মূল সাইট দেখুন</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </RouterLink>

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

      <!-- ৩. শুধুমাত্র এই ভেতরের অংশটুকু স্ক্রল হবে -->
      <main
        style="
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
        "
        class="p-4 sm:p-6 lg:p-8"
      >
        <!-- পেজের মূল কন্টেন্ট -->
        <div class="flex-1">
          <RouterView />
        </div>

        <!-- Minimal Admin System Footer -->
        <footer
          class="mt-12 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2"
        >
          <div>
            &copy; {{ new Date().getFullYear() }}
            <span class="font-semibold text-slate-600">{{
              settingStore.settings.library_name || "ডিজিটাল পাঠাগার"
            }}</span>
            — সর্বস্বত্ব সংরক্ষিত।
          </div>
          <div class="flex items-center space-x-3">
            <span
              >সিস্টেম ভার্সন:
              <strong class="text-slate-500">v1.0.0</strong></span
            >
            <span>&bull;</span>
            <span>কমিউনিটি লাইব্রেরি ম্যানেজমেন্ট সিস্টেম</span>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>
