<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import apiClient from "../api/axios";
import { useToastStore } from "../stores/toast";

const toast = useToastStore();
const storageUrl =
  import.meta.env.VITE_STORAGE_BASE_URL || "http://127.0.0.1:8000";

const activeTab = ref("books"); // 'books' অথবা 'categories'
const categories = ref([]);
const books = ref([]);
const loading = ref(false);
const submitting = ref(false);

// ফিল্টারিং ও প্যাজিনেশন স্টেট
const searchQuery = ref("");
const selectedCategoryFilter = ref("");
const availableOnlyFilter = ref(false);
const pagination = reactive({
  current_page: 1,
  last_page: 1,
  total: 0,
});

// মডাল স্টেট
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const editingBookId = ref(null);

// Category Modal State
const isCategoryAddModalOpen = ref(false);
const isCategoryEditModalOpen = ref(false);
const editingCategoryId = ref(null);

const openAddCategoryModal = () => {
  categoryForm.name = "";
  categoryForm.description = "";

  isCategoryAddModalOpen.value = true;
};

// Category Edit Form
const editCategoryForm = reactive({
  name: "",
  description: "",
});

// ক্যাটাগরি ফর্ম
const categoryForm = reactive({
  name: "",
  description: "",
});

// বই যোগ করার ফর্ম
const bookForm = reactive({
  category_id: "",
  title: "",
  author: "",
  publisher: "",
  isbn: "",
  total_copies: 1,
  shelf_no: "",
  description: "",
});
const coverImageFile = ref(null);

// বই এডিট ফর্ম
const editForm = reactive({
  category_id: "",
  title: "",
  author: "",
  publisher: "",
  total_copies: 1,
  shelf_no: "",
  description: "",
});
const editCoverFile = ref(null);

// ক্যাটাগরি ফেচ
const fetchCategories = async () => {
  try {
    const res = await apiClient.get("/categories");
    categories.value = res.data.data;
  } catch (err) {
    console.error("ক্যাটাগরি লোড এরর:", err);
  }
};

// বই ফেচ (সার্চ, ফিল্টার ও প্যাজিনেশন সহ)
const fetchBooks = async (page = 1) => {
  loading.value = true;
  try {
    const params = { page };
    if (searchQuery.value) params.search = searchQuery.value;
    if (selectedCategoryFilter.value)
      params.category_id = selectedCategoryFilter.value;
    if (availableOnlyFilter.value) params.available_only = 1;

    const res = await apiClient.get("/books", { params });
    const paginatedData = res.data.data;

    books.value = paginatedData.data;
    pagination.current_page = paginatedData.current_page;
    pagination.last_page = paginatedData.last_page;
    pagination.total = paginatedData.total;
  } catch (err) {
    console.error("বই লোড এরর:", err);
  } finally {
    loading.value = false;
  }
};

// ফিল্টার বদলালে ১ নং পেজ থেকে ডেটা লোড হবে (Debounce সহ)
let searchTimeout = null;
watch([searchQuery, selectedCategoryFilter, availableOnlyFilter], () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchBooks(1);
  }, 300);
});

const resetFilters = () => {
  searchQuery.value = "";
  selectedCategoryFilter.value = "";
  availableOnlyFilter.value = false;
  fetchBooks(1);
};

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchBooks()]);
});

// Add Modal ওপেন
const openAddModal = () => {
  Object.assign(bookForm, {
    category_id: "",
    title: "",
    author: "",
    publisher: "",
    isbn: "",
    total_copies: 1,
    shelf_no: "",
    description: "",
  });
  coverImageFile.value = null;
  isAddModalOpen.value = true;
};

