declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        opts?: {
          onSuccess?: (res: any) => void;
          onPending?: (res: any) => void;
          onError?: (err: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}
export {};