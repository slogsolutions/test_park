// Hooks for req , token 
import { useEffect, useRef, useState } from "react";
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "react-toastify";

export const useFirebaseMessaging = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const listenerSet = useRef(false);

  useEffect(() => {
    const requestPermission = async () => {
      console.log("useFirebaseMessaging hook initialized...");
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const token = await getToken(messaging, {
            vapidKey:
              "BIrqu-G8cdBfGaxbvCwBTfPYuFxcOqCQBfbDqcN1zy_e_lpxej2ehbjjmrAwq1PcjqrOFnsqj_IcpN2ssSbp-jo",
          });

          if (token) {
            console.log("✅ New FCM Token:", token);
            setFcmToken(token);
          } else {
            console.warn("⚠️ No FCM token retrieved");
          }
        } else {
          console.warn("❌ Notification permission not granted");
        }
      } catch (err) {
        console.error("🔥 Error retrieving token:", err);
      }
    };

    requestPermission();

    if (!listenerSet.current) {
      const unsubscribe = onMessage(messaging, (payload) => {
        // Full payload log
        console.log("📩 Foreground Notification Received:", payload);

        // Separate title & body
        console.log("🔔 Title:", payload?.notification?.title);
        console.log("📝 Body:", payload?.notification?.body);

        // Toast message
        toast.info(
          `${payload.notification?.title || "Notification"}: ${
            payload.notification?.body || ""
          }`,
          { position: "top-right", autoClose: 5000 }
        );

        console.log("✅ Foreground message handled inside Hook");
      });

      listenerSet.current = true;
      console.log("🔑 Current token (from state):", fcmToken);

      return () => {
        unsubscribe();
        listenerSet.current = false;
        console.log("🧹 Listener cleaned up");
      };
    }
  }, [fcmToken]); // add fcmToken as dependency so logs update

  return fcmToken;
};
