"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/sw-register";

/**
 * Client component to register the PageCast offline service worker on initial mount.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register service worker in browser environments
    if (process.env.NODE_ENV === "production" || typeof window !== "undefined") {
      registerServiceWorker();
    }
  }, []);

  return null;
}
