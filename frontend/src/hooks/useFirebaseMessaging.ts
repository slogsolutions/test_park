import { useEffect, useRef, useState } from "react";
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "react-toastify";
import api from "../utils/api";

export const useFirebaseMessaging = (user: any) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const listenerSet = useRef(false);

  useEffect(() => {
    console.log("1 inside hook")
    if (!user || !user._id) return; // only run if user exists
console.log("2  inside hook after check user")
    const requestPermissionAndToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
        if (!token) return;

        const storageKey = `fcm_token_${user._id}`;
        const savedToken = localStorage.getItem(storageKey);

        if (token !== savedToken) {
          setFcmToken(token);
          localStorage.setItem(storageKey, token);

          // ✅ Send to backend with user._id
          await api.post("/users/save-token", {
            userId: user._id,
            fcmToken: token,
            deviceInfo: navigator.userAgent,
          });
        } else {
          setFcmToken(savedToken);
        }
      } catch (err) {
        console.error("FCM token error:", err);
      }
    };

    // Set up message listener only once
    if (!listenerSet.current) {
      onMessage(messaging, (payload) => {
        toast.info(
          `${payload.notification?.title || "Notification"}: ${
            payload.notification?.body || ""
          }`,
          { position: "top-right", autoClose: 5000 }
        );
      });
      listenerSet.current = true;
    }

    requestPermissionAndToken();
  }, [user?._id]);

  return fcmToken;
};
