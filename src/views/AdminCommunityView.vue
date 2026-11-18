<script setup>
import { ref, reactive, onMounted } from "vue";
import apiClient from "../api/axios";
import { useToastStore } from "../stores/toast";

const toast = useToastStore();
const storageUrl =
  import.meta.env.VITE_STORAGE_BASE_URL || "http://127.0.0.1:8000";

const activeTab = ref("donors");
const donations = ref([]);
const committee = ref([]);
const loading = ref(false);
const submitting = ref(false);

// মডাল স্টেট
const isDonorModalOpen = ref(false);
const isCommitteeModalOpen = ref(false);

// Edit Committee Modal State
const isEditCommitteeModalOpen = ref(false);
const editingCommitteeId = ref(null);

const editCommitteeForm = reactive({
  name: "",
  designation: "",
  phone: "",
  session_year: "",
  display_order: 1,
});

const editPhotoFile = ref(null);

// নতুন দাতা ফর্ম
const donorForm = reactive({
  donor_name: "",
  phone: "",
  address: "",
  donation_type: "book",
  amount_or_details: "",
  message: "",
});

// নতুন কমিটি সদস্য ফর্ম
const committeeForm = reactive({
  name: "",
  designation: "",
  phone: "",
  session_year: "২০২৬-২০২৮",
  display_order: 1,
});
const photoFile = ref(null);

// ডেটা লোড (adminDonations এবং publicData এন্ডপয়েন্ট ব্যবহার করে)
const fetchAll = async () => {
  loading.value = true;
  try {
    const [donorRes, commRes] = await Promise.all([
      apiClient.get("/donations"),
      apiClient.get("/community"),
    ]);
    donations.value = donorRes.data.data;
    committee.value = commRes.data.data.committee;
  } catch (err) {
    console.error("তথ্য লোড এরর:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAll();
});

// দাতা মডাল ওপেন ও রিসেট
const openDonorModal = () => {
  Object.assign(donorForm, {
    donor_name: "",
    phone: "",
    address: "",
    donation_type: "book",
    amount_or_details: "",
    message: "",
  });
  isDonorModalOpen.value = true;
};

// সরাসরি দাতা সংরক্ষণ (POST /admin/donations)
const handleAddDonor = async () => {
  submitting.value = true;
  try {
    const res = await apiClient.post("/donations", donorForm);
    toast.success(res.data.message);
    isDonorModalOpen.value = false;
    await fetchAll();
  } catch (err) {
    toast.error(err.response?.data?.message || "সংরক্ষণ করা যায়নি!");
  } finally {
    submitting.value = false;
  }
};

// পেন্ডিং অনুদান অনুমোদন (POST /donations/{id}/approve)
const handleApproveDonor = async (id) => {
  try {
    const res = await apiClient.post(`/donations/${id}/approve`);
    toast.success(res.data.message);
    await fetchAll();
  } catch (err) {
    toast.error("অনুমোদন ব্যর্থ হয়েছে!");
  }
};

// অনুদান ডিলিট (DELETE /admin/donations/{id})
const handleDeleteDonor = async (id) => {
  if (!confirm("আপনি কি নিশ্চিত এই রেকর্ডটি মুছে ফেলতে চান?")) return;
  try {
    const res = await apiClient.delete(`/donations/${id}`);
    toast.success(res.data.message);
    await fetchAll();
  } catch (err) {
    toast.error("মোছা যায়নি!");
  }
};

// কমিটি মডাল ওপেন ও রিসেট
const openCommitteeModal = () => {
  Object.assign(committeeForm, {
    name: "",
    designation: "",
    phone: "",
    session_year: "২০২৬-২০২৮",
    display_order: committee.value.length + 1,
  });
  photoFile.value = null;
  isCommitteeModalOpen.value = true;
};

// কমিটি সদস্য সংরক্ষণ (POST /admin/committee)
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

    const res = await apiClient.post("/committee", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success(res.data.message);
    isCommitteeModalOpen.value = false;
    await fetchAll();
  } catch (err) {
    toast.error(err.response?.data?.message || "সদস্য যোগ করা যায়নি!");
  } finally {
    submitting.value = false;
  }
};

