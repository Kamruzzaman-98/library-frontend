import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import CatalogView from "../views/CatalogView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import AdminBooksView from "../views/AdminBooksView.vue";
import AdminDashboardView from "../views/AdminDashboardView.vue";
import MyBorrowsView from "../views/MyBorrowsView.vue";
import AdminBorrowsView from "../views/AdminBorrowsView.vue";
import AdminNoticesView from "../views/AdminNoticeView.vue";
import SettingsEditView from "../views/SettingsEditView.vue";

import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomeView,
  },
  {
    path: "/books",
    name: "catalog",
    component: CatalogView,
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
    meta: { guestOnly: true },
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: "/admin/dashboard",
    name: "admin-dashboard",
    component: AdminDashboardView,
    meta: { requiresAdmin: true },
  },
  {
    path: "/admin/books",
    name: "admin-books",
    component: AdminBooksView,
    meta: { requiresAdmin: true },
  },
  {
    path: "/my-borrows",
    name: "my-borrows",
    component: MyBorrowsView,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin/borrows",
    name: "admin-borrows",
    component: AdminBorrowsView,
    meta: { requiresAdmin: true },
  },
  {
    path: "/admin/notices",
    name: "admin-notices",
    component: AdminNoticesView,
    meta: { requiresAdmin: true },
  },
  {
    path: "/admin/settings-edit",
    name: "SettingsEdit",
    component: SettingsEditView,
    meta: { requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return "/login";
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return "/";
  }

  return true;
});

export default router;
