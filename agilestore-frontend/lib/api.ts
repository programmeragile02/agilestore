import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE = "http://localhost:8001/api/";
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

// ===============================
// FUNGSI PRODUK/PRICING/CHECKOUT/ORDER/NOTIFY
// ===============================

// Fetch all products
// Fetch all products (langsung ke Laravel)
export const fetchProducts = async () => {
  const { data } = await api.get("products");
  if (!data?.success)
    throw new Error(data?.error || "Failed to fetch products");
  return data.data;
};

// Fetch detail product
export const fetchProductDetail = async (productCode: string) => {
  const { data } = await api.get(`products/${encodeURIComponent(productCode)}`);
  if (!data?.success)
    throw new Error(data?.error || "Failed to fetch product detail");
  return data.data;
};

// fetch landing page
export async function fetchLandingPage(productCode: string) {
  const { data } = await api.get(`catalog/products/landing/${productCode}`, {});
  return data?.data ?? data; // konsisten dengan pola kamu
}

// ===============================
// CUSTOMER AUTH
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

// Login With Google
export async function loginWithGoogle(idToken: string) {
  const { data } = await api.post("customer/oauth/google", {
    id_token: idToken,
  });
  if (!data?.access_token)
    throw new Error(data?.message || "Google login failed");
  setCustomerToken(String(data.access_token)); // TOKEN_KEY = customer_access_token
  return data as CustomerTokenResponse;
}

