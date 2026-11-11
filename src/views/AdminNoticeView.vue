<script setup>
import { ref, reactive, onMounted } from "vue";
import apiClient from "../api/axios";

const notices = ref([]);
const loading = ref(false);
const submitting = ref(false);

const form = reactive({
  title: "",
  content: "",
  published_at: new Date().toISOString().slice(0, 10),
  is_active: true,
});

const fetchNotices = async () => {
  loading.value = true;
  try {
    const res = await apiClient.get("/manage/notices");
    notices.value = res.data.data.data;
  } catch (err) {
    console.error("নোটিশ লোড ব্যর্থ:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchNotices();
});

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const res = await apiClient.post("/notices", form);
    alert(res.data.message);
    form.title = "";
    form.content = "";
    await fetchNotices();
  } catch (err) {
    alert(err.response?.data?.message || "নোটিশ প্রকাশে ব্যর্থ হয়েছে!");
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (id) => {
  if (!confirm("আপনি কি নিশ্চিত এই নোটিশটি মুছে ফেলতে চান?")) return;
  try {
    const res = await apiClient.delete(`/notices/${id}`);
    alert(res.data.message);
    await fetchNotices();
  } catch (err) {
    alert("নোটিশ মোছা যায়নি!");
  }
};
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-slate-800 mb-6">
      নোটিশ বোর্ড ম্যানেজমেন্ট
    </h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- নোটিশ তৈরি ফর্ম -->
      <div
        class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit"
      >
        <h2 class="text-lg font-bold text-slate-800 mb-4">
          নতুন নোটিশ প্রকাশ করুন
        </h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >শিরোনাম *</label
            >
            <input
              v-model="form.title"
              type="text"
              placeholder="যেমন: সাপ্তাহিক ছুটির নোটিশ"
              required
              class="mt-1 w-full border rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >প্রকাশের তারিখ</label
            >
            <input
              v-model="form.published_at"
              type="date"
              class="mt-1 w-full border rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >বিস্তারিত বিবরণ *</label
            >
            <textarea
              v-model="form.content"
              rows="4"
              required
              class="mt-1 w-full border rounded-lg p-2 text-sm"
            ></textarea>
          </div>

          <button
            type="submit"
            :disabled="submitting"
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm transition"
          >
            {{ submitting ? "প্রকাশ হচ্ছে..." : "নোটিশ প্রকাশ করুন" }}
          </button>
        </form>
      </div>

      <!-- প্রকাশিত নোটিশের তালিকা -->
      <div
        class="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
      >
        <h2 class="text-lg font-bold text-slate-800 mb-4">
          সাম্প্রতিক প্রকাশিত নোটিশ
        </h2>
        <div v-if="loading" class="text-center py-6 text-slate-500">
          লোড হচ্ছে...
        </div>
        <div
          v-else-if="notices.length === 0"
          class="text-center py-6 text-slate-400"
        >
          কোনো নোটিশ পাওয়া যায়নি।
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="item in notices"
            :key="item.id"
            class="p-4 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-start"
          >
            <div>
              <div class="flex items-center space-x-2">
                <span
                  class="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded"
                >
                  {{ item.published_at }}
                </span>
                <h3 class="font-bold text-slate-800">{{ item.title }}</h3>
              </div>
              <p class="text-sm text-slate-600 mt-2 whitespace-pre-line">
                {{ item.content }}
              </p>
            </div>
            <button
              @click="handleDelete(item.id)"
              class="text-red-500 hover:text-red-700 text-xs font-semibold ml-4"
            >
              মুছুন
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
