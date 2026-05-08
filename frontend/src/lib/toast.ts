type ToastOptions = {
  id?: string;
};

let toastSequence = 0;

function emitToast(type: 'loading' | 'success' | 'error', message: string, options?: ToastOptions): string {
  const id = options?.id ?? `toast-${Date.now()}-${toastSequence++}`;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('mvh-toast', {
        detail: { id, type, message },
      }),
    );
  }

  const logger = type === 'error' ? console.error : console.info;
  logger(`[${type}] ${message}`);

  return id;
}

const toast = {
  loading(message: string, options?: ToastOptions) {
    return emitToast('loading', message, options);
  },
  success(message: string, options?: ToastOptions) {
    return emitToast('success', message, options);
  },
  error(message: string, options?: ToastOptions) {
    return emitToast('error', message, options);
  },
};

export default toast;
