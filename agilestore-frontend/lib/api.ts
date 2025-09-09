import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE = "http://localhost:8000/api/";
/**
 * Customer AUTH.
 */
const TOKEN_KEY = "customer_access_token";

// Instance untuk BACKEND Laravel
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // pakai Bearer dari localStorage, bukan cookie
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Instance untuk API internal Next.js (produk/pricing/checkout/notify)
export const nextApi = axios.create({
  baseURL: "", // relative ke Next app
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ---------- Token helpers ----------
export function setCustomerToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearCustomerToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ---------- Interceptor: tambahkan Authorization ----------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getCustomerToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- Interceptor: auto refresh 1x saat 401 ----------
// let isRefreshing = false;
// let pendingQueue: Array<(t: string | null) => void> = [];

// function resolveQueue(token: string | null) {
//   pendingQueue.forEach((cb) => cb(token));
//   pendingQueue = [];
// }

// Panggil endpoint refresh Laravel
// async function refreshCustomerToken(): Promise<string | null> {
//   try {
//     const res = await api.post("customer/refresh", {});
//     const newToken: string | undefined = res?.data?.access_token;
//     if (newToken) {
//       setCustomerToken(newToken);
//       api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
//       return newToken;
//     }
//   } catch {
//     // ignore
//   }
//   clearCustomerToken();
//   return null;
// }

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    const status = error.response?.status;

    // Jika UNAUTHORIZED
    if (status === 401) {
      // 1) Bersihkan token supaya tidak terus2an kirim Bearer invalid
      clearCustomerToken();

      // 2) Opsional: arahkan ke login + next (hanya di browser) jangan redirect agar halaman bisa diakses ketika user blm login selain checkut
      // if (typeof window !== "undefined") {
      //   const url = new URL(window.location.href);
      //   const currentPathAndQuery = url.pathname + url.search;
      //   // Hindari loop kalau kita memang sedang di halaman login
      //   if (!url.pathname.startsWith("/login")) {
      //     window.location.href = `/login?next=${encodeURIComponent(currentPathAndQuery)}`;
      //   }
      // }
    }

    // Jangan lakukan auto refresh di sisi FE (backend belum siap)
    return Promise.reject(error);
  }
);

// export interface Product {
//   id: number;
//   name: string;
//   slug: string;
//   shortDescription: string;
//   longDescription: string;
//   heroImage: string;
//   category: string;
//   features: string[];
//   packages: string[];
//   durations: number[];
//   status: string;
// }

// export interface PricingPackage {
//   package: string;
//   name: string;
//   description: string;
//   features: string[];
//   pricing: Record<number, number>;
// }

// export interface CheckoutData {
//   contact: {
//     fullName: string;
//     email: string;
//     phone: string;
//     company?: string;
//   };
//   plan: {
//     product: string;
//     package: string;
//     duration: number;
//     currency: string;
//     taxMode: "inclusive" | "exclusive";
//   };
//   payment: {
//     method: "card" | "bank_transfer" | "ewallet";
//     cardDetails?: {
//       number: string;
//       expiry: string;
//       cvv: string;
//     };
//   };
//   voucher?: {
//     code: string;
//     discount: number;
//   };
//   amount: number;
// }

// ===============================
// FUNGSI PRODUK/PRICING/CHECKOUT/ORDER/NOTIFY
// ===============================

// Fetch all products
// Fetch all products (langsung ke Laravel)
export const fetchProducts = async () => {
  const { data } = await api.get("products")
  if (!data?.success) throw new Error(data?.error || "Failed to fetch products")
  return data.data
}

// Fetch detail product
export const fetchProductDetail = async (productCode: string) => {
  const { data } = await api.get(`products/${encodeURIComponent(productCode)}`)
  if (!data?.success) throw new Error(data?.error || "Failed to fetch product detail")
  return data.data
}

// ===============================
// CUSTOMER AUTH (Laravel 12 - sesuai controller kamu)
// ===============================

export interface CustomerUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  company?: string | null;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CustomerRegisterPayload {
  full_name: string;
  email: string;
  phone: string;
  company?: string | null;
  password: string;
}

export interface CustomerLoginPayload {
  email: string;
  password: string;
}

export interface CustomerTokenResponse {
  success: boolean;
  token_type: "Bearer";
  access_token: string;
  expires_in: number; // seconds
  user: CustomerUser;
}

// Register
export async function registerCustomer(payload: CustomerRegisterPayload) {
  // POST /api/customer/register -> { success, message, data: CustomerUser }
  const { data } = await api.post("customer/register", payload);
  if (data?.success === false) throw new Error(data?.message || "Registration failed");
  return data as { success: true; message: string; data: CustomerUser };
}

// Login (simpan token)
export async function loginCustomer(payload: CustomerLoginPayload) {
  // POST /api/customer/login -> { access_token, expires_in, user }
  const { data } = await api.post("customer/login", payload);
  if (!data?.access_token) throw new Error(data?.message || "Login failed");
  setCustomerToken(String(data.access_token));
  return data as CustomerTokenResponse;
}

