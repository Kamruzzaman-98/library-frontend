<script setup>
import { ref, reactive, onMounted } from "vue";
import apiClient from "../api/axios";
import { useToastStore } from "../stores/toast";

//For image
const storageUrl =
  import.meta.env.VITE_STORAGE_BASE_URL ||
  "[http://127.0.0.1:8000](http://127.0.0.1:8000)";

const activeTab = ref("books");
const categories = ref([]);
const books = ref([]);
const loading = ref(false);
const submitting = ref(false);
const toast = useToastStore();

const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const editingBookId = ref(null);
const editCoverFile = ref(null);

// ক্যাটাগরি ফর্ম ডেটা
const categoryForm = reactive({
  name: "",
  description: "",
});

// বই ফর্ম ডেটা
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

// নতুন বই Add Modal Open এবং Form Reset
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

// ডেটা ফেচিং
const fetchData = async () => {
  loading.value = true;
  try {
    const [catRes, bookRes] = await Promise.all([
      apiClient.get("/categories"),
      apiClient.get("/books"),
    ]);
    categories.value = catRes.data.data;
    books.value = bookRes.data.data.data;
  } catch (error) {
    console.error("ডেটা লোড করতে সমস্যা হয়েছে:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

// ফাইল সিলেক্ট হ্যান্ডলার
const handleFileChange = (e) => {
  coverImageFile.value = e.target.files[0] || null;
};

// ক্যাটাগরি সেভ হ্যান্ডলার
const handleSaveCategory = async () => {
  submitting.value = true;
  try {
    const response = await apiClient.post("/categories", categoryForm);
    toast.success(response.data.message);
    categoryForm.name = "";
    categoryForm.description = "";
    await fetchData();
  } catch (error) {
    toast.error(error.response?.data?.message || "ক্যাটাগরি যুক্ত করা যায়নি!");
  } finally {
    submitting.value = false;
  }
};

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
    await fetchData();
  } catch (error) {
    toast.error("ক্যাটাগরি ডিলিট ব্যর্থ হয়েছে!");
  }
};

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
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success(response.data.message);

    isAddModalOpen.value = false;

    await fetchData();
  } catch (error) {
    toast.error(error.response?.data?.message || "বই যুক্ত করা সম্ভব হয়নি!");
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
    await fetchData();
  } catch (error) {
    toast.error("বই ডিলিট ব্যর্থ হয়েছে!");
  }
};

