<script setup>
import { ref, onMounted, watch } from "vue";
import apiClient from "../api/axios";
import { useAuthStore } from "../stores/auth";

import { useToastStore } from "../stores/toast";

//For image
const storageUrl =
  import.meta.env.VITE_STORAGE_BASE_URL ||
  "[http://127.0.0.1:8000](http://127.0.0.1:8000)";

const books = ref([]);
const categories = ref([]);
const search = ref("");
const selectedCategory = ref("");
const loading = ref(false);
const authStore = useAuthStore();
const requestingBookId = ref(null);

const toast = useToastStore();
const reservingBookId = ref(null);

const fetchCategories = async () => {
  try {
    const res = await apiClient.get("/categories");
    categories.value = res.data.data;
  } catch (err) {
    console.error("ক্যাটাগরি লোড এরর:", err);
  }
};

const fetchBooks = async () => {
  loading.value = true;
  try {
    const params = {};
    if (search.value) params.search = search.value;
    if (selectedCategory.value) params.category_id = selectedCategory.value;

    const res = await apiClient.get("/books", { params });
    books.value = res.data.data.data; // paginate response
  } catch (err) {
    console.error("বই লোড এরর:", err);
  } finally {
    loading.value = false;
  }
};

const handleRequestBook = async (bookId) => {
  if (!authStore.isAuthenticated) {
    alert("বইয়ের জন্য আবেদন করতে প্রথমে লগইন করুন।");
    return;
  }

  requestingBookId.value = bookId;
  try {
    const res = await apiClient.post("/borrow-request", { book_id: bookId });
    alert(res.data.message);
  } catch (error) {
    alert(error.response?.data?.message || "আবেদন সম্পন্ন করা যায়নি!");
  } finally {
    requestingBookId.value = null;
  }
};

const handleReserveBook = async (bookId) => {
  if (!authStore.isAuthenticated) {
    toast.error("বই রিজার্ভ করতে প্রথমে লগইন করুন।");
    return;
  }

  reservingBookId.value = bookId;
  try {
    const res = await apiClient.post("/reservations", { book_id: bookId });
    toast.success(res.data.message);
  } catch (error) {
    toast.error(
      error.response?.data?.message || "রিজার্ভেশন সম্পন্ন করা যায়নি!",
    );
  } finally {
    reservingBookId.value = null;
  }
};

// সার্চ বা ক্যাটাগরি বদলালে অটো ফেচ হবে
watch([search, selectedCategory], () => {
  fetchBooks();
});

onMounted(() => {
  fetchCategories();
  fetchBooks();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-extrabold text-slate-800">
        পাঠাগারের বই ক্যাটালগ
      </h1>
      <p class="text-slate-500 mt-2">
        আপনার পছন্দের বই খুঁজুন এবং সংগ্রহ করতে পাঠাগারে আসুন
      </p>
    </div>

    <!-- Search & Filter Bar -->
    <div class="flex flex-col md:flex-row gap-4 mb-8">
      <input
        v-model="search"
        type="text"
        placeholder="বইয়ের নাম বা লেখক খুঁজুন..."
        class="flex-grow border rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
      />
      <select
        v-model="selectedCategory"
        class="border rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
      >
        <option value="">সব ক্যাটাগরি</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">
          {{ cat.name }} ({{ cat.books_count }})
        </option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12 text-slate-500">
      বই লোড হচ্ছে...
    </div>

    <!-- Empty State -->
    <div
      v-else-if="books.length === 0"
      class="text-center py-12 text-slate-500"
    >
      কোনো বই খুঁজে পাওয়া যায়নি।
    </div>

    <!-- Books Grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <div
        v-for="book in books"
        :key="book.id"
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition"
      >
        <div
          class="h-48 bg-slate-100 flex items-center justify-center overflow-hidden"
        >
          <img
            v-if="book.cover_image"
            :src="storageUrl + book.cover_image"
            :alt="book.title"
            class="h-full w-full object-cover"
          />
          <span v-else class="text-slate-400 font-medium">কভার ছবি নেই</span>
        </div>

        <div class="p-4 flex-grow">
          <span
            class="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded"
          >
            {{ book.category?.name }}
          </span>
          <h3 class="text-lg font-bold text-slate-800 mt-2 line-clamp-1">
            {{ book.title }}
          </h3>
          <p class="text-sm text-slate-600">লেখক: {{ book.author }}</p>
          <p v-if="book.shelf_no" class="text-xs text-slate-500 mt-1">
            শেলফ নং: {{ book.shelf_no }}
          </p>
        </div>

        <div
          class="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs"
        >
          <span
            :class="
              book.available_copies > 0
                ? 'text-emerald-600 font-semibold'
                : 'text-red-500 font-semibold'
            "
          >
            {{
              book.available_copies > 0
                ? `মজুদ: ${book.available_copies} টি`
                : "স্টক শেষ"
            }}
          </span>
          <span class="text-slate-400">মোট কপি: {{ book.total_copies }}</span>
        </div>

        <div class="p-3 bg-white border-t border-slate-100">
          <button
            v-if="book.available_copies > 0"
            @click="handleRequestBook(book.id)"
            :disabled="requestingBookId === book.id"
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1.5 rounded-lg text-xs transition"
          >
            {{
              requestingBookId === book.id
                ? "আবেদন হচ্ছে..."
                : "পড়ার আবেদন করুন"
            }}
          </button>

          <button
            v-else
            @click="handleReserveBook(book.id)"
            :disabled="reservingBookId === book.id"
            class="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-1.5 rounded-lg text-xs transition"
          >
            {{
              reservingBookId === book.id
                ? "রিজার্ভ হচ্ছে..."
                : "রিজার্ভ করুন (Waitlist)"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
