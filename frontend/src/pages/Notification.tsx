// // // OLD 
// // // import React, { useState } from "react";
// // // import api from "../utils/api";

// // // const Notification = () => {
// // //   const [title, setTitle] = useState("");
// // //   const [body, setBody] = useState("");
// // //   const [deviceToken, setDeviceToken] = useState("");
// // //   const [loading, setLoading] = useState(false);
// // //   const [successMsg, setSuccessMsg] = useState("");
// // //   const [errorMsg, setErrorMsg] = useState("");

// // //   const handleSendNotification = async () => {
// // //     if (!title || !body || !deviceToken) {
// // //       setErrorMsg("All fields are required.");
// // //       return;
// // //     }

// // //     setLoading(true);
// // //     setErrorMsg("");
// // //     setSuccessMsg("");

// // //     try {
// // //       const payload = {
// // //         title,
// // //         body,
// // //         deviceToken,
// // //       };

// // //       const res = await api.post("/admin/firebase", payload);

// // //       setSuccessMsg("Notification sent successfully!");
// // //       setTitle("");
// // //       setBody("");
// // //       setDeviceToken("");
// // //     } catch (err: any) {
// // //       console.error(err);
// // //       setErrorMsg(
// // //         err.response?.data?.message || "Failed to send notification."
// // //       );
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   return (
// // //     <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
// // //       <h2 className="text-xl font-bold mb-4">Send Notification</h2>

// // //       <div className="mb-4">
// // //         <label className="block text-sm font-medium text-gray-700">Title</label>
// // //         <input
// // //           type="text"
// // //           value={title}
// // //           onChange={(e) => setTitle(e.target.value)}
// // //           className="mt-1 block w-full border p-2 rounded-md"
// // //           placeholder="Enter notification title"
// // //         />
// // //       </div>

// // //       <div className="mb-4">
// // //         <label className="block text-sm font-medium text-gray-700">Body / Message</label>
// // //         <textarea
// // //           value={body}
// // //           onChange={(e) => setBody(e.target.value)}
// // //           className="mt-1 block w-full border p-2 rounded-md"
// // //           placeholder="Enter notification body"
// // //         />
// // //       </div>

// // //       <div className="mb-4">
// // //         <label className="block text-sm font-medium text-gray-700">
// // //           Device Token / Username
// // //         </label>
// // //         <input
// // //           type="text"
// // //           value={deviceToken}
// // //           onChange={(e) => setDeviceToken(e.target.value)}
// // //           className="mt-1 block w-full border p-2 rounded-md"
// // //           placeholder="Enter device token or username"
// // //         />
// // //         <p className="text-xs text-gray-500 mt-1">
// // //           If you have the device token, use it; otherwise, you can use the username.
// // //         </p>
// // //       </div>

// // //       {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
// // //       {successMsg && <p className="text-green-500 mb-2">{successMsg}</p>}

// // //       <button
// // //         onClick={handleSendNotification}
// // //         disabled={loading}
// // //         className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-all"
// // //       >
// // //         {loading ? "Sending..." : "Send Notification"}
// // //       </button>
// // //     </div>
// // //   );
// // // };

// // // export default Notification;

// // import React, { useState } from "react";
// // import api from "../utils/api";

// // const Notification = () => {
// //   const [title, setTitle] = useState("");
// //   const [body, setBody] = useState("");
// //   const [targetType, setTargetType] = useState("deviceToken"); // deviceToken, username, email, userId, allUsers
// //   const [targetValue, setTargetValue] = useState("");
// //   const [deviceInfo, setDeviceInfo] = useState("");
// //   const [loading, setLoading] = useState(false);
// //   const [successMsg, setSuccessMsg] = useState("");
// //   const [errorMsg, setErrorMsg] = useState("");

// //   const handleSendNotification = async () => {
// //     if (!title || !body || (targetType !== "allUsers" && !targetValue)) {
// //       setErrorMsg("All fields are required (except for All Users).");
// //       return;
// //     }

// //     setLoading(true);
// //     setErrorMsg("");
// //     setSuccessMsg("");

// //     try {
// //       const payload: any = { title, body };
// //       if (targetType === "allUsers") {
// //         payload.allUsers = true;
// //       } else {
// //         payload[targetType] = targetValue; // dynamic key: deviceToken/username/email/userId
// //       }
// //       if (deviceInfo) payload.deviceInfo = deviceInfo;

// //       await api.post("/admin/firebase", payload);

// //       setSuccessMsg("Notification sent successfully!");
// //       setTitle("");
// //       setBody("");
// //       setTargetValue("");
// //       setDeviceInfo("");
// //     } catch (err: any) {
// //       console.error(err);
// //       setErrorMsg(err.response?.data?.message || "Failed to send notification.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
// //       <h2 className="text-xl font-bold mb-4">Send Notification</h2>

// //       {/* Title */}
// //       <div className="mb-4">
// //         <label className="block text-sm font-medium text-gray-700">Title</label>
// //         <input
// //           type="text"
// //           value={title}
// //           onChange={(e) => setTitle(e.target.value)}
// //           className="mt-1 block w-full border p-2 rounded-md"
// //           placeholder="Enter notification title"
// //         />
// //       </div>

// //       {/* Body */}
// //       <div className="mb-4">
// //         <label className="block text-sm font-medium text-gray-700">Body / Message</label>
// //         <textarea
// //           value={body}
// //           onChange={(e) => setBody(e.target.value)}
// //           className="mt-1 block w-full border p-2 rounded-md"
// //           placeholder="Enter notification body"
// //         />
// //       </div>

// //       {/* Target type */}
// //       <div className="mb-4">
// //         <label className="block text-sm font-medium text-gray-700">Target Type</label>
// //         <select
// //           value={targetType}
// //           onChange={(e) => setTargetType(e.target.value)}
// //           className="mt-1 block w-full border p-2 rounded-md"
// //         >
// //           <option value="deviceToken">Device Token</option>
// //           <option value="username">Username</option>
// //           <option value="email">Email</option>
// //           <option value="userId">User ID</option>
// //           <option value="allUsers">All Users</option>
// //         </select>
// //       </div>

// //       {/* Target value (hidden if allUsers) */}
// //       {targetType !== "allUsers" && (
// //         <div className="mb-4">
// //           <label className="block text-sm font-medium text-gray-700">Target Value</label>
// //           <input
// //             type="text"
// //             value={targetValue}
// //             onChange={(e) => setTargetValue(e.target.value)}
// //             className="mt-1 block w-full border p-2 rounded-md"
// //             placeholder={`Enter ${targetType}`}
// //           />
// //         </div>
// //       )}

// //       {/* Optional Device Info filter */}
// //       <div className="mb-4">
// //         <label className="block text-sm font-medium text-gray-700">Device Info (optional)</label>
// //         <input
// //           type="text"
// //           value={deviceInfo}
// //           onChange={(e) => setDeviceInfo(e.target.value)}
// //           className="mt-1 block w-full border p-2 rounded-md"
// //           placeholder="Filter by device info (e.g., Chrome, iPhone)"
// //         />
// //       </div>

// //       {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
// //       {successMsg && <p className="text-green-500 mb-2">{successMsg}</p>}

// //       <button
// //         onClick={handleSendNotification}
// //         disabled={loading}
// //         className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-all"
// //       >
// //         {loading ? "Sending..." : "Send Notification"}
// //       </button>
// //     </div>
// //   );
// // };

// // export default Notification;
// import React, { useState, useEffect } from "react";
// import api from "../utils/api";

// interface User {
//   _id: string;
//   fullname?: {
//     firstname?: string;
//     lastname?: string;
//   };
//   email?: string;
//   username?: string;
// }

// const Notification: React.FC = () => {
//   const [title, setTitle] = useState<string>("");
//   const [body, setBody] = useState<string>("");
//   const [users, setUsers] = useState<User[]>([]);
//   const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
//   const [allSelected, setAllSelected] = useState<boolean>(false);

//   const [loading, setLoading] = useState<boolean>(false);
//   const [successMsg, setSuccessMsg] = useState<string>("");
//   const [errorMsg, setErrorMsg] = useState<string>("");

//   // Fetch all users for admin
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const res = await api.get<{ users: User[] }>("/admin/users"); 
//         setUsers(res.data.users);
//       } catch (err) {
//         console.error(err);
//         setErrorMsg("Failed to load users.");
//       }
//     };
//     fetchUsers();
//   }, []);

//   const toggleUserSelection = (userId: string) => {
//     if (selectedUsers.includes(userId)) {
//       setSelectedUsers(selectedUsers.filter((id) => id !== userId));
//     } else {
//       setSelectedUsers([...selectedUsers, userId]);
//     }
//   };

//   const handleSelectAll = () => {
//     if (allSelected) {
//       setSelectedUsers([]);
//     } else {
//       setSelectedUsers(users.map((user) => user._id));
//     }
//     setAllSelected(!allSelected);
//   };

//   const handleSendNotification = async () => {
//     if (!title || !body || (!allSelected && selectedUsers.length === 0)) {
//       setErrorMsg("Title, body, and target users are required.");
//       return;
//     }

//     setLoading(true);
//     setErrorMsg("");
//     setSuccessMsg("");

//     try {
//       const payload: Record<string, any> = {
//         title,
//         body,
//       };

//       if (allSelected) {
//         payload.allUsers = true;
//       } else {
//         payload.userIds = selectedUsers;
//       }

//       await api.post("/admin/firebase", payload);

//       setSuccessMsg("Notification sent successfully!");
//       setTitle("");
//       setBody("");
//       setSelectedUsers([]);
//       setAllSelected(false);
//     } catch (err: any) {
//       console.error(err);
//       setErrorMsg(err.response?.data?.message || "Failed to send notification.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
//       <h2 className="text-xl font-bold mb-4">Send Notification</h2>

//       {/* Title */}
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

//       {/* Body */}
//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700">Body / Message</label>
//         <textarea
//           value={body}
//           onChange={(e) => setBody(e.target.value)}
//           className="mt-1 block w-full border p-2 rounded-md"
//           placeholder="Enter notification body"
//         />
//       </div>

//       {/* User selection */}
//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700">
//           Select Users
//         </label>

//         <div className="flex items-center mb-2">
//           <input
//             type="checkbox"
//             checked={allSelected}
//             onChange={handleSelectAll}
//             className="mr-2"
//           />
//           <span>Select All Users</span>
//         </div>

//         <div className="max-h-60 overflow-y-auto border p-2 rounded">
//           {users.map((user) => (
//             <div key={user._id} className="flex items-center">
//               <input
//                 type="checkbox"
//                 checked={selectedUsers.includes(user._id)}
//                 onChange={() => toggleUserSelection(user._id)}
//                 className="mr-2"
//               />
//               <span>
//                 {user.fullname?.firstname} {user.fullname?.lastname} — {user.email}
//               </span>
//             </div>
//           ))}
//         </div>
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
import React, { useState, useEffect } from "react";
import api from "../utils/api";

interface User {
  _id: string;
  fullname: { firstname: string; lastname: string };
  email: string;
  name?: string; // your DB uses "name" instead of "username"
}

const Notification: React.FC = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("deviceToken"); // deviceToken, username, email, userId, fullName, selectedUsers, allUsers
  const [targetValue, setTargetValue] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch all users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get<{ users: User[] }>("/admin/users");
        setUsers(res.data.users);
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load users.");
      }
    };
    fetchUsers();
  }, []);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendNotification = async () => {
    if (!title || !body) {
      setErrorMsg("Title and body are required.");
      return;
    }

    if (
      targetType !== "allUsers" &&
      targetType !== "selectedUsers" &&
      !targetValue
    ) {
      setErrorMsg("Please enter a target value.");
      return;
    }

    if (targetType === "selectedUsers" && selectedUsers.length === 0) {
      setErrorMsg("Please select at least one user.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload: Record<string, any> = { title, body };

      if (targetType === "allUsers") {
        payload.allUsers = true;
      } else if (targetType === "selectedUsers") {
        payload.userIds = selectedUsers;
      } else {
        payload[targetType] = targetValue;
      }

      await api.post("/admin/firebase", payload);

      setSuccessMsg("Notification sent successfully!");
      setTitle("");
      setBody("");
      setTargetValue("");
      setSelectedUsers([]);
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
        <label className="block text-sm font-medium text-gray-700">
          Title
        </label>
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
        <label className="block text-sm font-medium text-gray-700">
          Body / Message
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 block w-full border p-2 rounded-md"
          placeholder="Enter notification body"
        />
      </div>

      {/* Target Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Target Type
        </label>
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          className="mt-1 block w-full border p-2 rounded-md"
        >
          <option value="deviceToken">Device Token</option>
          <option value="username">Username</option>
          <option value="email">Email</option>
          <option value="userId">User ID</option>
          <option value="fullName">Full Name</option>
          <option value="selectedUsers">Select Users</option>
          <option value="allUsers">All Users</option>
        </select>
      </div>

      {/* Target Value Input */}
      {targetType !== "allUsers" && targetType !== "selectedUsers" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Target Value
          </label>
          <input
            type="text"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className="mt-1 block w-full border p-2 rounded-md"
            placeholder={`Enter ${targetType}`}
          />
        </div>
      )}

      {/* User Selection */}
      {targetType === "selectedUsers" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Select Users
          </label>
          <div className="border p-2 rounded-md max-h-48 overflow-y-auto">
            {users.map((user) => (
              <div key={user._id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => toggleUserSelection(user._id)}
                  className="mr-2"
                />
                <span>
                  {user.fullname?.firstname} {user.fullname?.lastname} (
                  {user.email})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