// কমিটি সদস্য ডিলিট (DELETE /admin/committee/{id})
const handleDeleteCommittee = async (id) => {
  if (!confirm("এই সদস্যকে পরিচালনা পর্ষদ থেকে মুছে ফেলতে চান?")) return;
  try {
    const res = await apiClient.delete(`/committee/${id}`);
    toast.success(res.data.message);
    await fetchAll();
  } catch (err) {
    toast.error("মোছা যায়নি!");
  }
};

// কমিটি সদস্যের তথ্য এডিট করার Modal ওপেন
const openEditCommitteeModal = (member) => {
  editingCommitteeId.value = member.id;

  Object.assign(editCommitteeForm, {
    name: member.name,
    designation: member.designation,
    phone: member.phone || "",
    session_year: member.session_year || "",
    display_order: member.display_order || 1,
  });

  editPhotoFile.value = null;

  isEditCommitteeModalOpen.value = true;
};

// কমিটি সদস্যের তথ্য আপডেট
const handleUpdateCommittee = async () => {
  submitting.value = true;

  try {
    const formData = new FormData();

    Object.keys(editCommitteeForm).forEach((key) => {
      formData.append(key, editCommitteeForm[key]);
    });

    if (editPhotoFile.value) {
      formData.append("photo", editPhotoFile.value);
    }

    const res = await apiClient.post(
      `/committee/${editingCommitteeId.value}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    toast.success(res.data.message);

    isEditCommitteeModalOpen.value = false;

    await fetchAll();
  } catch (err) {
    toast.error(err.response?.data?.message || "আপডেট করা যায়নি!");
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <!-- ড্যাশবোর্ডের সাথে সামঞ্জস্যপূর্ণ পূর্ণ প্রস্থের কন্টেইনার -->
  <div class="space-y-6">
    <!-- Top Page Header & Tab Switcher -->
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

    <!-- ==================== ১. দাতা ও অনুদান ট্যাব (Full Width) ==================== -->
    <div
      v-if="activeTab === 'donors'"
      class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6"
    >
      <div
        class="flex flex-col sm:flex-row justify-between sm:items-center gap-4"
      >
        <div>
          <h2 class="text-lg font-bold text-slate-800">
            সকল অনুদান ও দাতা তালিকা
          </h2>
          <p class="text-xs text-slate-500">
            অনুমোদিত অনুদানগুলো স্বয়ংক্রিয়ভাবে হোমপেজের Donors Wall-এ প্রদর্শিত
            হয়
          </p>
        </div>
        <button
          @click="openDonorModal"
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-xs shrink-0"
        >
          + নতুন দাতা যুক্ত করুন
        </button>
      </div>

      <div class="overflow-x-auto border border-slate-100 rounded-lg">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-50 text-slate-700 text-xs uppercase">
            <tr>
              <th class="py-3 px-4">দাতার নাম ও পরিচয়</th>
              <th class="py-3 px-4">ধরন</th>
              <th class="py-3 px-4">অনুদানের বিবরণ</th>
              <th class="py-3 px-4">মন্তব্য</th>
              <th class="py-3 px-4">স্ট্যাটাস</th>
              <th class="py-3 px-4 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="6" class="text-center py-8 text-slate-400">
                তথ্য লোড হচ্ছে...
              </td>
            </tr>
            <tr v-else-if="donations.length === 0">
              <td colspan="6" class="text-center py-8 text-slate-400">
                কোনো অনুদান রেকর্ড নেই। "+ নতুন দাতা যুক্ত করুন" বাটনে ক্লিক করে
                শুরু করুন।
              </td>
            </tr>
            <tr
              v-else
              v-for="item in donations"
              :key="item.id"
              class="hover:bg-slate-50/70 transition"
            >
              <td class="py-3 px-4">
                <div class="font-semibold text-slate-800">
                  {{ item.donor_name }}
                </div>
                <div class="text-xs text-slate-400">
                  {{ item.address || "---" }}
                  <span v-if="item.phone">| {{ item.phone }}</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <span
                  :class="
                    item.donation_type === 'book'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  "
                  class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                >
                  {{
                    item.donation_type === "book"
                      ? "বই অনুদান"
                      : "আর্থিক অনুদান"
                  }}
                </span>
              </td>
              <td class="py-3 px-4 font-semibold text-slate-700">
                {{ item.amount_or_details }}
              </td>
              <td class="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                {{ item.message || "---" }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="
                    item.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  "
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                >
                  {{ item.status === "approved" ? "প্রকাশিত" : "অপেক্ষমান" }}
                </span>
              </td>
              <td class="py-3 px-4 text-right space-x-3">
                <button
                  v-if="item.status === 'pending'"
                  @click="handleApproveDonor(item.id)"
                  class="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-emerald-700 transition"
                >
                  অনুমোদন দিন
                </button>
                <button
                  @click="handleDeleteDonor(item.id)"
                  class="text-red-500 hover:text-red-700 text-xs font-semibold"
                >
                  মুছুন
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== ২. পরিচালনা পর্ষদ ট্যাব (Full Width) ==================== -->
    <div
      v-if="activeTab === 'committee'"
      class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6"
    >
      <div
        class="flex flex-col sm:flex-row justify-between sm:items-center gap-4"
      >
        <div>
          <h2 class="text-lg font-bold text-slate-800">
            বর্তমান কার্যনির্বাহী পর্ষদ
          </h2>
          <p class="text-xs text-slate-500">
            সিরিয়াল ক্রম অনুযায়ী হোমপেজে সদস্যদের কার্ড প্রদর্শিত হবে
          </p>
        </div>
        <button
          @click="openCommitteeModal"
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-xs shrink-0"
        >
          + নতুন সদস্য যুক্ত করুন
        </button>
      </div>

      <div
        v-if="committee.length === 0"
        class="text-center py-10 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl"
      >
        এখনো কোনো কমিটি সদস্য যুক্ত করা হয়নি। "+ নতুন সদস্য যুক্ত করুন" বাটনে
        ক্লিক করুন।
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="member in committee"
          :key="member.id"
          class="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/60 hover:bg-white hover:shadow-xs transition"
        >
          <div class="flex items-center space-x-3.5 min-w-0">
            <img
              v-if="member.photo"
              :src="storageUrl + member.photo"
              class="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shrink-0"
            />
            <div
              v-else
              class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0"
            >
              {{ member.name.charAt(0) }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <span
                  class="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded"
                  >#{{ member.display_order }}</span
                >
                <h3 class="font-bold text-slate-800 text-sm truncate">
                  {{ member.name }}
                </h3>
              </div>
              <p class="text-xs font-semibold text-emerald-700 mt-0.5">
                {{ member.designation }}
              </p>
              <p class="text-[11px] text-slate-400 mt-0.5">
                মেয়াদ: {{ member.session_year || "বর্তমান" }}
                <span v-if="member.phone">&bull; {{ member.phone }}</span>
              </p>
            </div>
          </div>
          <div class="flex flex-col space-y-1 ml-3 shrink-0 text-right">
            <!-- Edit Button -->
            <button
              @click="openEditCommitteeModal(member)"
              class="text-blue-600 hover:text-blue-800 text-xs font-semibold"
            >
              এডিট
            </button>

            <!-- Delete Button -->
            <button
              @click="handleDeleteCommittee(member.id)"
              class="text-red-500 hover:text-red-700 text-xs font-semibold"
            >
              মুছুন
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== ৩. Add Donor Modal ==================== -->
    <div
      v-if="isDonorModalOpen"
      style="
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        z-index: 60;
      "
      class="flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div
          class="flex justify-between items-center border-b border-slate-100 pb-3"
        >
          <h3 class="text-lg font-bold text-slate-800">
            নতুন দাতা সদস্য যুক্ত করুন
          </h3>
          <button
            @click="isDonorModalOpen = false"
            class="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form @submit.prevent="handleAddDonor" class="space-y-4">
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

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >অনুদানের ধরন *</label
              >
              <select
                v-model="donorForm.donation_type"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="book">বই অনুদান</option>
                <option value="money">আর্থিক অনুদান</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >মোবাইল নম্বর</label
              >
              <input
                v-model="donorForm.phone"
                type="text"
                placeholder="017XXXXXXXX"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >শুভেচ্ছা বার্তা / নোট</label
            >
            <textarea
              v-model="donorForm.message"
              rows="2"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
          </div>

          <div
            class="flex justify-end space-x-2 pt-3 border-t border-slate-100"
          >
            <button
              type="button"
              @click="isDonorModalOpen = false"
              class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium"
            >
              বাতিল
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-semibold transition"
            >
              {{ submitting ? "যুক্ত হচ্ছে..." : "Donors Wall-এ যুক্ত করুন" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== ৪. Add Committee Modal ==================== -->
    <div
      v-if="isCommitteeModalOpen"
      style="
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        z-index: 60;
      "
      class="flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div
          class="flex justify-between items-center border-b border-slate-100 pb-3"
        >
          <h3 class="text-lg font-bold text-slate-800">
            পরিচালনা পর্ষদের সদস্য যুক্ত করুন
          </h3>
          <button
            @click="isCommitteeModalOpen = false"
            class="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form @submit.prevent="handleAddCommittee" class="space-y-4">
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

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >মোবাইল নম্বর</label
              >
              <input
                v-model="committeeForm.phone"
                type="text"
                placeholder="017XXXXXXXX"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >মেয়াদকাল</label
              >
              <input
                v-model="committeeForm.session_year"
                type="text"
                placeholder="২০২৬-২০২৮"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
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
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
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
              class="mt-1 w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>

          <div
            class="flex justify-end space-x-2 pt-3 border-t border-slate-100"
          >
            <button
              type="button"
              @click="isCommitteeModalOpen = false"
              class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium"
            >
              বাতিল
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-semibold transition"
            >
              {{ submitting ? "সংরক্ষণ হচ্ছে..." : "সদস্য যুক্ত করুন" }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- ==================== ৫. Edit Committee Modal ==================== -->

    <div
      v-if="isEditCommitteeModalOpen"
      style="
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        z-index: 60;
      "
      class="flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div
          class="flex justify-between items-center border-b border-slate-100 pb-3"
        >
          <h3 class="text-lg font-bold text-slate-800">
            কমিটি সদস্যের তথ্য আপডেট
          </h3>

          <button
            @click="isEditCommitteeModalOpen = false"
            class="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <!-- Edit Form -->
        <form @submit.prevent="handleUpdateCommittee" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-slate-700">
              সদস্যের নাম *
            </label>

            <input
              v-model="editCommitteeForm.name"
              type="text"
              required
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>

          <!-- Designation & Phone -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700">
                পদবি *
              </label>

              <input
                v-model="editCommitteeForm.designation"
                type="text"
                required
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">
                মোবাইল নম্বর
              </label>

              <input
                v-model="editCommitteeForm.phone"
                type="text"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <!-- Session Year & Display Order -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700">
                মেয়াদকাল
              </label>

              <input
                v-model="editCommitteeForm.session_year"
                type="text"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">
                সিরিয়াল ক্রম
              </label>

              <input
                v-model="editCommitteeForm.display_order"
                type="number"
                min="1"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <!-- New Photo -->
          <div>
            <label class="block text-sm font-medium text-slate-700">
              নতুন ছবি (পরিবর্তন করতে চাইলে)
            </label>

            <input
              type="file"
              accept="image/*"
              @change="(e) => (editPhotoFile = e.target.files[0] || null)"
              class="mt-1 w-full text-xs text-slate-500"
            />
          </div>

          <!-- Footer Buttons -->
          <div
            class="flex justify-end space-x-2 pt-3 border-t border-slate-100"
          >
            <button
              type="button"
              @click="isEditCommitteeModalOpen = false"
              class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg"
            >
              বাতিল
            </button>

            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg font-semibold hover:bg-emerald-700"
            >
              {{ submitting ? "আপডেট হচ্ছে..." : "পরিবর্তন সেভ করুন" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
