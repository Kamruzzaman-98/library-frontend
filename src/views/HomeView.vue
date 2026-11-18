<script setup>
import { ref, reactive, onMounted } from "vue";
import { useSettingStore } from "../stores/setting";
import { useToastStore } from "../stores/toast";
import apiClient from "../api/axios";
import { useAuthStore } from "../stores/auth";

const settingStore = useSettingStore();
const toast = useToastStore();
const authStore = useAuthStore();
const storageUrl =
  import.meta.env.VITE_STORAGE_BASE_URL || "http://127.0.0.1:8000";

const notices = ref([]);
const donors = ref([]);
const committee = ref([]);

const isDonateModalOpen = ref(false);
const donating = ref(false);
const donateForm = reactive({
  donor_name: "",
  phone: "",
  address: "",
  donation_type: "book",
  amount_or_details: "",
  message: "",
});

const fetchHomeData = async () => {
  try {
    const [noticeRes, commRes] = await Promise.all([
      apiClient.get("/notices"),
      apiClient.get("/community"),
    ]);
    notices.value = noticeRes.data.data;
    donors.value = commRes.data.data.donors;
    committee.value = commRes.data.data.committee;
  } catch (err) {
    console.error("হোম ডেটা লোড এরর:", err);
  }
};

// অনুদান Modal খোলার আগে লগইন করা ইউজারের তথ্য অটো-ফিল
const openDonateModal = () => {
  donateForm.donor_name = authStore.user?.name || "";
  donateForm.phone = authStore.user?.phone || "";
  donateForm.address = authStore.user?.address || "";

  donateForm.donation_type = "book";
  donateForm.amount_or_details = "";
  donateForm.message = "";

  isDonateModalOpen.value = true;
};

const handlePublicDonate = async () => {
  donating.value = true;
  try {
    const res = await apiClient.post("/donations", donateForm);
    toast.success(res.data.message);
    isDonateModalOpen.value = false;
    Object.assign(donateForm, {
      donor_name: "",
      phone: "",
      address: "",
      donation_type: "book",
      amount_or_details: "",
      message: "",
    });
  } catch (err) {
    toast.error(err.response?.data?.message || "আবেদন জমা দেওয়া যায়নি!");
  } finally {
    donating.value = false;
  }
};

