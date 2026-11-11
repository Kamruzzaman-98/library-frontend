<script setup>
import { useToastStore } from "../stores/toast";

const toastStore = useToastStore();
</script>

<template>
  <div
    class="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full px-4 sm:px-0"
  >
    <transition-group
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :class="{
          'bg-emerald-600 text-white border-emerald-700':
            toast.type === 'success',
          'bg-red-600 text-white border-red-700': toast.type === 'error',
          'bg-slate-800 text-white border-slate-900': toast.type === 'info',
        }"
        class="flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-sm font-medium"
      >
        <span>{{ toast.message }}</span>
        <button
          @click="toastStore.remove(toast.id)"
          class="ml-3 text-white/80 hover:text-white font-bold text-base leading-none"
        >
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>
