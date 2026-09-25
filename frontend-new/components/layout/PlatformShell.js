"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./PlatformShell.module.css";

export default function PlatformShell({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isStudioPage = pathname === "/studio";

  return (
    <div className={styles.shell}>
      {!isStudioPage && (
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      {!isStudioPage && (
        <Topbar
          onMenuClick={() => setMobileMenuOpen(true)}
        />
      )}

      <main className={isStudioPage ? "w-full h-screen overflow-hidden p-0 m-0 bg-slate-100" : styles.main}>
        {children}
      </main>
    </div>
  );
}