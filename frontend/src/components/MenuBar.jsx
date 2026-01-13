import { useState } from "react";
import { FaShareSquare, FaMailBulk, FaUser, FaWindowClose, FaBars } from "react-icons/fa";

export default function MenuBar({ onShare, onContact, onLogin, isLoggedIn, email, name }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🔐 Google Login Redirect
  const handleLoginClick = () => {
    window.location.href = "http://127.0.0.1:8000/auth/google/login";
  };

  // Logout
  const handleLogout = () => {
    onLogin(null); // Call parent to clear login state
    setDropdownOpen(false);
  };

  return (
    <header className="w-full h-14 bg-linear-to-r from-purple-800 to-black text-white flex items-center px-4 shadow-md relative">
      
      {/* LEFT */}
      <div className="flex-1" />

      {/* CENTER */}
      <div className="flex-1 text-center font-bold text-lg tracking-wide">
        ChatbotAI
      </div>

      {/* RIGHT - Desktop */}
      <div className="hidden md:flex flex-1 justify-end items-center gap-4 relative">

        {/* SHARE */}
        <button
          onClick={onShare}
          className="hover:text-purple-200 transition"
          title="Share"
        >
          <FaShareSquare size={18} />
        </button>

        {/* CONTACT */}
        <button
          onClick={onContact}
          className="hover:text-purple-200 transition"
          title="Contact"
        >
          <FaMailBulk size={18} />
        </button>

        {/* LOGIN / ACCOUNT */}
        {!isLoggedIn ? (
          <button
            onClick={handleLoginClick}
            className="flex items-center gap-2 bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-indigo-100 transition"
          >
            <FaUser size={18} />
            <span>Login</span>
          </button>
        ) : (
          <div className="relative">
            {/* User info button */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-indigo-100 transition"
            >
              <FaUser size={18} />
              <span className="max-w-[140px] truncate">{name || email}</span>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-md z-50">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <FaWindowClose size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden flex-1 flex justify-end">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white hover:text-purple-200 transition"
        >
          <FaBars size={20} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 w-full bg-linear-to-r from-purple-800 to-black text-white shadow-md md:hidden z-50">
          <div className="flex flex-col px-4 py-4 gap-4">
            {/* SHARE */}
            <button
              onClick={() => { onShare(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 hover:text-purple-200 transition"
            >
              <FaShareSquare size={18} />
              <span>Share</span>
            </button>

            {/* CONTACT */}
            <button
              onClick={() => { onContact(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 hover:text-purple-200 transition"
            >
              <FaMailBulk size={18} />
              <span>Contact</span>
            </button>

            {/* LOGIN / ACCOUNT */}
            {!isLoggedIn ? (
              <button
                onClick={() => { handleLoginClick(); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-indigo-100 transition w-fit"
              >
                <FaUserCircle size={18} />
                <span>Login</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FaUser size={18} />
                  <span className="truncate">{name || email}</span>
                </div>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 text-red-300 hover:text-red-100 transition"
                >
                  <FaWindowClose size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
