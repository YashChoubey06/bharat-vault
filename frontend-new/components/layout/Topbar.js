"use client";

import { useEffect, useState } from "react";
import { Menu, Bell, Search, ChevronDown, Server } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CommandPalette from "@/components/ui/CommandPalette";
import NotificationsDrawer from "@/components/layout/NotificationsDrawer";
import UserProfileDropdown from "@/components/layout/UserProfileDropdown";
import SystemHealthDropdown from "@/components/layout/SystemHealthDropdown";
import styles from "./Topbar.module.css";

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);

  useEffect(() => {
    const openSearch = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setCommandPaletteOpen(open => !open);
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.left}>
          <button
            className={styles.menuButton}
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          <button
            className={styles.search}
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Open Global Search Command Palette (Ctrl+K)"
          >
            <Search size={16} />
            <span style={{ border: 0, padding: 0, background: "transparent", flex: 1, textAlign: "left" }}>
              Search parcel, survey or owner...
            </span>
            <span>⌘ K</span>
          </button>
        </div>

        <div className={styles.right}>
          <div style={{ position: "relative" }}>
            <button
              className={styles.environment}
              onClick={() => {
                setHealthOpen(!healthOpen);
                setNotificationsOpen(false);
                setUserDropdownOpen(false);
              }}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", border: "none" }}
            >
              <Server size={14} />
              SYSTEM STATUS
            </button>
            <SystemHealthDropdown isOpen={healthOpen} onClose={() => setHealthOpen(false)} />
          </div>

          <button
            className={styles.iconButton}
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserDropdownOpen(false);
              setHealthOpen(false);
            }}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell size={17} />
            <span className={styles.notificationDot} />
          </button>

          <div style={{ position: "relative" }}>
            <button
              className={styles.user}
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setNotificationsOpen(false);
                setHealthOpen(false);
              }}
              style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0 }}
              aria-label="User account menu"
              aria-expanded={userDropdownOpen}
            >
              <div className={styles.avatar}>
                {user?.name?.charAt(0) || "U"}
              </div>

              <div className={styles.userText}>
                <strong style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {user?.name || "Officer"}
                  <ChevronDown size={14} style={{ opacity: 0.6 }} />
                </strong>
                <span>{user?.role || "Authorized User"}</span>
              </div>
            </button>

            <UserProfileDropdown
              isOpen={userDropdownOpen}
              onClose={() => setUserDropdownOpen(false)}
            />
          </div>
        </div>

        <NotificationsDrawer
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
      </header>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}
