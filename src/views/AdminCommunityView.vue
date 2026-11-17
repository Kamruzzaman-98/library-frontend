<script setup>
import { ref, reactive, onMounted } from "vue";
import apiClient from "../api/axios";
import { useToastStore } from "../stores/toast";

const toast = useToastStore();
const storageUrl =
  import.meta.env.VITE_STORAGE_BASE_URL || "http://127.0.0.1:8000";

const activeTab = ref("donors"); // 'donors' অথবা 'committee'
const donations = ref([]);
const committee = ref([]);
const submitting = ref(false);

const donorForm = reactive({
  donor_name: "",
  phone: "",
  address: "",
  donation_type: "book",
  amount_or_details: "",
  message: "",
});

const committeeForm = reactive({
  name: "",
  designation: "",
  phone: "",
  session_year: "২০২৬-২০২৮",
  display_order: 1,
});
const photoFile = ref(null);

const fetchAll = async () => {
  try {
    const [donorRes, commRes] = await Promise.all([
      apiClient.get("/admin/donations"),
      apiClient.get("/community"),
    ]);
    donations.value = donorRes.data.data;
    committee.value = commRes.data.data.committee;
  } catch (err) {
    console.error("তথ্য লোড এরর:", err);
  }
};

onMounted(() => {
  fetchAll();
});

const handleAddDonor = async () => {
  submitting.value = true;
  try {
    const res = await apiClient.post("/admin/donations", donorForm);
    toast.success(res.data.message);
    Object.assign(donorForm, {
      donor_name: "",
      phone: "",
      address: "",
      donation_type: "book",
      amount_or_details: "",
      message: "",
    });
    await fetchAll();
  } catch (err) {
    toast.error(err.response?.data?.message || "সংরক্ষণ করা যায়নি!");
  } finally {
    submitting.value = false;
  }
};

const handleApproveDonor = async (id) => {
  try {
    const res = await apiClient.post(`/admin/donations/${id}/approve`);
    toast.success(res.data.message);
    await fetchAll();
  } catch (err) {
    toast.error("অনুমোদন ব্যর্থ হয়েছে!");
  }
};

const handleDeleteDonor = async (id) => {
  if (!confirm("আপনি কি নিশ্চিত এই রেকর্ডটি মুছে ফেলতে চান?")) return;
  try {
    const res = await apiClient.delete(`/admin/donations/${id}`);
    toast.success(res.data.message);
    await fetchAll();
  } catch (err) {
    toast.error("মোছা যায়নি!");
  }
};

