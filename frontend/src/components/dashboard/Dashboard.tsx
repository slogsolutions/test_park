import React from 'react';
import { 
  UserCheck,
  BarChart2,
  HandCoins
} from 'lucide-react';
import { Booking, Provider } from '../../types';

interface DashboardProps {
  provider: Provider;
  bookings: Booking[];
}

export function Dashboard({ provider, bookings }: DashboardProps) {
  const totalBookings = bookings.length;
  const totalEarnings = `₹${provider?.walletBalance ? provider.walletBalance.toFixed(2) : "0.00"}`;
   console.log("provider us ",bookings);

  const firstAvailableSlot = provider?.availability?.[0]?.slots?.[0];
  const slotInfo = firstAvailableSlot
    ? `${new Date(firstAvailableSlot.startTime).toLocaleTimeString()} - ${new Date(firstAvailableSlot.endTime).toLocaleTimeString()}`
    : "No slots available";

  const stats = [
    {
      title: 'Total Bookings',
      value: totalBookings,
      icon: UserCheck,
      change: '+12.5%',
      color: 'bg-primary-500',
    },
    {
      title: 'Total Earnings',
      value: totalEarnings,
      icon: HandCoins,
      change: '+18.7%',
      color: 'bg-primary-500',
    },
    {
      title: 'Next Available Slot',
      value: slotInfo,
      icon: BarChart2,
      change: '+2.3%',
      color: 'bg-primary-500',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {provider.name}!</h1>
        <p className="text-gray-600 dark:text-gray-400">Here's what's happening with your business today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm text-white dark:text-primary-400 font-medium">{stat.change}</span>
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
