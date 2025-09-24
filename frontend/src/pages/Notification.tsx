// OLD 
// import React, { useState } from "react";
// import api from "../utils/api";

// const Notification = () => {
//   const [title, setTitle] = useState("");
//   const [body, setBody] = useState("");
//   const [deviceToken, setDeviceToken] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [successMsg, setSuccessMsg] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");

//   const handleSendNotification = async () => {
//     if (!title || !body || !deviceToken) {
//       setErrorMsg("All fields are required.");
//       return;
//     }

//     setLoading(true);
//     setErrorMsg("");
//     setSuccessMsg("");

//     try {
//       const payload = {
//         title,
//         body,
//         deviceToken,
//       };

//       const res = await api.post("/admin/firebase", payload);

//       setSuccessMsg("Notification sent successfully!");
//       setTitle("");
//       setBody("");
//       setDeviceToken("");
//     } catch (err: any) {
//       console.error(err);
//       setErrorMsg(
//         err.response?.data?.message || "Failed to send notification."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
//       <h2 className="text-xl font-bold mb-4">Send Notification</h2>

//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700">Title</label>
//         <input
//           type="text"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           className="mt-1 block w-full border p-2 rounded-md"
//           placeholder="Enter notification title"
//         />
//       </div>

//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700">Body / Message</label>
//         <textarea
//           value={body}
//           onChange={(e) => setBody(e.target.value)}
//           className="mt-1 block w-full border p-2 rounded-md"
//           placeholder="Enter notification body"
//         />
//       </div>

//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700">
//           Device Token / Username
//         </label>
//         <input
//           type="text"
//           value={deviceToken}
//           onChange={(e) => setDeviceToken(e.target.value)}
//           className="mt-1 block w-full border p-2 rounded-md"
//           placeholder="Enter device token or username"
//         />
//         <p className="text-xs text-gray-500 mt-1">
//           If you have the device token, use it; otherwise, you can use the username.
//         </p>
//       </div>

//       {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
//       {successMsg && <p className="text-green-500 mb-2">{successMsg}</p>}

//       <button
//         onClick={handleSendNotification}
//         disabled={loading}
//         className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-all"
//       >
//         {loading ? "Sending..." : "Send Notification"}
//       </button>
//     </div>
//   );
// };

// export default Notification;

import React, { useState } from "react";
import api from "../utils/api";

const Notification = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("deviceToken"); // deviceToken, username, email, userId, allUsers
  const [targetValue, setTargetValue] = useState("");
  const [deviceInfo, setDeviceInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendNotification = async () => {
    if (!title || !body || (targetType !== "allUsers" && !targetValue)) {
      setErrorMsg("All fields are required (except for All Users).");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload: any = { title, body };
      if (targetType === "allUsers") {
        payload.allUsers = true;
      } else {
        payload[targetType] = targetValue; // dynamic key: deviceToken/username/email/userId
      }
      if (deviceInfo) payload.deviceInfo = deviceInfo;

      await api.post("/admin/firebase", payload);

      setSuccessMsg("Notification sent successfully!");
      setTitle("");
      setBody("");
      setTargetValue("");
      setDeviceInfo("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to send notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Send Notification</h2>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full border p-2 rounded-md"
          placeholder="Enter notification title"
        />
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Body / Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 block w-full border p-2 rounded-md"
          placeholder="Enter notification body"
        />
      </div>

      {/* Target type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Target Type</label>
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          className="mt-1 block w-full border p-2 rounded-md"
        >
          <option value="deviceToken">Device Token</option>
          <option value="username">Username</option>
          <option value="email">Email</option>
          <option value="userId">User ID</option>
          <option value="allUsers">All Users</option>
        </select>
      </div>

      {/* Target value (hidden if allUsers) */}
      {targetType !== "allUsers" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Target Value</label>
          <input
            type="text"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className="mt-1 block w-full border p-2 rounded-md"
            placeholder={`Enter ${targetType}`}
          />
        </div>
      )}

      {/* Optional Device Info filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Device Info (optional)</label>
        <input
          type="text"
          value={deviceInfo}
          onChange={(e) => setDeviceInfo(e.target.value)}
          className="mt-1 block w-full border p-2 rounded-md"
          placeholder="Filter by device info (e.g., Chrome, iPhone)"
        />
      </div>

      {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
      {successMsg && <p className="text-green-500 mb-2">{successMsg}</p>}

      <button
        onClick={handleSendNotification}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-all"
      >
        {loading ? "Sending..." : "Send Notification"}
      </button>
    </div>
  );
};

export default Notification;

