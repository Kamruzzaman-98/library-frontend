import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

// Layouts
import PublicLayout from "../layouts/PublicLayout.vue";
import AdminLayout from "../layouts/AdminLayout.vue";

// Public & Reader Views
import HomeView from "../views/HomeView.vue";
import CatalogView from "../views/CatalogView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import MyBorrowsView from "../views/MyBorrowsView.vue";

// Admin Views
import AdminDashboardView from "../views/AdminDashboardView.vue";
import AdminBooksView from "../views/AdminBooksView.vue";
import AdminBorrowsView from "../views/AdminBorrowsView.vue";
import AdminNoticesView from "../views/AdminNoticeView.vue";
import SettingsEditView from "../views/SettingsEditView.vue";
import AdminCommunityView from "../views/AdminCommunityView.vue";

const routes = [
  {
    path: "/",
    component: PublicLayout,
    children: [
      { path: "", name: "home", component: HomeView },
      { path: "books", name: "catalog", component: CatalogView },
      { path: "login", name: "login", component: LoginView },
      { path: "register", name: "register", component: RegisterView },
      {
        path: "my-borrows",
        name: "my-borrows",
        component: MyBorrowsView,
        meta: { requiresAuth: true },
      },
    ],
  },

  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAdmin: true },
    redirect: "/admin/dashboard",
    children: [
      {
        path: "dashboard",
        name: "admin-dashboard",
        component: AdminDashboardView,
      },
      { path: "books", name: "admin-books", component: AdminBooksView },
      { path: "borrows", name: "admin-borrows", component: AdminBorrowsView },
      { path: "notices", name: "admin-notices", component: AdminNoticesView },
      { path: "settings", name: "settings-edit", component: SettingsEditView },
      {
        path: "community",
        name: "admin-community",
        component: AdminCommunityView,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next("/login");
  } else if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next("/login");
  } else {
    next();
  }
});

export default router;
