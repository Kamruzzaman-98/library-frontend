<script setup>
import { ref, computed, onMounted } from "vue";
import apiClient from "../api/axios";
import { useToastStore } from "../stores/toast";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "vue-chartjs";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
);

const toast = useToastStore();
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
    const res = await apiClient.post(`/admin/members/${user.id}/toggle-status`);
    toast.success(res.data.message);
    await fetchMembers();
  } catch (err) {
    toast.error(err.response?.data?.message || "স্ট্যাটাস পরিবর্তন করা যায়নি!");
  }
};

// Bar Chart ডেটা (মাসিক বই বিতরণ)
const barChartData = computed(() => {
  if (!stats.value?.monthly_borrows) return { labels: [], datasets: [] };
  return {
    labels: stats.value.monthly_borrows.map((m) => m.month),
    datasets: [
      {
        label: "মাসিক বই আবেদন/বিতরণ",
        backgroundColor: "#059669",
        borderRadius: 6,
        data: stats.value.monthly_borrows.map((m) => m.count),
      },
    ],
  };
});

// Doughnut Chart ডেটা (ক্যাটাগরি অনুযায়ী বই)
const doughnutChartData = computed(() => {
  if (!stats.value?.category_stats) return { labels: [], datasets: [] };
  return {
    labels: stats.value.category_stats.map((c) => c.name),
    datasets: [
      {
        backgroundColor: [
          "#059669",
          "#0284c7",
          "#d97706",
          "#7c3aed",
          "#e11d48",
          "#475569",
        ],
        data: stats.value.category_stats.map((c) => c.books_count),
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

onMounted(() => {
  fetchStats();
  fetchMembers();
});
</script>

<template>
  <div class="space-y-8">
    <!-- Top Header -->
    <div
      class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">
          পাঠাগার প্রশাসন ড্যাশবোর্ড
        </h1>
        <p class="text-sm text-slate-500">
          সার্বিক পরিসংখ্যান, জরিমানা সতর্কতা ও মেম্বার ব্যবস্থাপনা
        </p>
      </div>
      <RouterLink
        to="/admin/borrows"
        class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition text-center"
      >
        বই বিতরণ ডেস্ক &rarr;
      </RouterLink>
    </div>

    <!-- Analytics Summary Cards -->
    <div v-if="loadingStats" class="text-center py-8 text-slate-400">
      পরিসংখ্যান লোড হচ্ছে...
    </div>
    <template v-else-if="stats">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span class="text-xs font-semibold text-slate-400 uppercase"
            >মোট বইয়ের পদ</span
          >
          <div class="text-2xl font-bold text-slate-800 mt-1">
            {{ stats.counts.book_titles }} টি
          </div>
          <span class="text-xs text-slate-500"
            >মোট কপি: {{ stats.counts.total_copies }} টি</span
          >
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span class="text-xs font-semibold text-emerald-600 uppercase"
            >শেলফে মজুদ</span
          >
          <div class="text-2xl font-bold text-emerald-700 mt-1">
            {{ stats.counts.available_copies }} টি
          </div>
          <span class="text-xs text-slate-500"
            >পাঠকের কাছে: {{ stats.counts.borrowed_copies }} টি</span
          >
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span class="text-xs font-semibold text-amber-600 uppercase"
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

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span class="text-xs font-semibold text-red-600 uppercase"
            >মেয়াদোত্তীর্ণ (Overdue)</span
          >
          <div class="text-2xl font-bold text-red-600 mt-1">
            {{ stats.counts.overdue_count }} টি
          </div>
          <span class="text-xs text-slate-500"
            >নিবন্ধিত পাঠক: {{ stats.counts.total_readers }} জন</span
          >
        </div>
      </div>

      <!-- Visual Analytics Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs"
        >
          <h2 class="text-base font-bold text-slate-800 mb-4">
            মাসিক বই আদান-প্রদান পরিসংখ্যান
          </h2>
          <div class="h-64">
            <Bar :data="barChartData" :options="chartOptions" />
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <h2 class="text-base font-bold text-slate-800 mb-4">
            ক্যাটাগরি ভিত্তিক বই
          </h2>
          <div class="h-64">
            <Doughnut :data="doughnutChartData" :options="chartOptions" />
          </div>
        </div>
      </div>

      <!-- Automated Overdue & Fine Alerts Section -->
      <div
        v-if="stats.overdue_records.length > 0"
        class="bg-red-50 border border-red-200 rounded-xl p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-red-800">
            মেয়াদোত্তীর্ণ বই ও বকেয়া জরিমানার তালিকা (দিনপ্রতি ৫৳)
          </h2>
          <span
            class="text-xs bg-red-600 text-white px-2.5 py-1 rounded-full font-semibold"
          >
            {{ stats.overdue_records.length }} জন বকেয়া
          </span>
        </div>
        <div class="overflow-x-auto bg-white rounded-lg border border-red-100">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-red-100/60 text-red-900 text-xs uppercase">
              <tr>
                <th class="py-2.5 px-4">পাঠক ও ফোন</th>
                <th class="py-2.5 px-4">বইয়ের নাম</th>
                <th class="py-2.5 px-4">ডিউ ডেট</th>
                <th class="py-2.5 px-4">বিলম্ব</th>
                <th class="py-2.5 px-4 text-right">মোট জরিমানা</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-red-50">
              <tr v-for="item in stats.overdue_records" :key="item.id">
                <td class="py-2.5 px-4">
                  <div class="font-semibold text-slate-800">
                    {{ item.user?.name }}
                  </div>
                  <div class="text-xs font-mono text-slate-500">
                    {{ item.user?.phone }}
                  </div>
                </td>
                <td class="py-2.5 px-4 font-medium">{{ item.book?.title }}</td>
                <td class="py-2.5 px-4 font-mono text-xs text-red-600">
                  {{ item.due_date }}
                </td>
                <td class="py-2.5 px-4 text-red-600 font-semibold">
                  {{ item.overdue_days }} দিন
                </td>
                <td class="py-2.5 px-4 text-right font-bold text-red-700">
                  {{ item.fine_amount }} ৳
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Member Management Table -->
    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
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
        <input
          v-model="memberSearch"
          @input="fetchMembers"
          type="text"
          placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
          class="border rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-50 text-slate-700 text-xs uppercase">
            <tr>
              <th class="py-3 px-4">নাম</th>
              <th class="py-3 px-4">মোবাইল ও ঠিকানা</th>
              <th class="py-3 px-4">বই গ্রহণ</th>
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
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