onMounted(() => {
  settingStore.fetchSettings();
  fetchHomeData();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <!-- হিরো সেকশন -->
    <header
      class="bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900 text-white py-16 px-4 text-center"
    >
      <div class="max-w-3xl mx-auto">
        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight">
          {{ settingStore.settings.library_name || "পাঠাগার" }}
        </h1>
        <p class="mt-4 text-emerald-100 text-base sm:text-lg">
          {{ settingStore.settings.tagline }}
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <RouterLink
            to="/books"
            class="bg-white text-emerald-900 font-bold px-6 py-3 rounded-xl shadow-md hover:bg-emerald-50 transition"
          >
            বইয়ের ক্যাটালগ দেখুন
          </RouterLink>
          <button
            @click="openDonateModal"
            class="bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-400/50 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            বই বা অর্থ অনুদান দিন
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto py-12 px-4 space-y-12">
      <!-- ১. জরুরি নোটিশ বোর্ড -->
      <section
        v-if="notices.length > 0"
        class="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl shadow-2xs"
      >
        <div class="flex items-center space-x-2 mb-3">
          <span
            class="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"
          ></span>
          <h2 class="text-xl font-bold text-amber-900">জরুরি নোটিশ বোর্ড</h2>
        </div>
        <div class="space-y-4">
          <div
            v-for="notice in notices"
            :key="notice.id"
            class="bg-white p-4 rounded-lg border border-amber-200 shadow-2xs"
          >
            <div class="flex justify-between items-center mb-1">
              <h3 class="font-bold text-slate-800">{{ notice.title }}</h3>
              <span class="text-xs text-slate-400 font-mono">{{
                notice.published_at
              }}</span>
            </div>
            <p class="text-sm text-slate-600 whitespace-pre-line">
              {{ notice.content }}
            </p>
          </div>
        </div>
      </section>

      <!-- ২. লক্ষ্য ও উদ্দেশ্য -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section
          class="bg-white p-6 rounded-2xl shadow-2xs border border-slate-200"
        >
          <h2 class="text-xl font-bold text-emerald-800 mb-2">আমাদের লক্ষ্য</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            {{ settingStore.settings.mission }}
          </p>
        </section>

        <section
          class="bg-white p-6 rounded-2xl shadow-2xs border border-slate-200"
        >
          <h2 class="text-xl font-bold text-emerald-800 mb-2">উদ্দেশ্য</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            {{ settingStore.settings.vision }}
          </p>
        </section>
      </div>

      <!-- ৩. পরিচালনা পর্ষদ (Committee Members) -->
      <section v-if="committee.length > 0" class="space-y-6">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-slate-800">পরিচালনা পর্ষদ</h2>
          <p class="text-sm text-slate-500 mt-1">
            পাঠাগার পরিচালনায় নিয়োজিত কার্যনির্বাহী কমিটি
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div
            v-for="member in committee"
            :key="member.id"
            class="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-2xs hover:shadow-md transition"
          >
            <img
              v-if="member.photo"
              :src="storageUrl + member.photo"
              class="w-20 h-20 rounded-full object-cover mx-auto border-2 border-emerald-600 mb-3"
            />
            <div
              v-else
              class="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-2xl mx-auto mb-3"
            >
              {{ member.name.charAt(0) }}
            </div>
            <h3 class="font-bold text-slate-800">{{ member.name }}</h3>
            <p class="text-xs font-semibold text-emerald-700 mt-0.5">
              {{ member.designation }}
            </p>
            <p class="text-[11px] text-slate-400 mt-1">
              মেয়াদ: {{ member.session_year || "বর্তমান" }}
            </p>
          </div>
        </div>
      </section>

      <!-- ৪. সম্মানিত দাতা সদস্যবৃন্দ (Donors Wall) -->
      <section
        v-if="donors.length > 0"
        class="bg-emerald-900 text-white p-8 rounded-3xl shadow-lg space-y-6"
      >
        <div
          class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-emerald-800 pb-4"
        >
          <div>
            <h2 class="text-2xl font-bold">
              আমাদের সম্মানিত দাতা সদস্যবৃন্দ (Donors Wall)
            </h2>
            <p class="text-xs sm:text-sm text-emerald-200 mt-1">
              যাদের বই ও আর্থিক অনুদানে সমৃদ্ধ হচ্ছে আমাদের পাঠাগার
            </p>
          </div>
          <button
            @click="openDonateModal"
            class="bg-white text-emerald-900 font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-emerald-50 transition shrink-0"
          >
            + অনুদান প্রদান করুন
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="donor in donors"
            :key="donor.id"
            class="bg-emerald-800/60 border border-emerald-700/70 p-4 rounded-xl"
          >
            <div class="flex justify-between items-start">
              <h3 class="font-bold text-base text-white">
                {{ donor.donor_name }}
              </h3>
              <span
                class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300"
              >
                {{
                  donor.donation_type === "book" ? "বই অনুদান" : "আর্থিক অনুদান"
                }}
              </span>
            </div>
            <p class="text-xs text-emerald-200 mt-0.5">
              {{ donor.address || "শুভানুধ্যায়ী" }}
            </p>
            <div class="mt-3 text-sm font-semibold text-amber-300">
              {{ donor.amount_or_details }}
            </div>
          </div>
        </div>
      </section>

      <!-- যোগাযোগ ও ঠিকানা -->
      <section
        class="bg-white border border-slate-200 p-6 rounded-2xl text-sm text-slate-600 flex flex-col sm:flex-row justify-between gap-4"
      >
        <div>
          <p><strong>ঠিকানা:</strong> {{ settingStore.settings.address }}</p>
          <p class="mt-1">
            <strong>যোগাযোগ:</strong> {{ settingStore.settings.phone }}
          </p>
        </div>
        <div class="text-xs text-slate-400 self-end">
          সবার জন্য উন্মুক্ত কমিউনিটি পাঠাগার
        </div>
      </section>
    </main>

    <!-- পাবলিক / রিডার অনুদান আবেদন Modal -->
    <div
      v-if="isDonateModalOpen"
      style="
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.65);
        z-index: 60;
      "
      class="flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div class="flex justify-between items-center border-b pb-3">
          <h3 class="text-lg font-bold text-slate-800">
            পাঠাগারে বই বা অর্থ অনুদান দিন
          </h3>

          <button
            @click="isDonateModalOpen = false"
            class="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form @submit.prevent="handlePublicDonate" class="space-y-3.5">
          <div>
            <label class="block text-sm font-medium text-slate-700">
              আপনার নাম *
            </label>

            <input
              v-model="donateForm.donor_name"
              type="text"
              required
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700">
                মোবাইল নম্বর *
              </label>

              <input
                v-model="donateForm.phone"
                type="text"
                required
                placeholder="017XXXXXXXX"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">
                অনুদানের ধরন *
              </label>

              <select
                v-model="donateForm.donation_type"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
              >
                <option value="book">বই অনুদান</option>
                <option value="money">আর্থিক অনুদান</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">
              বইয়ের সংখ্যা বা অনুদানের পরিমাণ *
            </label>

            <input
              v-model="donateForm.amount_or_details"
              type="text"
              required
              placeholder="যেমন: ১০টি গল্পের বই / ২,০০০ টাকা"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">
              ঠিকানা
            </label>

            <input
              v-model="donateForm.address"
              type="text"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>

          <!-- নতুন শুভেচ্ছা বার্তা ফিল্ড -->
          <div>
            <label class="block text-sm font-medium text-slate-700">
              শুভেচ্ছা বার্তা (ঐচ্ছিক)
            </label>

            <textarea
              v-model="donateForm.message"
              rows="2"
              placeholder="পাঠাগারের জন্য আপনার কোনো বার্তা..."
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
            ></textarea>
          </div>

          <div class="flex justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              @click="isDonateModalOpen = false"
              class="px-4 py-2 text-sm bg-slate-100 rounded-lg"
            >
              বাতিল
            </button>

            <button
              type="submit"
              :disabled="donating"
              class="px-5 py-2 text-sm bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
            >
              {{ donating ? "জমা হচ্ছে..." : "আবেদন পাঠান" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
