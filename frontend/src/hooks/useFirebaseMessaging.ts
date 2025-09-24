// // Hooks for req , token 
// import { useEffect, useRef, useState } from "react";
// import { messaging } from "../firebase";
// import { getToken, onMessage } from "firebase/messaging";
// import { toast } from "react-toastify";

// export const useFirebaseMessaging = () => {
//   const [fcmToken, setFcmToken] = useState<string | null>(null);
//   const listenerSet = useRef(false);

//   useEffect(() => {
//     const requestPermission = async () => {
//       console.log("useFirebaseMessaging hook initialized...");
//       try {
//         const permission = await Notification.requestPermission();
//         if (permission === "granted") {
//           const token = await getToken(messaging, {
//             vapidKey:
//               "BIrqu-G8cdBfGaxbvCwBTfPYuFxcOqCQBfbDqcN1zy_e_lpxej2ehbjjmrAwq1PcjqrOFnsqj_IcpN2ssSbp-jo",
//           });

//           if (token) {
//             console.log("✅ New FCM Token:", token);
//             setFcmToken(token);
//           } else {
//             console.warn("⚠️ No FCM token retrieved");
//           }
//         } else {
//           console.warn("❌ Notification permission not granted");
//         }
//       } catch (err) {
//         console.error("🔥 Error retrieving token:", err);
//       }
//     };

//     requestPermission();

//     if (!listenerSet.current) {
//       const unsubscribe = onMessage(messaging, (payload) => {
//         // Full payload log
//         console.log("📩 Foreground Notification Received:", payload);

//         // Separate title & body
//         console.log("🔔 Title:", payload?.notification?.title);
//         console.log("📝 Body:", payload?.notification?.body);

//         // Toast message
//         toast.info(
//           `${payload.notification?.title || "Notification"}: ${
//             payload.notification?.body || ""
//           }`,
//           { position: "top-right", autoClose: 5000 }
//         );

//         console.log("✅ Foreground message handled inside Hook");
//       });

//       listenerSet.current = true;
//       console.log("🔑 Current token (from state):", fcmToken);

//       return () => {
//         unsubscribe();
//         listenerSet.current = false;
//         console.log("🧹 Listener cleaned up");
//       };
//     }
//   }, [fcmToken]); // add fcmToken as dependency so logs update

//   return fcmToken;
// };
// ----------------------------------OLD BUT WORKING ---------------------
// import { useEffect, useRef, useState } from "react";
// import { messaging } from "../firebase";
// import { getToken, onMessage } from "firebase/messaging";
// import { toast } from "react-toastify";
// import api from "../utils/api";

// export const useFirebaseMessaging = (user: any) => {
//   const [fcmToken, setFcmToken] = useState<string | null>(null);
//   const listenerSet = useRef(false);

//   useEffect(() => {
//     if (!user) return;

//     const requestPermissionAndToken = async () => {
//       try {
//         const permission = await Notification.requestPermission();
//         if (permission !== "granted") return;

//         const token = await getToken(messaging, {
//           vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
//         });

//         if (!token) return;

//         setFcmToken(token);
//         console.log(" FCM Token retrieved:", token);
//         console.log("sending token to backend on /user/save-token now")

//         await api.post(
//           "/users/save-token",
//           { fcmToken: token, deviceInfo: navigator.userAgent },
//           { headers: { Authorization: `Bearer ${user.token}` } }
//         );
//         console.log("sended token to backend")
//       } catch (err) {
//         console.error(" Error retrieving FCM token:", err);
//       }
//     };

//     let unsubscribe: (() => void) | null = null;

//     if (!listenerSet.current) {
//       unsubscribe = onMessage(messaging, (payload) => {
//         console.log("📩 Foreground message:", payload);
//         toast.info(
//           `${payload.notification?.title || "Notification"}: ${
//             payload.notification?.body || ""
//           }`,
//           { position: "top-right", autoClose: 5000 }
//         );
//       });

//       listenerSet.current = true;
//     }

//     requestPermissionAndToken();

//     return () => {
//       if (unsubscribe) {
//         unsubscribe();
//         listenerSet.current = false;
//         console.log("🧹 FCM listener cleaned up");
//       }
//     };
//   }, [user]);

//   return fcmToken;
// };
   // this one  not included the efresh token feature

// ---------------------NEW CHECKING--------------------------

// hooks/useFirebaseMessaging.ts// hooks/useFirebaseMessaging.ts
// hooks/useFirebaseMessaging.ts


import { useEffect, useRef, useState } from "react";
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "react-toastify";
import api from "../utils/api";

export const useFirebaseMessaging = (user: any) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const listenerSet = useRef(false);

  useEffect(() => {
    

    let unsubscribe: (() => void) | null = null;

    const requestPermissionAndToken = async () => {
      try {
        console.log("🔔 Requesting notification permission...");
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          console.warn("❌ Notification permission denied");
          return;
        }

        console.log("🔑 Fetching FCM token...");
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
         console.log("token for you is",token)
        if (!token) {
          console.warn("⚠️ No FCM token retrieved");
          return;
        }

        // Store per-user tokens in localStorage
        const userTokensKey = `fcm_tokens_${user.id}`;
        const savedToken = localStorage.getItem(userTokensKey);

        if (token !== savedToken) {
          setFcmToken(token);
          localStorage.setItem(userTokensKey, token);

          console.log(`✅ New FCM Token for user ${user.id}:`, token);

          // Send token to backend (allow multiple per user)
          try {
            console.log("📡 Sending token to backend...");
            await api.post(
              "/users/save-token",
              { fcmToken: token, deviceInfo: navigator.userAgent },
              { headers: { Authorization: `Bearer ${user.token}` } }
            );
            console.log("✅ Token saved on backend for user:", user._id);
          } catch (apiErr) {
            console.error("🔥 Error saving token to backend:", apiErr);
          }
        } else {
          console.log(`ℹ️ Token already stored for user ${user._id}`);
          setFcmToken(savedToken);
        }
      } catch (err) {
        console.error("🔥 Error retrieving FCM token:", err);
      }
    };

    if (!listenerSet.current) {
      unsubscribe = onMessage(messaging, (payload) => {
        console.log("📩 Foreground message received:", payload);
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
        console.log("🧹 FCM listener cleaned up");
      }
    };
  }, [user]);

  return fcmToken;
};
