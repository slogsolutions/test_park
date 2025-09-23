import React from 'react';
import { 
  Home, 
  Calendar, 
  Bell, 
  Wallet, 
  User, 
  Settings, 
  LogOut,
  LayoutDashboard,
  CalendarDays,
  BellRing,
  WalletCards,
  UserCircle,
  Settings2,
  PowerOff,
  Sun,
  Moon,
  LucideParkingMeter
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onlineStatus: boolean;
  onToggleOnline: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  className?: string;
}

export function Sidebar({
  currentPage,
  onNavigate,
  onlineStatus,
  onToggleOnline,
  darkMode,
  onToggleDarkMode,
  onLogout,
  className = '',
}: SidebarProps) {
  const menuItems = [
    { icon: CalendarDays, label: 'Calendar', id: 'availability' },
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: BellRing, label: 'Bookings', id: 'bookings' },
    // { icon: WalletCards, label: 'Wallet', id: 'wallet' },
    { icon: LucideParkingMeter, label: 'Spaces', id: 'ProviderDash' },
    // { icon: UserCircle, label: 'BookedSlots', id: 'BookedSlots' },
    { icon: UserCircle, label: 'profile', id: 'Profile' },
  ];

  // accessible keyboard handler for toggles (Enter / Space)
  const handleKeyToggle = (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler();
    }
  };

  return (
    <div className={`h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <PowerOff className="h-6 w-6 text-primary-500 mr-2" />
          Provider Dashboard
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {menuItems.map(({ icon: Icon, label, id }) => (
            <li key={id}>
              <button
                onClick={() => onNavigate(id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  currentPage === id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-white dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className={`h-5 w-5 ${
                  currentPage === id ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                }`} />
                <span className="font-medium">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Online Status</span>
          <div
            role="switch"
            aria-checked={onlineStatus}
            tabIndex={0}
            onKeyDown={handleKeyToggle(onToggleOnline)}
            title={onlineStatus ? 'Set offline' : 'Set online'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${
              onlineStatus ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onClick={onToggleOnline}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                onlineStatus ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Theme</span>

          {/* Theme toggle — accessible and keyboard-operable */}
          <div
            role="switch"
            aria-checked={darkMode}
            tabIndex={0}
            onKeyDown={handleKeyToggle(onToggleDarkMode)}
            title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${
              darkMode ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onClick={onToggleDarkMode}
          >
            {/* Icons positioned so they don't overlap the moving knob */}
            {/* Moon on left for dark mode, Sun on right for light mode */}
            <div className="pointer-events-none absolute left-1.5">
              {darkMode ? <Moon className="h-4 w-4 text-white" /> : null}
            </div>
            <div className="pointer-events-none absolute right-1.5">
              {!darkMode ? <Sun className="h-4 w-4 text-primary-500" /> : null}
            </div>

            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
