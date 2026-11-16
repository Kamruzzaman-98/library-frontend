<script setup>
import { ref, onMounted } from "vue";
import apiClient from "../api/axios";
import { useToastStore } from "../stores/toast";

const toast = useToastStore();
const activeTab = ref("borrows");

const borrows = ref([]);
const reservations = ref([]);
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

const fetchReservations = async () => {
  try {
    const res = await apiClient.get("/reservations");
    reservations.value = res.data.data;
  } catch (error) {
    console.error("রিজার্ভেশন লোড এরর:", error);
  }
};

onMounted(async () => {
  await Promise.all([fetchBorrows(), fetchReservations()]);
});

const handleIssue = async (id) => {
  try {
    const res = await apiClient.post(`/borrows/issue/${id}`, {
      days: 14,
    });
    toast.success(res.data.message);
    await fetchBorrows();
  } catch (error) {
    toast.error(error.response?.data?.message || "বই ইস্যু করা যায়নি!");
  }
};

const handleReturn = async (id) => {
  if (!confirm("বইটি কি অক্ষত অবস্থায় ফেরত পাওয়া গেছে?")) return;
  try {
    const res = await apiClient.post(`/borrows/return/${id}`);
    toast.success(res.data.message);
    await Promise.all([fetchBorrows(), fetchReservations()]);
  } catch (error) {
    toast.error(error.response?.data?.message || "রিটার্ন সম্পন্ন হয়নি!");
  }
};

const handleReject = async (id) => {
  if (!confirm("আপনি কি এই আবেদনটি বাতিল করতে চান?")) return;
  try {
    const res = await apiClient.post(`/borrows/reject/${id}`);
    toast.success(res.data.message);
    await fetchBorrows();
  } catch (error) {
    toast.error(error.response?.data?.message || "বাতিল করা যায়নি!");
  }
};

