// components/search/SearchBar.tsx
import React from "react";
import logo from "../../public/Park_your_Vehicle_log.png?url";

interface SearchBarProps {
  onOpen?: () => void;
}

export function SearchBar({ onOpen }: SearchBarProps) {
  const handleClick = () => {
    if (onOpen) {
      onOpen();
      return;
    }
    // fallback behaviour — if you want, you could navigate("/") here.
    // but when used inside Front, onOpen will be provided.
  };

  return (
    <div
      onClick={handleClick}
      className="w-full justify-center h-10 pl-9 focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm cursor-pointer flex items-center gap-2 px-4 py-5 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-red-300 hover:border-red-200"
    >
      <img src={logo} alt="logo" className="h-8 w-8 animate-pop" />
      <span className="text-lg font-semibold text-gray-600">
        Find your perfect parking...
      </span>
    </div>
  );
}

export default SearchBar;
