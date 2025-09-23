import React, { useState } from "react";
import api from "../utils/api";

const Notification = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendNotification = async () => {
    if (!title || !body || !deviceToken) {
      setErrorMsg("All fields are required.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        title,
        body,
        deviceToken,
      };

      const res = await api.post("/admin/firebase", payload);

      setSuccessMsg("Notification sent successfully!");
      setTitle("");
      setBody("");
      setDeviceToken("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message || "Failed to send notification."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Send Notification</h2>

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

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Body / Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 block w-full border p-2 rounded-md"
          placeholder="Enter notification body"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Device Token / Username
        </label>
        <input
          type="text"
          value={deviceToken}
          onChange={(e) => setDeviceToken(e.target.value)}
          className="mt-1 block w-full border p-2 rounded-md"
          placeholder="Enter device token or username"
        />
        <p className="text-xs text-gray-500 mt-1">
          If you have the device token, use it; otherwise, you can use the username.
        </p>
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
