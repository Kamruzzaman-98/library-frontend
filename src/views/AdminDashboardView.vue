<script setup>
import { ref, onMounted } from "vue";
import apiClient from "../api/axios";

const stats = ref(null);
const members = ref([]);
const memberSearch = ref("");
const loadingStats = ref(false);
const loadingMembers = ref(false);

const fetchStats = async () => {
  loadingStats.value = true;
  try {
    const res = await apiClient.get("/admin/stats");
    stats.value = res.data.data;
  } catch (err) {
    console.error("পরিসংখ্যান লোড এরর:", err);
  } finally {
    loadingStats.value = false;
  }
};

const fetchMembers = async () => {
  loadingMembers.value = true;
  try {
    const params = {};
    if (memberSearch.value) params.search = memberSearch.value;
    const res = await apiClient.get("/admin/members", { params });
    members.value = res.data.data.data;
  } catch (err) {
    console.error("মেম্বার লোড এরর:", err);
  } finally {
    loadingMembers.value = false;
  }
};

const handleToggleStatus = async (user) => {
  const actionText = user.status === "active" ? "ব্লক" : "সক্রিয়";
  if (!confirm(`আপনি কি এই পাঠককে ${actionText} করতে চান?`)) return;

  try {
    const res = await apiClient.post(`/admin/members/toggle-status/${user.id}`);
    alert(res.data.message);
    await fetchMembers();
  } catch (err) {
    alert(err.response?.data?.message || "স্ট্যাটাস পরিবর্তন করা যায়নি!");
  }
};

onMounted(() => {
  fetchStats();
  fetchMembers();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
    <div class="flex justify-between items-center border-b pb-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">
          পাঠাগার প্রশাসন ড্যাশবোর্ড
        </h1>
        <p class="text-sm text-slate-500">
          সার্বিক পরিসংখ্যান ও মেম্বার ব্যবস্থাপনা
        </p>
      </div>
      <div class="flex space-x-2">
        <RouterLink
          to="/admin/borrows"
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          বই বিতরণ ডেস্ক
        </RouterLink>
      </div>
    </div>

    <!-- Analytics Cards -->
    <div v-if="loadingStats" class="text-center py-6 text-slate-400">
      পরিসংখ্যান লোড হচ্ছে...
    </div>
    <div v-else-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <span
          class="text-xs font-semibold text-slate-400 uppercase tracking-wider"
          >মোট বইয়ের পদ</span
        >
        <div class="text-2xl font-bold text-slate-800 mt-1">
          {{ stats.counts.book_titles }} টি
        </div>
        <span class="text-xs text-slate-500"
          >মোট কপি: {{ stats.counts.total_copies }} টি</span
        >
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <span
          class="text-xs font-semibold text-emerald-600 uppercase tracking-wider"
          >মজুদ কপি</span
        >
        <div class="text-2xl font-bold text-emerald-700 mt-1">
          {{ stats.counts.available_copies }} টি
        </div>
        <span class="text-xs text-slate-500"
          >পড়ছেন: {{ stats.counts.borrowed_copies }} টি</span
        >
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <span
          class="text-xs font-semibold text-amber-600 uppercase tracking-wider"
          >অপেক্ষমান আবেদন</span
        >
        <div class="text-2xl font-bold text-amber-600 mt-1">
          {{ stats.counts.pending_requests }} টি
        </div>
        <RouterLink
          to="/admin/borrows"
          class="text-xs text-emerald-600 hover:underline"
          >অনুমোদন দিন &rarr;</RouterLink
        >
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <span
          class="text-xs font-semibold text-blue-600 uppercase tracking-wider"
          >নিবন্ধিত পাঠক</span
        >
        <div class="text-2xl font-bold text-blue-700 mt-1">
          {{ stats.counts.total_readers }} জন
        </div>
        <span class="text-xs text-slate-500"
          >মোট সম্পন্ন ঋণ: {{ stats.counts.total_returned }}</span
        >
      </div>
    </div>

    <!-- Recent Activities & Action Shortcut -->
    <div
      v-if="stats && stats.recent_activities.length > 0"
      class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs"
    >
      <h2 class="text-base font-bold text-slate-800 mb-4">
        সাম্প্রতিক আদান-প্রদান কার্যক্রম
      </h2>
      <div class="divide-y divide-slate-100">
        <div
          v-for="act in stats.recent_activities"
          :key="act.id"
          class="py-2.5 flex justify-between items-center text-sm"
        >
          <div>
            <span class="font-semibold text-slate-800">{{
              act.user?.name
            }}</span>
            <span class="text-slate-500"> — {{ act.book?.title }}</span>
          </div>
          <span
            :class="{
              'bg-amber-100 text-amber-800': act.status === 'pending',
              'bg-blue-100 text-blue-800': act.status === 'issued',
              'bg-emerald-100 text-emerald-800': act.status === 'returned',
              'bg-red-100 text-red-800': act.status === 'rejected',
            }"
            class="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider"
          >
            {{ act.status }}
          </span>
        </div>
      </div>
    </div>

    <!-- Member Management Section -->
    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
      <div
        class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6"
      >
        <div>
          <h2 class="text-lg font-bold text-slate-800">
            এলাকার নিবন্ধিত পাঠকবৃন্দ
          </h2>
          <p class="text-xs text-slate-500">
            পাঠকদের তথ্য ও অ্যাকাউন্ট নিয়ন্ত্রণ
          </p>
        </div>
        <div class="flex gap-2">
          <input
            v-model="memberSearch"
            @input="fetchMembers"
            type="text"
            placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
            class="border rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-50 text-slate-700 text-xs uppercase">
            <tr>
              <th class="py-3 px-4">নাম</th>
              <th class="py-3 px-4">মোবাইল ও ঠিকানা</th>
              <th class="py-3 px-4">বই আবেদন সংখ্যা</th>
              <th class="py-3 px-4">অবস্থা</th>
              <th class="py-3 px-4 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="member in members" :key="member.id">
              <td class="py-3 px-4">
                <div class="font-semibold text-slate-800">
                  {{ member.name }}
                </div>
                <div class="text-xs text-slate-400">{{ member.email }}</div>
              </td>
              <td class="py-3 px-4">
                <div class="text-slate-700 font-mono text-xs">
                  {{ member.phone }}
                </div>
                <div class="text-xs text-slate-400">
                  {{ member.address || "ঠিকানা নেই" }}
                </div>
              </td>
              <td class="py-3 px-4 font-semibold text-slate-700">
                {{ member.borrow_records_count }} বার
              </td>
              <td class="py-3 px-4">
                <span
                  :class="
                    member.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  "
                  class="px-2 py-0.5 rounded text-xs font-semibold"
                >
                  {{ member.status === "active" ? "সক্রিয়" : "স্থগিত" }}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <button
                  @click="handleToggleStatus(member)"
                  :class="
                    member.status === 'active'
                      ? 'text-red-500 hover:text-red-700'
                      : 'text-emerald-600 hover:text-emerald-800'
                  "
                  class="text-xs font-bold transition"
                >
                  {{ member.status === "active" ? "ব্লক করুন" : "আনব্লক করুন" }}
                </button>
              </td>
            </tr>
            <tr v-if="members.length === 0">
              <td colspan="5" class="text-center py-6 text-slate-400">
                কোনো পাঠক পাওয়া যায়নি।
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
