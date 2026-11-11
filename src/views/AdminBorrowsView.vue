<script setup>
import { ref, onMounted } from "vue";
import apiClient from "../api/axios";

const borrows = ref([]);
const loading = ref(false);
const filterStatus = ref("");

const fetchBorrows = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filterStatus.value) params.status = filterStatus.value;
    const res = await apiClient.get("/borrows", { params });
    borrows.value = res.data.data.data;
  } catch (error) {
    console.error("ইস্যু হিস্ট্রি এরর:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchBorrows();
});

const handleIssue = async (id) => {
  try {
    const res = await apiClient.post(`/admin/borrows/${id}/issue`, {
      days: 14,
    });
    alert(res.data.message);
    await fetchBorrows();
  } catch (error) {
    alert(error.response?.data?.message || "বই ইস্যু করা যায়নি!");
  }
};

const handleReturn = async (id) => {
  if (!confirm("বইটি কি অক্ষত অবস্থায় ফেরত পাওয়া গেছে?")) return;
  try {
    const res = await apiClient.post(`/admin/borrows/${id}/return`);
    alert(res.data.message);
    await fetchBorrows();
  } catch (error) {
    alert(error.response?.data?.message || "রিটার্ন সম্পন্ন হয়নি!");
  }
};

const handleReject = async (id) => {
  if (!confirm("আপনি কি এই আবেদনটি বাতিল করতে চান?")) return;
  try {
    const res = await apiClient.post(`/admin/borrows/${id}/reject`);
    alert(res.data.message);
    await fetchBorrows();
  } catch (error) {
    alert(error.response?.data?.message || "বাতিল করা যায়নি!");
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-slate-800">
        বই বিতরণ ও জমা ডেস্ক (Circulation)
      </h1>
      <select
        v-model="filterStatus"
        @change="fetchBorrows"
        class="border rounded-lg p-2 text-sm bg-white"
      >
        <option value="">সব স্ট্যাটাস</option>
        <option value="pending">পেন্ডিং আবেদন</option>
        <option value="issued">ইস্যুকৃত (পড়ছে)</option>
        <option value="returned">ফেরত এসেছে</option>
      </select>
    </div>

    <div
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
    >
      <table class="w-full text-left text-sm text-slate-600">
        <thead class="bg-slate-50 text-slate-700 text-xs uppercase">
          <tr>
            <th class="py-3 px-4">পাঠকের নাম ও ফোন</th>
            <th class="py-3 px-4">বই ও শেলফ</th>
            <th class="py-3 px-4">ডিউ ডেট</th>
            <th class="py-3 px-4">স্ট্যাটাস</th>
            <th class="py-3 px-4 text-right">অ্যাকশন</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="item in borrows" :key="item.id">
            <td class="py-3 px-4">
              <div class="font-semibold text-slate-800">
                {{ item.user?.name }}
              </div>
              <div class="text-xs text-slate-500">{{ item.user?.phone }}</div>
            </td>
            <td class="py-3 px-4">
              <div class="font-semibold text-slate-800">
                {{ item.book?.title }}
              </div>
              <div class="text-xs text-slate-400">
                শেলফ: {{ item.book?.shelf_no || "N/A" }}
              </div>
            </td>
            <td class="py-3 px-4 font-mono text-xs">
              {{ item.due_date || "---" }}
            </td>
            <td class="py-3 px-4">
              <span
                :class="{
                  'bg-amber-100 text-amber-800': item.status === 'pending',
                  'bg-blue-100 text-blue-800': item.status === 'issued',
                  'bg-emerald-100 text-emerald-800': item.status === 'returned',
                  'bg-red-100 text-red-800': item.status === 'rejected',
                }"
                class="px-2 py-0.5 rounded text-xs font-semibold"
              >
                {{ item.status }}
              </span>
            </td>
            <td class="py-3 px-4 text-right space-x-2">
              <!-- পেন্ডিং থাকলে ইস্যু বা রিজেক্ট বাটন -->
              <template v-if="item.status === 'pending'">
                <button
                  @click="handleIssue(item.id)"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-medium"
                >
                  ইস্যু অনুমোদন
                </button>
                <button
                  @click="handleReject(item.id)"
                  class="bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded text-xs font-medium"
                >
                  বাতিল
                </button>
              </template>

              <!-- ইস্যু অবস্থায় থাকলে রিটার্ন বাটন -->
              <template v-else-if="item.status === 'issued'">
                <button
                  @click="handleReturn(item.id)"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-medium"
                >
                  ফেরত গ্রহণ করুন
                </button>
              </template>

              <span v-else class="text-xs text-slate-400">সম্পন্ন</span>
            </td>
          </tr>
          <tr v-if="borrows.length === 0">
            <td colspan="5" class="text-center py-6 text-slate-400">
              কোনো রেকর্ড পাওয়া যায়নি।
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
