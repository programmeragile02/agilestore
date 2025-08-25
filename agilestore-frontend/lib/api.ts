// API utility functions for client-side requests
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE = "http://localhost:8000/api/";

// // Fetch all products
// export const fetchProducts = async (): Promise<Product[]> => {
//   const response = await fetch("/api/products");
//   const result = await response.json();

//   if (!result.success) {
//     throw new Error(result.error || "Failed to fetch products");
//   }

//   return result.data;
// };

// Fetch pricing for a specific product
// export const fetchPricing = async (
//   productSlug: string
// ): Promise<PricingPackage[]> => {
//   const response = await fetch(`/api/pricing?product=${productSlug}`);
//   const result = await response.json();

//   if (!result.success) {
//     throw new Error(result.error || "Failed to fetch pricing");
//   }

//   return result.data.packages;
// };

// Process checkout
// export const processCheckout = async (checkoutData: CheckoutData) => {
//   const response = await fetch("/api/checkout", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(checkoutData),
//   });

//   const result = await response.json();

//   if (!result.success) {
//     throw new Error(result.error || "Checkout failed");
//   }

//   return result.data;
// };

// Fetch order details
// export const fetchOrder = async (orderId: string) => {
//   const response = await fetch(`/api/order/${orderId}`);
//   const result = await response.json();

//   if (!result.success) {
//     throw new Error(result.error || "Failed to fetch order");
//   }

//   return result.data;
// };

// Send notifications
// export const sendNotification = async (notificationData: {
//   type: "email" | "whatsapp" | "both";
//   recipient: {
//     email?: string;
//     phone?: string;
//     name: string;
//   };
//   template: "order_confirmation" | "payment_success" | "account_activation";
//   data: Record<string, any>;
// }) => {
//   const response = await fetch("/api/notify", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(notificationData),
//   });

//   const result = await response.json();

//   if (!result.success) {
//     throw new Error(result.error || "Failed to send notification");
//   }

//   return result.data;
// };

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
let isRefreshing = false;
let pendingQueue: Array<(t: string | null) => void> = [];

function resolveQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

// Panggil endpoint refresh Laravel
async function refreshCustomerToken(): Promise<string | null> {
  try {
    const res = await api.post("/api/customer/refresh", {});
    const newToken: string | undefined = res?.data?.access_token;
    if (newToken) {
      setCustomerToken(newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      return newToken;
    }
  } catch {
    // ignore
  }
  clearCustomerToken();
  return null;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    const status = error.response?.status;

    if (status === 401 && !original?._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push((token) => {
            if (token) {
              original.headers = original.headers || {};
              original.headers.Authorization = `Bearer ${token}`;
              original._retry = true;
              resolve(api.request(original));
            } else {
              resolve(Promise.reject(error));
            }
          });
        });
      }

      isRefreshing = true;
      const newToken = await refreshCustomerToken();
      isRefreshing = false;
      resolveQueue(newToken);

      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        original._retry = true;
        return api.request(original);
      }
    }

    return Promise.reject(error);
  }
);

export interface Product {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  heroImage: string;
  category: string;
  features: string[];
  packages: string[];
  durations: number[];
  status: string;
}

export interface PricingPackage {
  package: string;
  name: string;
  description: string;
  features: string[];
  pricing: Record<number, number>;
}

export interface CheckoutData {
  contact: {
    fullName: string;
    email: string;
    phone: string;
    company?: string;
  };
  plan: {
    product: string;
    package: string;
    duration: number;
    currency: string;
    taxMode: "inclusive" | "exclusive";
  };
  payment: {
    method: "card" | "bank_transfer" | "ewallet";
    cardDetails?: {
      number: string;
      expiry: string;
      cvv: string;
    };
  };
  voucher?: {
    code: string;
    discount: number;
  };
  amount: number;
}

// ===============================
// FUNGSI PRODUK/PRICING/CHECKOUT/ORDER/NOTIFY (Next.js API routes)
// ===============================

// Fetch all products
export const fetchProducts = async (): Promise<Product[]> => {
  const { data: result } = await nextApi.get("/api/products");
  if (!result?.success) throw new Error(result?.error || "Failed to fetch products");
  return result.data;
};

// Fetch pricing for a specific product
export const fetchPricing = async (productSlug: string): Promise<PricingPackage[]> => {
  const { data: result } = await nextApi.get(`/api/pricing`, { params: { product: productSlug } });
  if (!result?.success) throw new Error(result?.error || "Failed to fetch pricing");
  return result.data.packages;
};

// Process checkout
export const processCheckout = async (checkoutData: CheckoutData) => {
  const { data: result } = await nextApi.post("/api/checkout", checkoutData);
  if (!result?.success) throw new Error(result?.error || "Checkout failed");
  return result.data;
};

// Fetch order details
export const fetchOrder = async (orderId: string) => {
  const { data: result } = await nextApi.get(`/api/order/${orderId}`);
  if (!result?.success) throw new Error(result?.error || "Failed to fetch order");
  return result.data;
};

// Send notifications
export const sendNotification = async (notificationData: {
  type: "email" | "whatsapp" | "both";
  recipient: { email?: string; phone?: string; name: string };
  template: "order_confirmation" | "payment_success" | "account_activation";
  data: Record<string, any>;
}) => {
  const { data: result } = await nextApi.post("/api/notify", notificationData);
  if (!result?.success) throw new Error(result?.error || "Failed to send notification");
  return result.data;
};

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
export async function manualRefreshCustomerToken() {
  const token = await refreshCustomerToken();
  if (!token) throw new Error("Refresh token failed");
  return token;
}

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