import { useEffect, useRef, useState } from "react";
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "react-toastify";
import api from "../utils/api";

export const useFirebaseMessaging = (user: any) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const listenerSet = useRef(false);

  useEffect(() => {
    if (!user?.id || !user?.token) return;

    let unsubscribe: (() => void) | null = null;

    const requestPermissionAndToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
        if (!token) return;

        const userTokensKey = `fcm_tokens_${user.id}`;
        const savedToken = localStorage.getItem(userTokensKey);

        if (token !== savedToken) {
          setFcmToken(token);
          localStorage.setItem(userTokensKey, token);

          await api.post(
            "/users/save-token",
            { fcmToken: token, deviceInfo: navigator.userAgent },
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
        } else {
          setFcmToken(savedToken);
        }
      } catch (err) {
        console.error("FCM token error:", err);
      }
    };

    if (!listenerSet.current) {
      unsubscribe = onMessage(messaging, (payload) => {
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

    return () => {
      if (unsubscribe) {
        unsubscribe();
        listenerSet.current = false;
      }
    };
  }, [user?.id, user?.token]);

  return fcmToken;
};
