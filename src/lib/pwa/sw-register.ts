/**
 * Client-Side Service Worker Registration Manager (TASK-S4-OFF-02 / FR-070 / FR-075)
 * Safely registers and manages the PageCast service worker lifecycle.
 */

export interface SwRegistrationStatus {
  supported: boolean;
  registered: boolean;
  error?: string;
  scope?: string;
}

/**
 * Registers the PageCast Service Worker in supported browser environments.
 */
export async function registerServiceWorker(): Promise<SwRegistrationStatus> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { supported: false, registered: false };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    return {
      supported: true,
      registered: true,
      scope: registration.scope,
    };
  } catch (err: any) {
    return {
      supported: true,
      registered: false,
      error: err?.message || "Failed to register service worker",
    };
  }
}

/**
 * Unregisters any active PageCast service worker (used in testing & cleanup).
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (registration) {
      return await registration.unregister();
    }
    return false;
  } catch {
    return false;
  }
}
