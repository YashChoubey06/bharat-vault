"use client";

import Link from "next/link";
import { useEffect } from "react";
import { User, ShieldCheck, Settings, LogOut, FileCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./UserProfileDropdown.module.css";

export default function UserProfileDropdown({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.dropdown} role="menu" aria-label="User account menu">
        <div className={styles.userHeader}>
          <div className={styles.avatar}>{user?.name?.charAt(0) || "O"}</div>
          <div className={styles.userMeta}>
            <span className={styles.name}>{user?.name || "Revenue Officer"}</span>
            <span className={styles.role}>{user?.role || "Authorized Officer"}</span>
            <span className={styles.email}>{user?.email || "officer@mh.gov.in"}</span>
          </div>
        </div>

        <div className={styles.menuList}>
          <Link href="/audit" className={styles.menuItem} onClick={onClose} role="menuitem">
            <FileCheck size={15} />
            My Audit Activity
          </Link>
          <Link href="/verification" className={styles.menuItem} onClick={onClose} role="menuitem">
            <ShieldCheck size={15} />
            Verification Workflows
          </Link>

          <div className={styles.divider} />

          <button
            className={`${styles.menuItem} ${styles.logout}`}
            onClick={() => {
              onClose();
              logout();
            }}
            role="menuitem"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
