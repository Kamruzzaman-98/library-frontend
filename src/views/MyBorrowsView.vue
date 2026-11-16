<script setup>
import { ref, computed, onMounted } from "vue";
import QrcodeVue from "qrcode.vue";
import apiClient from "../api/axios";
import { useAuthStore } from "../stores/auth";
import { useSettingStore } from "../stores/setting";
import { useToastStore } from "../stores/toast";

const authStore = useAuthStore();
const settingStore = useSettingStore();
const toast = useToastStore();

const records = ref([]);
const reservations = ref([]);
const loading = ref(false);

const memberCode = computed(() => {
  if (authStore.user?.member_code) return authStore.user.member_code;
  const id = String(authStore.user?.id || 1).padStart(4, "0");
  return `LIB-${new Date().getFullYear()}-${id}`;
});

// QR কোডে এনকোড করা তথ্য
const qrPayload = computed(() => {
  return JSON.stringify({
    id: memberCode.value,
    name: authStore.user?.name,
    phone: authStore.user?.phone,
  });
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [borrowRes, reserveRes] = await Promise.all([
      apiClient.get("/my-borrows"),
      apiClient.get("/my-reservations"),
    ]);
    records.value = borrowRes.data.data;
    reservations.value = reserveRes.data.data;
  } catch (err) {
    console.error("তথ্য লোড এরর:", err);
  } finally {
    loading.value = false;
  }
};

const handleCancelReservation = async (id) => {
  if (!confirm("আপনি কি এই বইয়ের রিজার্ভেশন বাতিল করতে চান?")) return;
  try {
    const res = await apiClient.post(`/reservations/cancel/${id}`);
    toast.success(res.data.message);
    await fetchData();
  } catch (err) {
    toast.error("বাতিল করা যায়নি!");
  }
};

const handleClaimReservedBook = async (bookId) => {
  try {
    const res = await apiClient.post("/borrow-request", { book_id: bookId });
    toast.success(res.data.message);
    await fetchData();
  } catch (error) {
    toast.error(error.response?.data?.message || "আবেদন সম্পন্ন করা যায়নি!");
  }
};

