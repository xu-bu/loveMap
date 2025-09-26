// src/utils/errorModal.ts
import { alertController } from '@ionic/vue';
import type { App } from 'vue';

export const showErrorModal = async (msg: string, title = 'Error') => {
  try {
    const alert = await alertController.create({
      header: title,
      message: msg,
      buttons: ['OK'],
    });
    await alert.present();
  } catch (error) {
    // Fallback to native alert if Ionic fails
    console.error('Failed to show Ionic alert:', error);
    alert(msg);
  }
};

// Initialize global error listeners
export const initGlobalErrorHandler = (app: App) => {
  // Vue-specific error handler - catches ALL Vue errors
  app.config.errorHandler = (error: any, instance: any, info: string) => {
    console.error('Vue Error:', error, 'Info:', info);
    const errorMsg = error?.message || error?.toString() || 'Unknown Vue error';
    showErrorModal(`Vue Error: ${errorMsg}\nContext: ${info}`);
  };

  // Vue warning handler (optional - for development warnings)
  app.config.warnHandler = (msg: string) => {
    console.warn('Vue Warning:', msg);
    // Uncomment if you want warnings as popups too
    // showErrorModal(`Vue Warning: ${msg}`, 'Warning');
  };

  // Global JavaScript errors
  window.onerror = (msg, url, line, col, error) => {
    if (!error) return
    console.error('Global Error:', msg, url, line, col, error);
    const errorMessage = error?.stack || `${msg} at ${url}:${line}:${col}`;
    showErrorModal(`JavaScript Error: ${errorMessage}`);
    return true; // Prevent default browser error handling
  };

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
    showErrorModal(`Promise Rejection: ${e.reason?.toString() || 'Unhandled promise rejection'}`);
    e.preventDefault();
  });

  // Optional: Catch resource loading errors
  window.addEventListener('error', (e) => {
    if (e.target !== window) {
      // This is a resource loading error (images, scripts, etc.)
      const target = e.target as HTMLElement;
      showErrorModal(`Resource failed to load: ${target.tagName} - ${(target as any).src || (target as any).href}`);
    }
  }, true);
};

// Optional: Router error handler
export const initRouterErrorHandler = (router: any) => {
  router.onError((error: any) => {
    console.error('Router Error:', error);
    showErrorModal(`Navigation Error: ${error.message || error}`);
  });
};