const handleIssueFromReservation = async (reservationId) => {
  try {
    const res = await apiClient.post(`/reservations/issue/${reservationId}`);
    toast.success(res.data.message);
    await Promise.all([fetchBorrows(), fetchReservations()]);
  } catch (error) {
    toast.error(error.response?.data?.message || "ইস্যু করা সম্ভব হয়নি!");
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Top Header & Tabs -->
    <div
      class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">বই বিতরণ ও জমা ডেস্ক</h1>
        <p class="text-sm text-slate-500">
          পাঠকদের বই ইস্যু, রিটার্ন এবং ওয়েটিং লিস্ট পরিচালনা করুন
        </p>
      </div>

      <div class="flex space-x-2">
        <button
          @click="activeTab = 'borrows'"
          :class="
            activeTab === 'borrows'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          "
          class="px-4 py-2 rounded-lg font-medium text-sm transition"
        >
          ইস্যু ও জমা তালিকা
        </button>

        <button
          @click="activeTab = 'reservations'"
          :class="
            activeTab === 'reservations'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          "
          class="px-4 py-2 rounded-lg font-medium text-sm transition flex items-center space-x-2"
        >
          <span>ওয়েটিং লিস্ট (Waitlist)</span>
          <span
            v-if="reservations.length > 0"
            class="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
          >
            {{ reservations.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- ==================== ট্যাব ১: ইস্যু ও জমা তালিকা ==================== -->
    <div
      v-if="activeTab === 'borrows'"
      class="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden"
    >
      <div
        class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
      >
        <span class="text-sm font-semibold text-slate-700"
          >আদান-প্রদান রেকর্ড</span
        >
        <select
          v-model="filterStatus"
          @change="fetchBorrows"
          class="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">সব স্ট্যাটাস</option>
          <option value="pending">পেন্ডিং আবেদন</option>
          <option value="issued">ইস্যুকৃত (পড়ছে)</option>
          <option value="returned">ফেরত এসেছে</option>
        </select>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-50 text-slate-700 text-xs uppercase">
            <tr>
              <th class="py-3 px-4">পাঠক ও মেম্বার ID</th>
              <th class="py-3 px-4">বই ও শেলফ</th>
              <th class="py-3 px-4">ডিউ ডেট</th>
              <th class="py-3 px-4">জরিমানা</th>
              <th class="py-3 px-4">স্ট্যাটাস</th>
              <th class="py-3 px-4 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in borrows"
              :key="item.id"
              class="hover:bg-slate-50/70"
            >
              <td class="py-3 px-4">
                <div class="font-semibold text-slate-800">
                  {{ item.user?.name }}
                </div>
                <div class="text-xs text-slate-500 font-mono">
                  {{ item.user?.member_code || item.user?.phone }}
                </div>
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
              <td
                class="py-3 px-4 font-bold text-xs"
                :class="
                  item.fine_amount > 0 ? 'text-red-600' : 'text-slate-400'
                "
              >
                {{ item.fine_amount > 0 ? `${item.fine_amount} ৳` : "০ ৳" }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="{
                    'bg-amber-100 text-amber-800': item.status === 'pending',
                    'bg-blue-100 text-blue-800': item.status === 'issued',
                    'bg-emerald-100 text-emerald-800':
                      item.status === 'returned',
                    'bg-red-100 text-red-800': item.status === 'rejected',
                  }"
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                >
                  {{ item.status }}
                </span>
              </td>
              <td class="py-3 px-4 text-right space-x-2">
                <template v-if="item.status === 'pending'">
                  <button
                    @click="handleIssue(item.id)"
                    class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition"
                  >
                    ইস্যু অনুমোদন
                  </button>
                  <button
                    @click="handleReject(item.id)"
                    class="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-medium transition"
                  >
                    বাতিল
                  </button>
                </template>

                <template v-else-if="item.status === 'issued'">
                  <button
                    @click="handleReturn(item.id)"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition"
                  >
                    ফেরত গ্রহণ করুন
                  </button>
                </template>

                <span v-else class="text-xs text-slate-400">সম্পন্ন</span>
              </td>
            </tr>
            <tr v-if="borrows.length === 0">
              <td colspan="6" class="text-center py-8 text-slate-400">
                কোনো রেকর্ড পাওয়া যায়নি।
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== ট্যাব ২: ওয়েটিং লিস্ট (Reservations) ==================== -->
    <div
      v-if="activeTab === 'reservations'"
      class="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden"
    >
      <div class="p-4 border-b border-slate-100 bg-amber-50/40">
        <h2 class="text-sm font-bold text-slate-800">
          বই রিজার্ভেশন সিরিয়াল তালিকা
        </h2>
        <p class="text-xs text-slate-500">
          বই ফেরত আসার সাথে সাথে ১ম সিরিয়ালের পাঠক স্বয়ংক্রিয়ভাবে নোটিফাইড হবেন।
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-50 text-slate-700 text-xs uppercase">
            <tr>
              <th class="py-3 px-4">পাঠক ও ফোন</th>
              <th class="py-3 px-4">রিজার্ভকৃত বই</th>
              <th class="py-3 px-4">আবেদনের সময়</th>
              <th class="py-3 px-4">অবস্থা</th>
              <th class="py-3 px-4 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="res in reservations"
              :key="res.id"
              class="hover:bg-slate-50/70"
            >
              <td class="py-3 px-4">
                <div class="font-semibold text-slate-800">
                  {{ res.user?.name }}
                </div>
                <div class="text-xs text-slate-500 font-mono">
                  {{ res.user?.phone }} ({{ res.user?.member_code }})
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="font-semibold text-slate-800">
                  {{ res.book?.title }}
                </div>
                <div class="text-xs text-slate-400">
                  মজুদ কপি: {{ res.book?.available_copies }} টি
                </div>
              </td>
              <td class="py-3 px-4 text-xs font-mono">
                {{ new Date(res.created_at).toLocaleDateString("bn-BD") }}
              </td>
              <td class="py-3 px-4">
                <span
                  v-if="res.status === 'notified'"
                  class="px-2.5 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold"
                >
                  বই মজুদ আছে (Notified)
                </span>
                <span
                  v-else
                  class="px-2.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-medium"
                >
                  অপেক্ষমান (Waiting)
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <button
                  v-if="res.book?.available_copies > 0"
                  @click="handleIssueFromReservation(res.id)"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition"
                >
                  সরাসরি ইস্যু করুন
                </button>
                <span v-else class="text-xs text-slate-400"
                  >বই ফেরতের অপেক্ষায়</span
                >
              </td>
            </tr>
            <tr v-if="reservations.length === 0">
              <td colspan="5" class="text-center py-8 text-slate-400">
                বর্তমানে কোনো বইয়ের ওয়েটিং লিস্ট নেই।
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
