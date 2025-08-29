// src/utils/errorModal.ts
import { alertController } from '@ionic/vue';

export const showErrorModal = async (msg: string) => {
  const alert = await alertController.create({
    header: 'Error',
    message: msg,
    buttons: ['OK'],
  });
  await alert.present();
};

// Initialize global error listeners
export const initGlobalErrorHandler = () => {
  window.onerror = (msg, url, line, col) => {
    showErrorModal(`${msg} at ${line}:${col}`);
  };

  window.addEventListener('unhandledrejection', (e) => {
    showErrorModal(e.reason?.toString() || 'Unhandled promise rejection');
  });
};
