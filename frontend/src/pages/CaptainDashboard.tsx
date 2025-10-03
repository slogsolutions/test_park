// frontend/src/pages/CaptainDashboard.tsx (or wherever you render captain list)
import React, { useEffect, useState } from "react";
import api from "../utils/api"; // your axios instance (baseURL already has /api)

export default function CaptainDashboard() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const res = await api.get("/captain/parkingspaces?status=pending"); // returns pending spaces for captain
      setSpaces(res.data.spaces || res.data || []);
    } catch (err) {
      console.error("Error fetching captain spaces:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const updateStatus = async (spaceId: string, status: "approved" | "rejected") => {
    try {
      // PATCH to /api/captain/parkingspaces/:id/status
      await api.patch(`/captain/parkingspaces/${spaceId}/status`, { status });
      // refresh list
      await fetchSpaces();
      // optionally show toast success
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-4">
      {loading && <div>Loading...</div>}
      {!loading && spaces.length === 0 && <div>No pending spaces</div>}
      {spaces.map((space) => (
        <div key={space._id} className="p-4 bg-white rounded shadow flex justify-between items-center">
          <div>
            <div className="font-bold">{space.title}</div>
            <div className="text-sm text-gray-500">{space.address?.city}</div>
            <div className="text-sm">{space.description}</div>
          </div>
          <div className="space-x-2">
            <button
              className="bg-green-500 text-white px-4 py-1 rounded"
              onClick={() => updateStatus(space._id, "approved")}
            >
              Approve
            </button>
            <button
              className="bg-red-500 text-white px-4 py-1 rounded"
              onClick={() => updateStatus(space._id, "rejected")}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