// বই সেভ
const handleSaveBook = async () => {
  submitting.value = true;
  try {
    const formData = new FormData();
    Object.keys(bookForm).forEach((key) => {
      formData.append(key, bookForm[key]);
    });
    if (coverImageFile.value) {
      formData.append("cover_image", coverImageFile.value);
    }

    const response = await apiClient.post("/books", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success(response.data.message);
    isAddModalOpen.value = false;
    await Promise.all([fetchBooks(pagination.current_page), fetchCategories()]);
  } catch (error) {
    toast.error(error.response?.data?.message || "বই যুক্ত করা সম্ভব হয়নি!");
  } finally {
    submitting.value = false;
  }
};

// Edit Modal ওপেন
const openEditModal = (book) => {
  editingBookId.value = book.id;
  Object.assign(editForm, {
    category_id: book.category_id,
    title: book.title,
    author: book.author,
    publisher: book.publisher || "",
    total_copies: book.total_copies,
    shelf_no: book.shelf_no || "",
    description: book.description || "",
  });
  editCoverFile.value = null;
  isEditModalOpen.value = true;
};

// বই আপডেট
const handleUpdateBook = async () => {
  submitting.value = true;
  try {
    const formData = new FormData();
    Object.keys(editForm).forEach((key) => {
      formData.append(key, editForm[key]);
    });
    if (editCoverFile.value) {
      formData.append("cover_image", editCoverFile.value);
    }

    const res = await apiClient.post(
      `/books/${editingBookId.value}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    toast.success(res.data.message);
    isEditModalOpen.value = false;
    await Promise.all([fetchBooks(pagination.current_page), fetchCategories()]);
  } catch (err) {
    toast.error(err.response?.data?.message || "বই আপডেট ব্যর্থ হয়েছে!");
  } finally {
    submitting.value = false;
  }
};

// বই ডিলিট
const handleDeleteBook = async (id) => {
  if (!confirm("আপনি কি নিশ্চিত এই বইটি তালিকা থেকে মুছে ফেলতে চান?")) return;
  try {
    const res = await apiClient.delete(`/books/${id}`);
    toast.success(res.data.message);
    await Promise.all([fetchBooks(pagination.current_page), fetchCategories()]);
  } catch (error) {
    toast.error("বই ডিলিট ব্যর্থ হয়েছে!");
  }
};

// Category Edit Modal Open
const openEditCategoryModal = (category) => {
  editingCategoryId.value = category.id;

  Object.assign(editCategoryForm, {
    name: category.name,
    description: category.description || "",
  });

  isCategoryEditModalOpen.value = true;
};

// ক্যাটাগরি সেভ

const handleSaveCategory = async () => {
  submitting.value = true;

  try {
    const response = await apiClient.post("/categories", categoryForm);

    toast.success(response.data.message);

    // Form Reset
    categoryForm.name = "";
    categoryForm.description = "";

    // Add Modal Close
    isCategoryAddModalOpen.value = false;

    // Refresh Categories
    await fetchCategories();
  } catch (error) {
    toast.error(error.response?.data?.message || "ক্যাটাগরি যুক্ত করা যায়নি!");
  } finally {
    submitting.value = false;
  }
};

// Category Update
const handleUpdateCategory = async () => {
  submitting.value = true;

  try {
    const res = await apiClient.post(
      `/categories/${editingCategoryId.value}`,
      editCategoryForm,
    );

    toast.success(res.data.message);

    isCategoryEditModalOpen.value = false;

    editCategoryForm.name = "";
    editCategoryForm.description = "";

    await Promise.all([fetchCategories(), fetchBooks(pagination.current_page)]);
  } catch (error) {
    toast.error(
      error.response?.data?.message || "ক্যাটাগরি আপডেট ব্যর্থ হয়েছে!",
    );
  } finally {
    submitting.value = false;
  }
};

// ক্যাটাগরি ডিলিট
const handleDeleteCategory = async (id) => {
  if (
    !confirm(
      "আপনি কি নিশ্চিত এই ক্যাটাগরি মুছে ফেলতে চান? এর অধীনে থাকা বইও মুছে যেতে পারে!",
    )
  )
    return;
  try {
    const res = await apiClient.delete(`/categories/${id}`);
    toast.success(res.data.message);
    await Promise.all([fetchCategories(), fetchBooks(1)]);
  } catch (error) {
    toast.error("ক্যাটাগরি ডিলিট ব্যর্থ হয়েছে!");
  }
};
</script>

<template>
  <!-- ড্যাশবোর্ডের সাথে হুবহু মিল রেখে পূর্ণ প্রস্থের কন্টেইনার -->
  <div class="space-y-6">
    <!-- Top Page Header -->
    <div
      class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">
          বই ও ক্যাটাগরি ম্যানেজমেন্ট
        </h1>
        <p class="text-sm text-slate-500">
          পাঠাগারের বইয়ের সংগ্রহ, স্টক এবং ক্যাটাগরি পরিচালনা করুন
        </p>
      </div>

      <!-- Tab Toggle Buttons -->
      <div class="flex space-x-2">
        <button
          @click="activeTab = 'books'"
          :class="
            activeTab === 'books'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          "
          class="px-4 py-2 rounded-lg font-medium text-sm transition"
        >
          বইয়ের তালিকা ({{ pagination.total }})
        </button>
        <button
          @click="activeTab = 'categories'"
          :class="
            activeTab === 'categories'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          "
          class="px-4 py-2 rounded-lg font-medium text-sm transition"
        >
          ক্যাটাগরি ({{ categories.length }})
        </button>
      </div>
    </div>

    <!-- ==================== ১. বই ম্যানেজমেন্ট ট্যাব ==================== -->
    <div
      v-if="activeTab === 'books'"
      class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6"
    >
      <!-- Action & Filter Bar -->
      <div
        class="flex flex-col lg:flex-row justify-between lg:items-center gap-4"
      >
        <!-- Search & Filter Inputs -->
        <div
          class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 flex-1"
        >
          <input
            v-model="searchQuery"
            type="text"
            placeholder="বইয়ের নাম, লেখক বা ISBN খুঁজুন..."
            class="border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500 outline-none sm:w-64"
          />

          <select
            v-model="selectedCategoryFilter"
            class="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">সব ক্যাটাগরি</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }} ({{ cat.books_count }})
            </option>
          </select>

          <label
            class="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer select-none px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
          >
            <input
              type="checkbox"
              v-model="availableOnlyFilter"
              class="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>শুধুমাত্র মজুদ আছে</span>
          </label>

          <button
            v-if="searchQuery || selectedCategoryFilter || availableOnlyFilter"
            @click="resetFilters"
            class="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1"
          >
            ফিল্টার রিসেট
          </button>
        </div>

        <!-- Add Book Button -->
        <button
          @click="openAddModal"
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-xs shrink-0"
        >
          + নতুন বই যোগ করুন
        </button>
      </div>

      <!-- Books Table -->
      <div class="overflow-x-auto border border-slate-100 rounded-lg">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase text-xs">
            <tr>
              <th class="py-3 px-4">কভার</th>
              <th class="py-3 px-4">বই ও লেখক</th>
              <th class="py-3 px-4">ক্যাটাগরি</th>
              <th class="py-3 px-4">কপি (মোট / মজুদ)</th>
              <th class="py-3 px-4">শেলফ</th>
              <th class="py-3 px-4 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="6" class="text-center py-8 text-slate-400">
                বইয়ের তালিকা লোড হচ্ছে...
              </td>
            </tr>
            <tr v-else-if="books.length === 0">
              <td colspan="6" class="text-center py-8 text-slate-400">
                কোনো বই খুঁজে পাওয়া যায়নি।
              </td>
            </tr>
            <tr
              v-else
              v-for="book in books"
              :key="book.id"
              class="hover:bg-slate-50/70 transition"
            >
              <td class="py-3 px-4">
                <img
                  v-if="book.cover_image"
                  :src="storageUrl + book.cover_image"
                  class="h-12 w-9 object-cover rounded shadow-2xs"
                />
                <div
                  v-else
                  class="h-12 w-9 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400"
                >
                  ছবি নেই
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="font-semibold text-slate-800">{{ book.title }}</div>
                <div class="text-xs text-slate-500">
                  {{ book.author }}
                  <span v-if="book.publisher">| {{ book.publisher }}</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <span
                  class="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full"
                >
                  {{ book.category?.name }}
                </span>
              </td>
              <td class="py-3 px-4 font-medium">
                <span class="text-slate-700">{{ book.total_copies }}</span> /
                <span
                  :class="
                    book.available_copies > 0
                      ? 'text-emerald-600 font-bold'
                      : 'text-red-500 font-bold'
                  "
                >
                  {{ book.available_copies }}
                </span>
              </td>
              <td class="py-3 px-4 font-mono text-xs">
                {{ book.shelf_no || "N/A" }}
              </td>
              <td class="py-3 px-4 text-right space-x-3">
                <button
                  @click="openEditModal(book)"
                  class="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  এডিট
                </button>
                <button
                  @click="handleDeleteBook(book.id)"
                  class="text-red-500 hover:text-red-700 font-semibold"
                >
                  মুছুন
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div
        v-if="pagination.last_page > 1"
        class="flex items-center justify-between pt-2 text-sm text-slate-600"
      >
        <div>
          পৃষ্ঠা <strong>{{ pagination.current_page }}</strong> /
          {{ pagination.last_page }} (মোট {{ pagination.total }} টি বই)
        </div>
        <div class="flex space-x-2">
          <button
            @click="fetchBooks(pagination.current_page - 1)"
            :disabled="pagination.current_page <= 1"
            class="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            &larr; পূর্ববর্তী
          </button>
          <button
            @click="fetchBooks(pagination.current_page + 1)"
            :disabled="pagination.current_page >= pagination.last_page"
            class="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            পরবর্তী &rarr;
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== ২. ক্যাটাগরি ম্যানেজমেন্ট ট্যাব ==================== -->
    <div v-if="activeTab === 'categories'" class="w-full">
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div
          class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4"
        >
          <h2 class="text-lg font-bold text-slate-800">
            বর্তমান ক্যাটাগরিসমূহ
          </h2>

          <button
            @click="openAddCategoryModal"
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
          >
            + নতুন ক্যাটাগরি যোগ করুন
          </button>
        </div>
        <div class="overflow-x-auto border border-slate-100 rounded-lg">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase text-xs">
              <tr>
                <th class="py-3 px-4">নাম</th>
                <th class="py-3 px-4">বিবরণ</th>
                <th class="py-3 px-4">মোট বই</th>
                <th class="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="cat in categories"
                :key="cat.id"
                class="hover:bg-slate-50/70"
              >
                <td class="py-3 px-4 font-semibold text-slate-800">
                  {{ cat.name }}
                </td>
                <td class="py-3 px-4 text-xs text-slate-500">
                  {{ cat.description || "---" }}
                </td>
                <td class="py-3 px-4 font-medium">{{ cat.books_count }} টি</td>

                <td class="py-3 px-4 text-right space-x-3">
                  <!-- Edit Button -->
                  <button
                    @click="openEditCategoryModal(cat)"
                    class="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    এডিট
                  </button>

                  <!-- Delete Button -->
                  <button
                    @click="handleDeleteCategory(cat.id)"
                    class="text-red-500 hover:text-red-700 font-semibold"
                  >
                    মুছুন
                  </button>
                </td>
              </tr>
              <tr v-if="categories.length === 0">
                <td colspan="4" class="text-center py-6 text-slate-400">
                  কোনো ক্যাটাগরি তৈরি করা হয়নি।
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== ৩. Add Book Modal ==================== -->
    <div
      v-if="isAddModalOpen"
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
          <h3 class="text-lg font-bold text-slate-800">নতুন বই এন্ট্রি করুন</h3>
          <button
            @click="isAddModalOpen = false"
            class="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form @submit.prevent="handleSaveBook" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >ক্যাটাগরি *</label
            >
            <select
              v-model="bookForm.category_id"
              required
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="" disabled>ক্যাটাগরি নির্বাচন করুন</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >বইয়ের শিরোনাম *</label
            >
            <input
              v-model="bookForm.title"
              type="text"
              required
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >লেখক *</label
              >
              <input
                v-model="bookForm.author"
                type="text"
                required
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >প্রকাশক</label
              >
              <input
                v-model="bookForm.publisher"
                type="text"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >মোট কপি *</label
              >
              <input
                v-model="bookForm.total_copies"
                type="number"
                min="1"
                required
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >শেলফ নম্বর</label
              >
              <input
                v-model="bookForm.shelf_no"
                type="text"
                placeholder="যেমন: A-04"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >কভার ইমেজ (ছবি)</label
            >
            <input
              type="file"
              accept="image/*"
              @change="(e) => (coverImageFile = e.target.files[0] || null)"
              class="mt-1 w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >বইয়ের পরিচিতি / বিবরণ</label
            >
            <textarea
              v-model="bookForm.description"
              rows="2"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
          </div>

          <div
            class="flex justify-end space-x-2 pt-3 border-t border-slate-100"
          >
            <button
              type="button"
              @click="isAddModalOpen = false"
              class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium"
            >
              বাতিল
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-semibold transition"
            >
              {{ submitting ? "সংরক্ষণ হচ্ছে..." : "বই সংরক্ষণ করুন" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== ৪. Edit Book Modal ==================== -->
    <div
      v-if="isEditModalOpen"
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
            বইয়ের তথ্য আপডেট করুন
          </h3>
          <button
            @click="isEditModalOpen = false"
            class="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form @submit.prevent="handleUpdateBook" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >ক্যাটাগরি *</label
            >
            <select
              v-model="editForm.category_id"
              required
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >বইয়ের শিরোনাম *</label
            >
            <input
              v-model="editForm.title"
              type="text"
              required
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >লেখক *</label
              >
              <input
                v-model="editForm.author"
                type="text"
                required
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >প্রকাশক</label
              >
              <input
                v-model="editForm.publisher"
                type="text"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >মোট কপি *</label
              >
              <input
                v-model="editForm.total_copies"
                type="number"
                min="1"
                required
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >শেলফ নম্বর</label
              >
              <input
                v-model="editForm.shelf_no"
                type="text"
                class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >নতুন কভার ইমেজ (পরিবর্তন করতে চাইলে)</label
            >
            <input
              type="file"
              accept="image/*"
              @change="(e) => (editCoverFile = e.target.files[0] || null)"
              class="mt-1 w-full text-xs text-slate-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700"
              >বইয়ের পরিচিতি / বিবরণ</label
            >
            <textarea
              v-model="editForm.description"
              rows="2"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
          </div>

          <div
            class="flex justify-end space-x-2 pt-3 border-t border-slate-100"
          >
            <button
              type="button"
              @click="isEditModalOpen = false"
              class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium"
            >
              বাতিল
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-semibold transition"
            >
              {{ submitting ? "আপডেট হচ্ছে..." : "পরিবর্তন সেভ করুন" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== ৫. Edit Category Modal ==================== -->

    <div
      v-if="isCategoryEditModalOpen"
      style="
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        z-index: 60;
      "
      class="flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
      >
        <!-- Modal Header -->
        <div
          class="flex justify-between items-center border-b border-slate-100 pb-3"
        >
          <h3 class="text-lg font-bold text-slate-800">ক্যাটাগরি আপডেট করুন</h3>

          <button
            @click="isCategoryEditModalOpen = false"
            class="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <!-- Edit Category Form -->
        <form @submit.prevent="handleUpdateCategory" class="space-y-4">
          <!-- Category Name -->
          <div>
            <label class="block text-sm font-medium text-slate-700">
              ক্যাটাগরির নাম *
            </label>

            <input
              v-model="editCategoryForm.name"
              type="text"
              required
              placeholder="ক্যাটাগরির নাম লিখুন"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <!-- Category Description -->
          <div>
            <label class="block text-sm font-medium text-slate-700">
              ক্যাটাগরির বিবরণ
            </label>

            <textarea
              v-model="editCategoryForm.description"
              rows="3"
              placeholder="ক্যাটাগরির বিবরণ লিখুন"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
          </div>

          <!-- Modal Buttons -->
          <div
            class="flex justify-end space-x-2 pt-3 border-t border-slate-100"
          >
            <button
              type="button"
              @click="isCategoryEditModalOpen = false"
              class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium"
            >
              বাতিল
            </button>

            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-semibold transition"
            >
              {{ submitting ? "আপডেট হচ্ছে..." : "পরিবর্তন সেভ করুন" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== ADD CATEGORY MODAL ==================== -->

    <div
      v-if="isCategoryAddModalOpen"
      style="
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        z-index: 60;
      "
      class="flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
      >
        <!-- Header -->
        <div
          class="flex justify-between items-center border-b border-slate-100 pb-3"
        >
          <h3 class="text-lg font-bold text-slate-800">
            নতুন ক্যাটাগরি যোগ করুন
          </h3>

          <button
            @click="isCategoryAddModalOpen = false"
            class="text-slate-400 hover:text-slate-600 text-2xl"
          >
            &times;
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSaveCategory" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700">
              ক্যাটাগরির নাম *
            </label>

            <input
              v-model="categoryForm.name"
              type="text"
              required
              placeholder="যেমন: উপন্যাস, মুক্তিযুদ্ধ"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">
              বিবরণ
            </label>

            <textarea
              v-model="categoryForm.description"
              rows="3"
              placeholder="ক্যাটাগরির বিবরণ লিখুন"
              class="mt-1 w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
          </div>

          <!-- Buttons -->
          <div
            class="flex justify-end space-x-2 pt-3 border-t border-slate-100"
          >
            <button
              type="button"
              @click="isCategoryAddModalOpen = false"
              class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium"
            >
              বাতিল
            </button>

            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-semibold transition"
            >
              {{ submitting ? "সংরক্ষণ হচ্ছে..." : "ক্যাটাগরি সেভ করুন" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
