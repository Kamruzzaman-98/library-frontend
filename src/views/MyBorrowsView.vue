<script setup>
import { ref, onMounted } from "vue";
import apiClient from "../api/axios";

const records = ref([]);
const loading = ref(false);

const fetchMyBorrows = async () => {
  loading.value = true;
  try {
    const res = await apiClient.get("/my-borrows");
    records.value = res.data.data;
  } catch (err) {
    console.error("হিস্ট্রি লোড এরর:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchMyBorrows();
});
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-slate-800 mb-6">
      আমার বই সংগ্রহের হিস্ট্রি
    </h1>

    <div v-if="loading" class="text-center py-8 text-slate-500">
      লোড হচ্ছে...
    </div>

    <div
      v-else-if="records.length === 0"
      class="text-center py-8 text-slate-400 bg-white rounded-xl border p-6"
    >
      আপনি এখনও কোনো বইয়ের জন্য আবেদন করেননি।
    </div>

    <div
      v-else
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
    >
      <table class="w-full text-left text-sm text-slate-600">
        <thead class="bg-slate-50 text-slate-700 text-xs uppercase">
          <tr>
            <th class="py-3 px-4">বইয়ের নাম</th>
            <th class="py-3 px-4">লেখক</th>
            <th class="py-3 px-4">ইস্যুর তারিখ</th>
            <th class="py-3 px-4">ফেরতের শেষ তারিখ</th>
            <th class="py-3 px-4">স্ট্যাটাস</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="item in records" :key="item.id">
            <td class="py-3 px-4 font-semibold text-slate-800">
              {{ item.book?.title }}
            </td>
            <td class="py-3 px-4">{{ item.book?.author }}</td>
            <td class="py-3 px-4">{{ item.issue_date || "প্রযোজ্য নয়" }}</td>
            <td class="py-3 px-4 font-medium text-amber-700">
              {{ item.due_date || "প্রযোজ্য নয়" }}
            </td>
            <td class="py-3 px-4">
              <span
                v-if="item.status === 'pending'"
                class="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 font-medium"
              >
                আবেদন পেন্ডিং
              </span>
              <span
                v-else-if="item.status === 'issued'"
                class="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-medium"
              >
                পড়ছেন (হাতে আছে)
              </span>
              <span
                v-else-if="item.status === 'returned'"
                class="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 font-medium"
              >
                ফেরত দেওয়া হয়েছে
              </span>
              <span
                v-else
                class="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 font-medium"
              >
                বাতিল
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
