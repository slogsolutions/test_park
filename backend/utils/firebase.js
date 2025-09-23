// import admin from"firebase-admin";

// import serviceAccount from "../utils/firebaseAdminSDK.json";

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// -----------------------------------------

// import admin from "firebase-admin";
// import serviceAccount from "../utils/firebaseAdminSDK.json" assert { type: "json" };

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// ---------------
import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("./firebaseAdminSDK.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