const printIdCard = () => {
  window.print();
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 space-y-8">
    <!-- ১. ডিজিটাল মেম্বারশিপ আইডি কার্ড সেকশন -->
    <div
      class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6"
    >
      <!-- আইডি কার্ড ডিজাইন -->
      <div
        id="member-id-card"
        class="w-full max-w-md bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden"
      >
        <div
          class="flex justify-between items-start border-b border-white/15 pb-3 mb-4"
        >
          <div>
            <div
              class="text-[10px] uppercase tracking-widest text-emerald-200 font-semibold"
            >
              সদস্য পরিচয়পত্র
            </div>
            <h2 class="text-base font-bold leading-tight">
              {{
                settingStore.settings.library_name || "কমিউনিটি ডিজিটাল পাঠাগার"
              }}
            </h2>
          </div>
          <span
            class="text-xs font-mono bg-white/15 px-2.5 py-1 rounded-md font-bold"
          >
            {{ memberCode }}
          </span>
        </div>

        <div class="flex items-center justify-between gap-4">
          <div class="space-y-1.5 text-xs">
            <div>
              <span class="text-emerald-200 block text-[10px]">পাঠকের নাম</span>
              <span class="font-bold text-sm">{{ authStore.user?.name }}</span>
            </div>
            <div>
              <span class="text-emerald-200 block text-[10px]"
                >মোবাইল নম্বর</span
              >
              <span class="font-mono">{{ authStore.user?.phone }}</span>
            </div>
            <div v-if="authStore.user?.address">
              <span class="text-emerald-200 block text-[10px]">ঠিকানা</span>
              <span class="text-slate-200">{{ authStore.user?.address }}</span>
            </div>
          </div>

          <!-- স্ক্যানযোগ্য QR Code -->
          <div class="bg-white p-2 rounded-xl shrink-0 shadow-inner">
            <QrcodeVue :value="qrPayload" :size="82" level="M" />
          </div>
        </div>
      </div>

      <!-- কার্ড নির্দেশনা ও প্রিন্ট বাটন -->
      <div class="flex-1 space-y-3 text-center md:text-left">
        <h3 class="text-lg font-bold text-slate-800">
          আপনার ডিজিটাল লাইব্রেরি কার্ড
        </h3>
        <p class="text-sm text-slate-500 leading-relaxed">
          পাঠাগার থেকে বই সংগ্রহ বা ফেরত দেওয়ার সময় আপনার এই ডিজিটাল আইডি
          কার্ডের QR কোড অথবা মেম্বার আইডি (<strong>{{ memberCode }}</strong
          >) প্রদর্শন করুন।
        </p>
        <button
          @click="printIdCard"
          class="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition"
        >
          <span>আইডি কার্ড প্রিন্ট / PDF সেভ করুন</span>
        </button>
      </div>
    </div>

    <!-- ২. আমার ওয়েটিং লিস্ট (Book Reservations) -->
    <div
      v-if="reservations.length > 0"
      class="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden"
    >
      <div class="px-6 py-4 border-b border-slate-100 bg-amber-50/50">
        <h2 class="text-base font-bold text-slate-800">
          আমার রিজার্ভকৃত বইসমূহ (Waitlist)
        </h2>
      </div>
      <table class="w-full text-left text-sm text-slate-600">
        <thead class="bg-slate-50 text-slate-700 text-xs uppercase">
          <tr>
            <th class="py-3 px-4">বইয়ের নাম</th>
            <th class="py-3 px-4">লেখক</th>
            <th class="py-3 px-4">স্ট্যাটাস</th>
            <th class="py-3 px-4 text-right">অ্যাকশন</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="res in reservations" :key="res.id">
            <td class="py-3 px-4 font-semibold text-slate-800">
              {{ res.book?.title }}
            </td>
            <td class="py-3 px-4">{{ res.book?.author }}</td>
            <td class="py-3 px-4">
              <span
                v-if="res.status === 'notified'"
                class="px-2.5 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold animate-pulse"
              >
                বইটি ফেরত এসেছে! সংগ্রহ করুন
              </span>
              <span
                v-else-if="res.status === 'waiting'"
                class="px-2.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-medium"
              >
                সিরিয়ালে অপেক্ষমান
              </span>
              <span
                v-else
                class="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500"
              >
                {{ res.status }}
              </span>
            </td>
            <td class="py-3 px-4 text-right space-x-3">
              <button
                v-if="res.status === 'notified'"
                @click="handleClaimReservedBook(res.book_id)"
                class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-semibold"
              >
                পড়ার আবেদন করুন
              </button>
              <button
                v-if="res.status === 'waiting' || res.status === 'notified'"
                @click="handleCancelReservation(res.id)"
                class="text-xs text-red-500 hover:underline font-semibold"
              >
                বাতিল করুন
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ৩. আমার বই সংগ্রহের হিস্ট্রি -->
    <div
      class="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden"
    >
      <div class="px-6 py-4 border-b border-slate-100">
        <h2 class="text-base font-bold text-slate-800">
          আমার বই সংগ্রহের হিস্ট্রি
        </h2>
      </div>

      <div v-if="loading" class="text-center py-8 text-slate-500">
        লোড হচ্ছে...
      </div>
      <div
        v-else-if="records.length === 0"
        class="text-center py-8 text-slate-400 p-6"
      >
        আপনি এখনও কোনো বইয়ের জন্য আবেদন করেননি।
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-50 text-slate-700 text-xs uppercase">
            <tr>
              <th class="py-3 px-4">বইয়ের নাম</th>
              <th class="py-3 px-4">ইস্যুর তারিখ</th>
              <th class="py-3 px-4">ফেরতের শেষ তারিখ</th>
              <th class="py-3 px-4">বকেয়া জরিমানা</th>
              <th class="py-3 px-4">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in records" :key="item.id">
              <td class="py-3 px-4">
                <div class="font-semibold text-slate-800">
                  {{ item.book?.title }}
                </div>
                <div class="text-xs text-slate-400">
                  {{ item.book?.author }}
                </div>
              </td>
              <td class="py-3 px-4">{{ item.issue_date || "---" }}</td>
              <td class="py-3 px-4 font-medium text-amber-700">
                {{ item.due_date || "---" }}
              </td>
              <td
                class="py-3 px-4 font-bold"
                :class="
                  item.fine_amount > 0 ? 'text-red-600' : 'text-slate-400'
                "
              >
                {{
                  item.fine_amount > 0
                    ? `${item.fine_amount} ৳ (${item.overdue_days} দিন)`
                    : "০ ৳"
                }}
              </td>
              <td class="py-3 px-4">
                <span
                  v-if="item.status === 'pending'"
                  class="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 font-medium"
                  >আবেদন পেন্ডিং</span
                >
                <span
                  v-else-if="item.status === 'issued'"
                  class="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-medium"
                  >পড়ছেন (হাতে আছে)</span
                >
                <span
                  v-else-if="item.status === 'returned'"
                  class="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 font-medium"
                  >ফেরত দেওয়া হয়েছে</span
                >
                <span
                  v-else
                  class="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 font-medium"
                  >বাতিল</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
