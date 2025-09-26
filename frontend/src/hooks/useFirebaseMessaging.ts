// useFirebaseMessaging.ts
import { useEffect, useRef, useState } from "react";
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "react-toastify";
import api from "../utils/api";

export const useFirebaseMessaging = (user: any) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const listenerSet = useRef(false);

  useEffect(() => {
    if (!user || !user._id) return; // only run if user exists

    const storageKey = `fcm_token_${user._id}`;
    const inWebView = typeof window !== "undefined" && !!(window as any).ReactNativeWebView;

    // Helper: persist & send to backend (same for both flows)
    const saveAndSendToken = async (token: string | null) => {
      if (!token) return;
      const savedToken = localStorage.getItem(storageKey);
      if (token !== savedToken) {
        setFcmToken(token);
        localStorage.setItem(storageKey, token);
        try {
          await api.post("/users/save-token", {
            userId: user._id,
            fcmToken: token,
            deviceInfo: navigator.userAgent,
          });
          console.log("Saved token to backend");
        } catch (err) {
          console.warn("Failed to save token to backend", err);
        }
      } else {
        setFcmToken(savedToken);
      }
    };

    // ---------- WebView branch ----------
    if (inWebView) {
      console.log("Running inside WebView — requesting native token");

      const onNativeMessage = (event: MessageEvent) => {
        // event.data may already be an object or a JSON string
        let payload: any = event.data;
        try {
          if (typeof payload === "string") payload = JSON.parse(payload);
        } catch (e) {
          // ignore parse errors
        }

        if (payload?.type === "FCM_TOKEN" && payload.token) {
          console.log("Received native FCM token from RN:", payload.token);
          saveAndSendToken(payload.token);
        }
      };

      // Listen for messages from native
      window.addEventListener("message", onNativeMessage);

      // Ask native to send token (native should respond with FCM_TOKEN)
      try {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: "REQUEST_NATIVE_TOKEN" }));
      } catch (e) {
        console.warn("Failed to post REQUEST_NATIVE_TOKEN to RN WebView host", e);
      }

      // cleanup
      return () => {
        window.removeEventListener("message", onNativeMessage);
      };
    }

    // ---------- Normal browser flow (unchanged, but cleaned up) ----------
    (async function browserFlow() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Notification permission not granted");
          return;
        }

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (!token) {
          console.warn("getToken returned null/undefined");
          return;
        }

        console.log("Browser FCM token:", token);
        await saveAndSendToken(token);
      } catch (err) {
        console.error("FCM token error (browser):", err);
      }
    })();

    // Set up onMessage listener only once (to show toast on foreground messages)
    if (!listenerSet.current) {
      onMessage(messaging, (payload) => {
        toast.info(
          `${payload.notification?.title || "Notification"}: ${payload.notification?.body || ""}`,
          { position: "top-right", autoClose: 5000 }
        );
      });
      listenerSet.current = true;
    }

    // cleanup handled by no-op return here (browserFlow uses Promise)
    // but we still return a cleanup function for React's useEffect
    return () => {
      // nothing else to cleanup here for browser flow; onMessage handler preserved globally via listenerSet
    };
  }, [user?._id]);

  return fcmToken;
};
