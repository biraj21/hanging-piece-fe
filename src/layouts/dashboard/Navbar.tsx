import { BarChart3Icon, HomeIcon, MailIcon, SwordsIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";

import { LogoImage } from "@/components/Logo";
import { DiscordIcon } from "@/components/icons/DiscordIcon";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/router/routes";

interface ProfileLinkProps {
  variant: "desktop" | "mobile";
  imageError: boolean;
  setImageError: (error: boolean) => void;
}

const ProfileLink = ({ variant, imageError, setImageError }: ProfileLinkProps) => {
  const { user } = useAuth();
  const isDesktop = variant === "desktop";
  const avatarSize = isDesktop ? "w-8 h-8" : "w-5 h-5";
  const iconSize = isDesktop ? "w-5 h-5" : "w-5 h-5";
  const textSize = isDesktop ? "text-sm" : "text-xs";

  const avatarContent = (
    <>
      {user?.image && !imageError && (
        <img
          src={user.image}
          alt={user.name || user.email || "Profile"}
          onError={() => setImageError(true)}
          className={`${avatarSize} rounded-full border border-neutral-600 object-cover`}
        />
      )}
      {imageError && user?.email && (
        <div
          className={`${avatarSize} rounded-full bg-neutral-700 flex items-center justify-center text-white ${textSize} font-medium border border-neutral-600`}
        >
          {user.email.charAt(0).toUpperCase()}
        </div>
      )}
      {imageError && !user?.email && <UserIcon className={iconSize} />}
    </>
  );

  const tooltip = (
    <span
      className={`absolute ${
        isDesktop ? "left-full top-1 ml-2" : "bottom-full mb-2 left-1/2 -translate-x-1/2"
      } px-2 py-1 bg-neutral-800 shadow-lg text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap`}
    >
      Profile
    </span>
  );

  if (isDesktop) {
    return (
      <Link
        to={ROUTES.PROFILE}
        className="group relative p-2 rounded-lg transition-colors text-neutral-400 hover:text-white hover:bg-neutral-800"
      >
        {avatarContent}
        {tooltip}
      </Link>
    );
  }

  return (
    <NavLink
      to={ROUTES.PROFILE}
      className={({ isActive }) =>
        `group relative flex items-center justify-center p-2 rounded-lg transition-colors flex-1 ${
          isActive ? "text-white" : "text-neutral-400"
        }`
      }
    >
      {avatarContent}
      {tooltip}
    </NavLink>
  );
};

export const Navbar = () => {
  const [imageError, setImageError] = useState(false);

  const navItems = [
    { path: ROUTES.DASHBOARD, icon: HomeIcon, label: "Dashboard" },
    { path: ROUTES.GAMES, icon: SwordsIcon, label: "Games" },
    { path: ROUTES.ANALYSIS, icon: BarChart3Icon, label: "Analyse PGN" },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-16 bg-neutral-900 border-r border-neutral-700 flex-col items-center py-4 z-50">
        {/* Logo at top */}
        <Link to={ROUTES.INDEX} className="mb-8">
          <img src={LogoImage} alt="Logo" className="w-10 h-10 rounded-md" />
        </Link>

        {/* Navigation items */}
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group relative p-3 rounded-lg transition-colors ${
                    isActive ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip */}
                <span className="absolute left-full top-1 ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Contact links */}
        <div className="flex flex-col gap-2 mb-2">
          <a
            href="https://discord.gg/DeC8paJ2"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative p-3 rounded-lg transition-colors text-neutral-400 hover:text-[#5865F2] hover:bg-neutral-800"
            title="Join Discord"
          >
            <DiscordIcon className="w-5 h-5" />
            <span className="absolute left-full top-1 ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Discord
            </span>
          </a>
          <a
            href="mailto:biraj@hangingpiece.com"
            className="group relative p-3 rounded-lg transition-colors text-neutral-400 hover:text-white hover:bg-neutral-800"
            title="Email"
          >
            <MailIcon className="w-5 h-5" />
            <span className="absolute left-full top-1 ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Email
            </span>
          </a>
        </div>

        {/* User avatar at bottom */}
        <ProfileLink variant="desktop" imageError={imageError} setImageError={setImageError} />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-12 bg-neutral-900 border-t border-neutral-700 flex items-center justify-around px-1 z-50 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center justify-center p-2 rounded-lg transition-colors flex-1 ${
                  isActive ? "text-white" : "text-neutral-400"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {/* Tooltip above icon */}
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </NavLink>
          );
        })}

        {/* Contact buttons in mobile nav */}
        <a
          href="https://discord.gg/DeC8paJ2"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center p-2 rounded-lg transition-colors flex-1 text-neutral-400 hover:text-[#5865F2]"
          title="Discord"
        >
          <DiscordIcon className="w-5 h-5" />
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Discord
          </span>
        </a>
        <a
          href="mailto:biraj@hangingpiece.com"
          className="group relative flex items-center justify-center p-2 rounded-lg transition-colors flex-1 text-neutral-400 hover:text-white"
          title="Email"
        >
          <MailIcon className="w-5 h-5" />
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Email
          </span>
        </a>

        {/* Profile button in mobile nav */}
        <ProfileLink variant="mobile" imageError={imageError} setImageError={setImageError} />
      </div>
    </>
  );
};