const handleAddCommittee = async () => {
  submitting.value = true;
  try {
    const formData = new FormData();
    Object.keys(committeeForm).forEach((key) => {
      formData.append(key, committeeForm[key]);
    });
    if (photoFile.value) {
      formData.append("photo", photoFile.value);
    }

    const res = await apiClient.post("/admin/committee", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success(res.data.message);
    Object.assign(committeeForm, {
      name: "",
      designation: "",
      phone: "",
      session_year: "২০২৬-২০২৮",
      display_order: committee.value.length + 2,
    });
    photoFile.value = null;
    await fetchAll();
  } catch (err) {
    toast.error(err.response?.data?.message || "সদস্য যোগ করা যায়নি!");
  } finally {
    submitting.value = false;
  }
};

const handleDeleteCommittee = async (id) => {
  if (!confirm("এই সদস্যকে পরিচালনা পর্ষদ থেকে মুছে ফেলতে চান?")) return;
  try {
    const res = await apiClient.delete(`/admin/committee/${id}`);
    toast.success(res.data.message);
    await fetchAll();
  } catch (err) {
    toast.error("মোছা যায়নি!");
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
        <h1 class="text-2xl font-bold text-slate-800">
          অনুদান ও পরিচালনা পর্ষদ
        </h1>
        <p class="text-sm text-slate-500">
          দাতা সদস্যদের সম্মাননা তালিকা এবং কার্যনির্বাহী কমিটি পরিচালনা করুন
        </p>
      </div>

      <div class="flex space-x-2">
        <button
          @click="activeTab = 'donors'"
          :class="
            activeTab === 'donors'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          "
          class="px-4 py-2 rounded-lg font-medium text-sm transition"
        >
          দাতা সদস্যবৃন্দ ({{ donations.length }})
        </button>
        <button
          @click="activeTab = 'committee'"
          :class="
            activeTab === 'committee'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          "
          class="px-4 py-2 rounded-lg font-medium text-sm transition"
        >
          পরিচালনা পর্ষদ ({{ committee.length }})
        </button>
      </div>
    </div>

    <!-- ==================== ট্যাব ১: দাতা ও অনুদান ম্যানেজমেন্ট ==================== -->
    <div
      v-if="activeTab === 'donors'"
      class="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <!-- সরাসরি দাতা যোগ করার ফর্ম -->
      <div
        class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs h-fit"
      >
        <h2 class="text-lg font-bold text-slate-800 mb-4">
          নতুন দাতা যুক্ত করুন
        </h2>
        <form @submit.prevent="handleAddDonor" class="space-y-3.5">
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >দাতার নাম *</label
            >
            <input
              v-model="donorForm.donor_name"
              type="text"
              required
              placeholder="যেমন: আলহাজ্ব আব্দুর রহমান"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >অনুদানের ধরন *</label
              >
              <select
                v-model="donorForm.donation_type"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
              >
                <option value="book">বই অনুদান</option>
                <option value="money">আর্থিক অনুদান</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >মোবাইল</label
              >
              <input
                v-model="donorForm.phone"
                type="text"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >পরিমাণ বা বইয়ের বিবরণ *</label
            >
            <input
              v-model="donorForm.amount_or_details"
              type="text"
              required
              placeholder="যেমন: ২৫টি মুক্তিযুদ্ধের বই / ১০,০০০ টাকা"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >ঠিকানা / পরিচয়</label
            >
            <input
              v-model="donorForm.address"
              type="text"
              placeholder="যেমন: উত্তরপাড়া, ঢাকা"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>

          <button
            type="submit"
            :disabled="submitting"
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm transition"
          >
            {{ submitting ? "যুক্ত হচ্ছে..." : "Donors Wall-এ যুক্ত করুন" }}
          </button>
        </form>
      </div>

      <!-- অনুদানের তালিকা -->
      <div
        class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs"
      >
        <h2 class="text-lg font-bold text-slate-800 mb-4">
          সকল অনুদান ও আবেদন তালিকা
        </h2>
        <div class="overflow-x-auto border border-slate-100 rounded-lg">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-700 text-xs uppercase">
              <tr>
                <th class="py-3 px-4">দাতার নাম ও পরিচয়</th>
                <th class="py-3 px-4">ধরন ও বিবরণ</th>
                <th class="py-3 px-4">স্ট্যাটাস</th>
                <th class="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in donations"
                :key="item.id"
                class="hover:bg-slate-50/70"
              >
                <td class="py-3 px-4">
                  <div class="font-semibold text-slate-800">
                    {{ item.donor_name }}
                  </div>
                  <div class="text-xs text-slate-400">
                    {{ item.address || item.phone || "---" }}
                  </div>
                </td>
                <td class="py-3 px-4">
                  <span
                    :class="
                      item.donation_type === 'book'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    "
                    class="text-[11px] font-bold px-2 py-0.5 rounded"
                  >
                    {{ item.donation_type === "book" ? "বই" : "অর্থ" }}
                  </span>
                  <div class="font-medium text-slate-700 mt-1">
                    {{ item.amount_or_details }}
                  </div>
                </td>
                <td class="py-3 px-4">
                  <span
                    :class="
                      item.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    "
                    class="px-2 py-0.5 rounded text-xs font-semibold"
                  >
                    {{ item.status === "approved" ? "প্রকাশিত" : "অপেক্ষমান" }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right space-x-2">
                  <button
                    v-if="item.status === 'pending'"
                    @click="handleApproveDonor(item.id)"
                    class="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-emerald-700"
                  >
                    অনুমোদন
                  </button>
                  <button
                    @click="handleDeleteDonor(item.id)"
                    class="text-red-500 hover:text-red-700 text-xs font-semibold"
                  >
                    মুছুন
                  </button>
                </td>
              </tr>
              <tr v-if="donations.length === 0">
                <td colspan="4" class="text-center py-6 text-slate-400">
                  কোনো অনুদান রেকর্ড নেই।
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== ট্যাব ২: পরিচালনা পর্ষদ (Committee) ==================== -->
    <div
      v-if="activeTab === 'committee'"
      class="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <!-- কমিটি সদস্য যোগ করার ফর্ম -->
      <div
        class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs h-fit"
      >
        <h2 class="text-lg font-bold text-slate-800 mb-4">
          কমিটি সদস্য যুক্ত করুন
        </h2>
        <form @submit.prevent="handleAddCommittee" class="space-y-3.5">
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >সদস্যের নাম *</label
            >
            <input
              v-model="committeeForm.name"
              type="text"
              required
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >পদবি *</label
            >
            <input
              v-model="committeeForm.designation"
              type="text"
              required
              placeholder="যেমন: সভাপতি / সাধারণ সম্পাদক"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >মেয়াদকাল</label
              >
              <input
                v-model="committeeForm.session_year"
                type="text"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >সিরিয়াল ক্রম</label
              >
              <input
                v-model="committeeForm.display_order"
                type="number"
                min="1"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >সদস্যের ছবি</label
            >
            <input
              type="file"
              accept="image/*"
              @change="(e) => (photoFile = e.target.files[0] || null)"
              class="mt-1 w-full text-xs text-slate-500"
            />
          </div>

          <button
            type="submit"
            :disabled="submitting"
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm transition"
          >
            {{ submitting ? "সংরক্ষণ হচ্ছে..." : "সদস্য যুক্ত করুন" }}
          </button>
        </form>
      </div>

      <!-- বর্তমান কমিটি তালিকা -->
      <div
        class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs"
      >
        <h2 class="text-lg font-bold text-slate-800 mb-4">
          বর্তমান কার্যনির্বাহী পর্ষদ
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="member in committee"
            :key="member.id"
            class="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50"
          >
            <div class="flex items-center space-x-3.5">
              <img
                v-if="member.photo"
                :src="storageUrl + member.photo"
                class="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
              />
              <div
                v-else
                class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base"
              >
                {{ member.name.charAt(0) }}
              </div>
              <div>
                <h3 class="font-bold text-slate-800 text-sm">
                  {{ member.name }}
                </h3>
                <p class="text-xs font-semibold text-emerald-700">
                  {{ member.designation }}
                </p>
                <p class="text-[11px] text-slate-400">
                  মেয়াদ: {{ member.session_year || "বর্তমান" }}
                </p>
              </div>
            </div>
            <button
              @click="handleDeleteCommittee(member.id)"
              class="text-red-500 hover:text-red-700 text-xs font-semibold"
            >
              মুছুন
            </button>
          </div>
          <div
            v-if="committee.length === 0"
            class="col-span-2 text-center py-6 text-slate-400 text-sm"
          >
            এখনো কোনো কমিটি সদস্য যুক্ত করা হয়নি।
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
