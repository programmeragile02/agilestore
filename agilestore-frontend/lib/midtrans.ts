let snapReady = false;

export async function ensureSnap(
  clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!
) {
  if (snapReady || window.snap?.pay) return;

  await new Promise<void>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    s.async = true;
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => {
      snapReady = true;
      resolve();
    };
    document.body.appendChild(s);
  });
}

export function openSnap(token: string, orderId: string) {
  window.snap?.pay?.(token, {
    onSuccess: () => (window.location.href = `/orders/${orderId}?status=success`),
    onPending: () => (window.location.href = `/orders/${orderId}?status=pending`),
    onError:   () => (window.location.href = `/orders/${orderId}?status=error`),
    onClose:   () => (window.location.href = `/orders/${orderId}?status=closed`),
  });
}