// Me (profil customer saat ini)
export async function getCustomerMe() {
  // GET /api/customer/me -> { success, data: CustomerUser }
  const { data } = await api.get("customer/me");
  if (data?.success === false) throw new Error(data?.message || "Failed to fetch profile");
  return data.data as CustomerUser;
}

// Logout (hapus token)
export async function logoutCustomer() {
  try {
    await api.post("customer/logout");
  } finally {
    clearCustomerToken();
  }
}

// Refresh token (dipakai juga oleh interceptor)
// export async function manualRefreshCustomerToken() {
//   const token = await refreshCustomerToken();
//   if (!token) throw new Error("Refresh token failed");
//   return token;
// }

// Update Profile (full_name/email/phone/company)
export async function updateCustomerProfile(partial: Partial<Omit<CustomerRegisterPayload, "password">>) {
  const { data } = await api.put("customer/profile", partial);
  if (data?.success === false) throw new Error(data?.message || "Update profile failed");
  return data as { success: true; message: string; data: CustomerUser };
}

// Upload Profile Photo (multipart)
export async function uploadCustomerProfilePhoto(file: File) {
  const fd = new FormData();
  fd.append("photo", file);
  const { data } = await api.post("customer/profile/photo", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (data?.success === false) throw new Error(data?.message || "Upload photo failed");
  return data as { success: true; message: string; data: { profile_photo: string; profile_photo_url: string } };
}

// Delete Profile Photo
export async function deleteCustomerProfilePhoto() {
  const { data } = await api.delete("customer/profile/photo");
  if (data?.success === false) throw new Error(data?.message || "Delete photo failed");
  return data as { success: true; message: string };
}

// Change Password
export async function changeCustomerPassword(payload: { current_password: string; new_password: string }) {
  const { data } = await api.post("customer/change-password", payload);
  if (data?.success === false) throw new Error(data?.message || "Change password failed");
  return data as { success: true; message: string };
}

// Forgot Password
export async function forgotCustomerPassword(email: string) {
  const { data } = await api.post("customer/forgot-password", { email });
  if (data?.success === false) throw new Error(data?.message || "Forgot password failed");
  return data as { success: true; message: string };
}

// Reset Password
export async function resetCustomerPassword(payload: { email: string; token: string; new_password: string }) {
  const { data } = await api.post("customer/reset-password", payload);
  if (data?.success === false) throw new Error(data?.message || "Reset password failed");
  return data as { success: true; message: string };
}

// order
export type CreateOrderPayload = {
  product_code: string;
  package_code: string;
  duration_code: string; // "M1" | "M6" | "M12"
};

export type CreateOrderResponse = {
  order_id: string;
  snap_token: string;
  total: number;
  currency: string;
  status: string;
};

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  const { data } = await api.post("orders", payload);
  if (data?.success === false) throw new Error(data?.message || "Failed to create order");
  return data.data as CreateOrderResponse;
}

// order detail
export async function getOrder(id: string) {
  const res = await api.get(`orders/${id}`);
  return res.data;
}

// refresh status order
export async function refreshOrderStatus(id: string) {
  const res = await api.post(`orders/${id}/refresh-status`);
  return res.data;
}

// my-products
export type MyProductsItem = {
  order_id: string;
  midtrans_order_id: string;
  status: "paid" | "expired" | "failed" | string;
  is_active: boolean;              // flag DB
  is_currently_active: boolean;    // hasil hitung now()
  price: number;
  discount: number;
  total: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  product: { code: string; name?: string | null };
  package: { code: string; name?: string | null };
  duration: { code: string; name?: string | null };
};

export type MyProductsResponse = {
  items: MyProductsItem[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
};

/**
 * GET /api/customer/my-products
 * @param params.active 1 = hanya yang masih aktif sekarang, 0 = yang sudah tidak aktif, undefined = semua yang paid
 * @param params.page
 * @param params.per_page
 */
export async function fetchMyProducts(params?: { active?: 0 | 1; page?: number; per_page?: number }): Promise<MyProductsResponse> {
  const { data } = await api.get("customer/my-products", { params });
  if (data?.success === false) throw new Error(data?.message || "Failed to fetch my products");
  // bentuk data: { success, data: { items, meta } }
  return data.data as MyProductsResponse;
}

// Invoice
export type InvoiceItem = {
  order_id: string;
  midtrans_order_id: string;
  date: string;             // "2025-01-15"
  product_name: string;
  package_name: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "expired" | string;
};

export type InvoicesResponse = {
  items: InvoiceItem[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
};

/** GET /api/customer/invoices?status=&page=&per_page= */
export async function fetchCustomerInvoices(params?: {
  status?: "paid" | "pending" | "failed" | "expired";
  page?: number;
  per_page?: number;
}): Promise<InvoicesResponse> {
  const { data } = await api.get("customer/invoices", { params });
  if (data?.success === false) throw new Error(data?.message || "Failed to fetch invoices");
  return data.data as InvoicesResponse;
}