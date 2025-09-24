// olf --- for Single 
// import admin from "../utils/firebase.js";

// class NotificationService {
//     static async sendNotification (deviceToken, title,body) {
//         const message = {
//             notification : {
//                 title, body 
//             },
//             token : deviceToken
//         };
//         try{
//             const response = await admin.messaging().send(message);
//             return response;
//         }
//         catch(error){
//             throw error;
//         }
//     }
// }
// export default NotificationService ;


import admin from "../utils/firebase.js";

class NotificationService {
  /**
   * Send a notification to a single device
   */
  static async sendToDevice(token, title, body, data = {}) {
    const message = {
      notification: { title, body },
      data, // optional extra payload
      token,
    };
    return await admin.messaging().send(message);
  }

  /**
   * Send notification to multiple devices (multicast)
   */
  static async sendToMultiple(tokens, title, body, data = {}) {
    if (!tokens || tokens.length === 0) {
      return { successCount: 0, failureCount: 0, responses: [] };
    }

    const message = {
      notification: { title, body },
      data,
      tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    return response;
  }
}

export default NotificationService;

















// import admin from "firebase-admin";
// import serviceAccount from "../firebase-service-account.json" assert { type: "json" };

// // Initialize Firebase Admin (only once globally)
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// /**
//  * Send a push notification to a specific device
//  * @param {string} token - FCM device token
//  * @param {string} title - Notification title
//  * @param {string} body - Notification body
//  * @param {object} data - Extra data (optional)
//  * @returns {Promise<string>} - Message ID from Firebase
//  */
// export const sendNotification = async (token, title, body, data = {}) => {
//   try {
//     const message = {
//       notification: { title, body },
//       data, // extra payload (must be string key-value pairs)
//       token,
//     };

//     const response = await admin.messaging().send(message);
//     console.log("✅ Notification sent:", response);
//     return response;
//   } catch (error) {
//     console.error("❌ Error sending notification:", error);
//     throw error;
//   }
// };

// /**
//  * Send push notifications to multiple devices
//  * @param {string[]} tokens - Array of FCM tokens
//  * @param {string} title - Notification title
//  * @param {string} body - Notification body
//  * @param {object} data - Extra data (optional)
//  * @returns {Promise<object>} - Success & failure counts
//  */
// export const sendBulkNotification = async (tokens, title, body, data = {}) => {
//   try {
//     const message = {
//       notification: { title, body },
//       data,
//       tokens, // multiple tokens
//     };

//     const response = await admin.messaging().sendMulticast(message);
//     console.log(
//       `📢 Bulk notification sent: ${response.successCount} success, ${response.failureCount} failed`
//     );
//     return response;
//   } catch (error) {
//     console.error("❌ Error sending bulk notifications:", error);
//     throw error;
//   }
// };