// Register
export async function registerCustomer(payload: CustomerRegisterPayload) {
  // POST /api/customer/register -> { success, message, data: CustomerUser }
  const { data } = await api.post("customer/register", payload);
  if (data?.success === false)
    throw new Error(data?.message || "Registration failed");
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
  if (data?.success === false)
    throw new Error(data?.message || "Failed to fetch profile");
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
export async function updateCustomerProfile(
  partial: Partial<Omit<CustomerRegisterPayload, "password">>
) {
  const { data } = await api.put("customer/profile", partial);
  if (data?.success === false)
    throw new Error(data?.message || "Update profile failed");
  return data as { success: true; message: string; data: CustomerUser };
}

// Upload Profile Photo (multipart)
export async function uploadCustomerProfilePhoto(file: File) {
  const fd = new FormData();
  fd.append("photo", file);
  const { data } = await api.post("customer/profile/photo", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (data?.success === false)
    throw new Error(data?.message || "Upload photo failed");
  return data as {
    success: true;
    message: string;
    data: { profile_photo: string; profile_photo_url: string };
  };
}

// Delete Profile Photo
export async function deleteCustomerProfilePhoto() {
  const { data } = await api.delete("customer/profile/photo");
  if (data?.success === false)
    throw new Error(data?.message || "Delete photo failed");
  return data as { success: true; message: string };
}

// Change Password
export async function changeCustomerPassword(payload: {
  current_password: string;
  new_password: string;
}) {
  const { data } = await api.put("customer/change-password", payload);
  if (data?.success === false)
    throw new Error(data?.message || "Change password failed");
  return data as { success: true; message: string };
}

// Forgot Password
export async function forgotCustomerPassword(email: string) {
  const { data } = await api.post("customer/forgot-password", { email });
  if (data?.success === false)
    throw new Error(data?.message || "Forgot password failed");
  return data as { success: true; message: string };
}

// Reset Password
export async function resetCustomerPassword(payload: {
  email: string;
  token: string;
  new_password: string;
}) {
  const { data } = await api.post("customer/reset-password", payload);
  if (data?.success === false)
    throw new Error(data?.message || "Reset password failed");
  return data as { success: true; message: string };
}

// order
// export type CreateOrderPayload = {
//   product_code: string;
//   package_code: string;
//   duration_code: string; // "M1" | "M6" | "M12"
// };

// export type CreateOrderResponse = {
//   order_id: string;
//   snap_token: string;
//   total: number;
//   currency: string;
//   status: string;
// };

// export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
//   const { data } = await api.post("orders", payload);
//   if (data?.success === false) throw new Error(data?.message || "Failed to create order");
//   return data.data as CreateOrderResponse;
// }

// --- types umum (ORDER)
export type OrderIntent = "purchase" | "renew" | "upgrade";

export type CreatePurchasePayload = {
  product_code: string;
  package_code: string;
  duration_code: string;
};

export type CreateRenewPayload = {
  base_order_id: string;
  product_code: string;
  package_code: string;
  duration_code: string;
};

export type CreateUpgradePayload = {
  base_order_id: string; // id UUID order sebelumnya
  product_code: string;
  package_code: string; // paket tujuan
  // kalau in-place & periode tidak berubah, backend bisa abaikan durasi;
  // tapi kalau mau tetap kirim:
  duration_code?: string;
};

export type CreateOrderResponse = {
  order_id: string;
  midtrans_order_id: string;
  snap_token: string;
  total: number;
  currency: string;
  status: string;
};

// New order (Purchase)
export async function createPurchaseOrder(payload: CreatePurchasePayload) {
  const { data } = await api.post("orders", payload);
  if (data?.success === false)
    throw new Error(data?.message || "Failed to create purchase order");
  return data.data as CreateOrderResponse;
}

// Renew (Perpanjangan)
export async function createRenewOrder(payload: CreateRenewPayload) {
  const { data } = await api.post("orders/renew", payload);
  if (data?.success === false)
    throw new Error(data?.message || "Failed to create renew order");
  return data.data as CreateOrderResponse;
}

export async function createUpgradeOrder(payload: CreateUpgradePayload) {
  const { data } = await api.post("orders/upgrade", payload);
  if (data?.success === false)
    throw new Error(data?.message || "Failed to create upgrade order");
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
  is_active: boolean; // flag DB
  is_currently_active: boolean; // hasil hitung now()
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
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

/**
 * GET /api/customer/my-products
 * @param params.active 1 = hanya yang masih aktif sekarang, 0 = yang sudah tidak aktif, undefined = semua yang paid
 * @param params.page
 * @param params.per_page
 */
export async function fetchMyProducts(params?: {
  active?: 0 | 1;
  page?: number;
  per_page?: number;
}): Promise<MyProductsResponse> {
  const { data } = await api.get("customer/my-products", { params });
  if (data?.success === false)
    throw new Error(data?.message || "Failed to fetch my products");
  // bentuk data: { success, data: { items, meta } }
  return data.data as MyProductsResponse;
}

// Invoice
export type InvoiceItem = {
  order_id: string;
  midtrans_order_id: string;
  date: string; // "2025-01-15"
  product_name: string;
  package_name: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "expired" | string;
  intent: string;
  end_date: string | null;
};

export type InvoicesResponse = {
  items: InvoiceItem[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

/** GET /api/customer/invoices?status=&page=&per_page= */
export async function fetchCustomerInvoices(params?: {
  status?: "paid" | "pending" | "failed" | "expired";
  page?: number;
  per_page?: number;
}): Promise<InvoicesResponse> {
  const { data } = await api.get("customer/invoices", { params });
  if (data?.success === false)
    throw new Error(data?.message || "Failed to fetch invoices");
  return data.data as InvoicesResponse;
}

// subscriptions
export type SubscriptionsItem = {
  subscription_id: string;
  product: { code: string; name?: string | null };
  package: { code: string; name?: string | null };
  duration: { code: string; name?: string | null };
  start_date: string | null;
  end_date: string | null;
  is_active: boolean; // flag DB
  is_currently_active: boolean; // hasil hitung now()
  status: string;
  meta?: {
    last_paid_order_id?: string; // <— pakai ini utk base_order_id
  };
};

export type SubscriptionsResponse = {
  items: SubscriptionsItem[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

/**
 * GET /api/customer/subscriptions
 * @param params.active 1 = hanya yang masih aktif sekarang, 0 = yang sudah tidak aktif, undefined = semua yang paid
 * @param params.page
 * @param params.per_page
 */
export async function fetchSubscriptions(params?: {
  active?: 0 | 1;
  page?: number;
  per_page?: number;
}): Promise<SubscriptionsResponse> {
  const { data } = await api.get("customer/subscriptions", { params });
  if (data?.success === false)
    throw new Error(data?.message || "Failed to fetch subscriptions");
  // bentuk data: { success, data: { items, meta } }
  return data.data as SubscriptionsResponse;
}

// ---------- ADD-ON CATALOG ----------
export type AddonItem = {
  feature_code: string;
  name: string;
  price_addon: number;
  included: boolean;
};

export type AddonCatalogResponse = {
  product_code: string;
  package_code: string;
  currency: string;
  items: AddonItem[];
};

// GET /api/catalog/addons?product_code=&package_code=
export async function fetchAddonCatalog(
  productCode: string,
  packageCode: string
) {
  const { data } = await api.get("catalog/addons", {
    params: { product_code: productCode, package_code: packageCode },
  });
  if (data?.success === false)
    throw new Error(data?.message || "Failed to fetch add-on catalog");
  return data.data as AddonCatalogResponse;
}

// ---------- CREATE ADD-ON ORDER ----------
export type CreateAddonOrderPayload = {
  product_code: string;
  // optional: kirim subscription_instance_id kalau kamu pakai multi-instance
  subscription_instance_id?: string | null;
  features: string[]; // daftar feature_code yang dipilih (hanya yg tidak included)
};

export async function createAddonOrder(payload: CreateAddonOrderPayload) {
  const { data } = await api.post("orders/addon", payload);
  if (data?.success === false)
    throw new Error(data?.message || "Failed to create add-on order");
  return data.data as { order_id: string; snap_token: string; total: number };
}

// === INVOICE: Download PDF ===
export async function downloadInvoice(orderId: string): Promise<Blob> {
  const { data } = await api.get(
    `orders/${encodeURIComponent(orderId)}/invoice`,
    {
      responseType: "blob", // <-- penting untuk PDF
    }
  );
  return data as Blob;
}

// Agile Store Setting
export type AgileStoreSectionResp<T = any> = {
  id?: number;
  key: string;
  name?: string | null;
  enabled?: boolean;
  order?: number;
  theme?: Record<string, any> | null;
  content?: T | null;
  items?: any[]; // bentuk item tergantung section
};

async function getSection<T = any>(
  key: string,
  init?: RequestInit
): Promise<AgileStoreSectionResp<T> | null> {
  const res = await fetch(`${API_BASE}agile-store/sections/${key}`, {
    cache: "no-store",
    ...(init ?? {}),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export const AgileStoreAPI = {
  getSection,
};
