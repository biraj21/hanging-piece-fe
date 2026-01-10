import { Outlet } from "react-router";

import { Navbar } from "./Navbar";

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen w-full bg-neutral-800 text-white">
      <Navbar />
      <main className="md:ml-16 min-h-screen pb-12 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
};
