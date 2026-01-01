import { BarChart3Icon, HomeIcon, SwordsIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";

import { LogoImage } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/router/routes";

export const Sidebar = () => {
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);

  const navItems = [
    { path: ROUTES.DASHBOARD, icon: HomeIcon, label: "Dashboard" },
    { path: ROUTES.GAMES, icon: SwordsIcon, label: "Games" },
    { path: ROUTES.ANALYSIS, icon: BarChart3Icon, label: "Analyse PGN" },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-12 sm:w-16 bg-neutral-900 border-r border-neutral-700 flex flex-col items-center py-2 sm:py-4 z-50">
      {/* Logo at top */}
      <Link to={ROUTES.INDEX} className="mb-4 sm:mb-8">
        <img src={LogoImage} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-md" />
      </Link>

      {/* Navigation items */}
      <nav className="flex-1 flex flex-col gap-1 sm:gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group relative p-2 sm:p-3 rounded-lg transition-colors ${
                  isActive ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`
              }
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              {/* Tooltip */}
              <span className="absolute left-full top-1 ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* User avatar at bottom */}
      <Link
        to={ROUTES.PROFILE}
        className="group relative p-1.5 sm:p-2 rounded-lg transition-colors text-neutral-400 hover:text-white hover:bg-neutral-800"
      >
        {user?.image && !imageError && (
          <img
            src={user.image}
            alt={user.name || user.email || "Profile"}
            onError={() => setImageError(true)}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-neutral-600 object-cover"
          />
        )}
        {imageError && user?.email && (
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white text-xs sm:text-sm font-medium border border-neutral-600">
            {user.email.charAt(0).toUpperCase()}
          </div>
        )}
        {imageError && !user?.email && <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />}

        {/* Tooltip */}
        <span className="absolute left-full top-1 ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Profile
        </span>
      </Link>
    </div>
  );
};