const editForm = reactive({
  category_id: "",
  title: "",
  author: "",
  publisher: "",
  total_copies: 1,
  shelf_no: "",
  description: "",
});

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
    await fetchData();
  } catch (err) {
    toast.error(err.response?.data?.message || "বই আপডেট ব্যর্থ হয়েছে!");
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6 border-b pb-4">
      <h1 class="text-2xl font-bold text-slate-800">
        বই ও ক্যাটাগরি ম্যানেজমেন্ট
      </h1>

      <!-- ট্যাব টগল বাটন -->
      <div class="flex space-x-2">
        <button
          @click="openAddModal"
          :class="
            activeTab === 'books'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-200 text-slate-700'
          "
          class="px-4 py-2 rounded-lg font-medium text-sm transition"
        >
          নতুন বই যোগ
        </button>
        <button
          @click="activeTab = 'categories'"
          :class="
            activeTab === 'categories'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-200 text-slate-700'
          "
          class="px-4 py-2 rounded-lg font-medium text-sm transition"
        >
          ক্যাটাগরি ম্যানেজমেন্ট
        </button>
      </div>
    </div>

    <!-- ক্যাটাগরি ট্যাব -->
    <div
      v-if="activeTab === 'categories'"
      class="grid grid-cols-1 md:grid-cols-3 gap-8"
    >
      <!-- ক্যাটাগরি ফর্ম -->
      <div
        class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit"
      >
        <h2 class="text-lg font-bold text-slate-800 mb-4">
          নতুন ক্যাটাগরি যোগ করুন
        </h2>
        <form @submit.prevent="handleSaveCategory" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >ক্যাটাগরির নাম *</label
            >
            <input
              v-model="categoryForm.name"
              type="text"
              placeholder="যেমন: উপন্যাস, মুক্তিযুদ্ধ"
              required
              class="mt-1 w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >বিবরণ</label
            >
            <textarea
              v-model="categoryForm.description"
              rows="3"
              class="mt-1 w-full border rounded-lg p-2 text-sm"
            ></textarea>
          </div>
          <button
            type="submit"
            :disabled="submitting"
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm transition"
          >
            {{ submitting ? "সংরক্ষণ হচ্ছে..." : "ক্যাটাগরি সেভ করুন" }}
          </button>
        </form>
      </div>

      <!-- ক্যাটাগরি লিস্ট -->
      <div
        class="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
      >
        <h2 class="text-lg font-bold text-slate-800 mb-4">
          বর্তমান ক্যাটাগরিসমূহ
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase text-xs">
              <tr>
                <th class="py-3 px-4">নাম</th>
                <th class="py-3 px-4">মোট বই</th>
                <th class="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="cat in categories" :key="cat.id">
                <td class="py-3 px-4 font-medium text-slate-800">
                  {{ cat.name }}
                </td>
                <td class="py-3 px-4">{{ cat.books_count }} টি</td>
                <td class="py-3 px-4 text-right">
                  <button
                    @click="handleDeleteCategory(cat.id)"
                    class="text-red-500 hover:text-red-700 font-semibold"
                  >
                    মুছুন
                  </button>
                </td>
              </tr>
              <tr v-if="categories.length === 0">
                <td colspan="3" class="text-center py-4 text-slate-400">
                  কোনো ক্যাটাগরি তৈরি করা হয়নি।
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- বই ট্যাব (এখন পুরো স্ক্রিন জুড়ে টেবিল থাকবে) -->
    <div
      v-if="activeTab === 'books'"
      class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs"
    >
      <div
        class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6"
      >
        <div>
          <h2 class="text-lg font-bold text-slate-800">সংরক্ষিত বইসমূহ</h2>
          <p class="text-xs text-slate-500">
            মোট {{ books.length }} টি বই প্রদর্শিত হচ্ছে
          </p>
        </div>

        //Search
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase text-xs">
            <tr>
              <th class="py-3 px-4">ছবি</th>
              <th class="py-3 px-4">বই ও লেখক</th>
              <th class="py-3 px-4">প্রকাশক</th>
              <th class="py-3 px-4">কপি (মোট / অবশিষ্ট)</th>
              <th class="py-3 px-4">শেলফ</th>
              <th class="py-3 px-4 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="book in books"
              :key="book.id"
              class="hover:bg-slate-50/70 transition"
            >
              <td class="py-3 px-4">
                <img
                  v-if="book.cover_image"
                  :src="storageUrl + book.cover_image"
                  class="h-12 w-9 object-cover rounded shadow-xs"
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
                  {{ book.author }} &bull;
                  <span class="text-emerald-700 font-medium">{{
                    book.category?.name
                  }}</span>
                </div>
              </td>
              <td class="py-3 px-4 text-xs text-slate-500">
                {{ book.publisher || "---" }}
              </td>
              <td class="py-3 px-4 font-medium">
                <span class="text-slate-800">{{ book.total_copies }}</span> /
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
            <tr v-if="books.length === 0">
              <td colspan="6" class="text-center py-8 text-slate-400">
                কোনো বই পাওয়া যায়নি।
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Book Add Modal -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div
        class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div class="flex justify-between items-center border-b pb-3">
          <h3 class="text-lg font-bold text-slate-800">নতুন বই এন্ট্রি করুন</h3>

          <button
            @click="isAddModalOpen = false"
            class="text-slate-400 hover:text-slate-600 text-2xl"
          >
            &times;
          </button>
        </div>

        <form @submit.prevent="handleSaveBook" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700">
              ক্যাটাগরি *
            </label>

            <select
              v-model="bookForm.category_id"
              required
              class="mt-1 w-full border rounded-lg p-2 text-sm bg-white"
            >
              <option value="" disabled>ক্যাটাগরি নির্বাচন করুন</option>

              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">
              বইয়ের শিরোনাম *
            </label>

            <input
              v-model="bookForm.title"
              type="text"
              required
              class="mt-1 w-full border rounded-lg p-2 text-sm"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700">
                লেখক *
              </label>

              <input
                v-model="bookForm.author"
                type="text"
                required
                class="mt-1 w-full border rounded-lg p-2 text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">
                প্রকাশক
              </label>

              <input
                v-model="bookForm.publisher"
                type="text"
                class="mt-1 w-full border rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700">
                মোট কপি *
              </label>

              <input
                v-model="bookForm.total_copies"
                type="number"
                min="1"
                required
                class="mt-1 w-full border rounded-lg p-2 text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">
                শেলফ নম্বর
              </label>

              <input
                v-model="bookForm.shelf_no"
                type="text"
                placeholder="যেমন: A-04"
                class="mt-1 w-full border rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">
              কভার ইমেজ
            </label>

            <input
              type="file"
              accept="image/*"
              @change="handleFileChange"
              class="mt-1 w-full text-sm text-slate-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">
              বইয়ের পরিচিতি / বিবরণ
            </label>

            <textarea
              v-model="bookForm.description"
              rows="3"
              class="mt-1 w-full border rounded-lg p-2 text-sm"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              @click="isAddModalOpen = false"
              class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              বাতিল
            </button>

            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold disabled:opacity-50"
            >
              {{ submitting ? "সংরক্ষণ হচ্ছে..." : "বই সংরক্ষণ করুন" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Book Edit Modal -->
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
        <div class="flex justify-between items-center border-b pb-3">
          <h3 class="text-lg font-bold text-slate-800">
            বইয়ের তথ্য আপডেট করুন
          </h3>
          <button
            @click="isEditModalOpen = false"
            class="text-slate-400 hover:text-slate-600 text-xl font-bold"
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
              class="mt-1 w-full border rounded-lg p-2 text-sm bg-white"
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
              class="mt-1 w-full border rounded-lg p-2 text-sm"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >লেখক *</label
              >
              <input
                v-model="editForm.author"
                type="text"
                required
                class="mt-1 w-full border rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >প্রকাশক</label
              >
              <input
                v-model="editForm.publisher"
                type="text"
                class="mt-1 w-full border rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >মোট কপি *</label
              >
              <input
                v-model="editForm.total_copies"
                type="number"
                min="1"
                required
                class="mt-1 w-full border rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700"
                >শেলফ নম্বর</label
              >
              <input
                v-model="editForm.shelf_no"
                type="text"
                class="mt-1 w-full border rounded-lg p-2 text-sm"
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
              @change="(e) => (editCoverFile = e.target.files[0])"
              class="mt-1 w-full text-xs text-slate-500"
            />
          </div>

          <div class="flex justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              @click="isEditModalOpen = false"
              class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              বাতিল
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-semibold"
            >
              {{ submitting ? "আপডেট হচ্ছে..." : "পরিবর্তন সেভ করুন" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
