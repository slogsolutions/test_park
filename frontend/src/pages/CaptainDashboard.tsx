// frontend/src/pages/CaptainDashboard.tsx
import React, { useEffect, useState } from 'react';
import api from '../utils/api'; // adapt the path to your api helper

export default function CaptainDashboard() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const res = await api.get('/captain/parkingspaces?status=pending');
      setSpaces(res.data.spaces || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSpaces(); }, []);

  const updateStatus = async (id:string, status:string) => {
    try {
      await api.patch(`/captain/parkingspaces/${id}/status`, { status });
      // optimistic refresh
      setSpaces(prev => prev.filter((s:any) => s._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Captain Portal — Parking Spaces</h1>
      {spaces.length === 0 ? (
        <div className="p-6 bg-white rounded shadow">No pending parking spaces.</div>
      ) : (
        <div className="space-y-4">
          {spaces.map((space:any) => (
            <div key={space._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <div className="font-semibold">{space.title}</div>
                <div className="text-sm text-gray-500">{space.address?.city || 'No city'}</div>
                <div className="text-sm">{space.description}</div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => updateStatus(space._id, 'approved')} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                <button onClick={() => updateStatus(space._id, 'rejected')} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
                <button onClick={() => updateStatus(space._id, 'active')} className="px-3 py-1 border rounded">Activate</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
