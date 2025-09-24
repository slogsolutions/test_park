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
// import  {admin , firebaseApp } from "./../utils/firebase.js"; // named importimport { getMessaging } from "firebase-admin/messaging";
import { firebaseApp } from "../utils/firebase.js";
import { getMessaging } from "firebase-admin/messaging";

const messaging = getMessaging(firebaseApp);

class NotificationService {
  static async sendToDevice(token, title, body, data = {}) {
    const message = {
      notification: { title, body },
      data,
      token,
    };
    return await messaging.send(message);
  }

  static async sendToMultiple(tokens, title, body, data = {}) {
    if (!tokens || tokens.length === 0) {
      return { successCount: 0, failureCount: 0, responses: [] };
    }

    const message = {
      notification: { title, body },
      data,
      tokens,
    };

    return await messaging.sendEachForMulticast(message);
  }
}

export default NotificationService;