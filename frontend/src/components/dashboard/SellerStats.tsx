import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function SellerStats({ bookingsByDate = [] }: { bookingsByDate: Array<{ date: string, count: number }> }) {
  const data = useMemo(() => bookingsByDate, [bookingsByDate]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h4 className="font-semibold mb-2">Bookings (last 7 days)</h4>
      <div style={{ width: '100%', height: 180 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
