"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Files,
  Map,
  ClipboardCheck,
  BarChart3,
  History,
  ShieldCheck,
  X,
  Box,
  LogOut,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import styles from "./Sidebar.module.css";

const navigation = [
  {
    section: "WORKSPACE",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "3D Cadastral Studio",
        href: "/studio",
        icon: Sparkles,
        badge: "3D",
      },
      {
        label: "Land Records",
        href: "/records",
        icon: FileText,
      },
      {
        label: "Scan & OCR Ingest",
        href: "/documents",
        icon: Files,
      },
      {
        label: "GIS Parcels",
        href: "/parcels",
        icon: Map,
      },
      {
        label: "Verification Queue",
        href: "/verification",
        icon: ClipboardCheck,
        badge: "3",
      },
    ],
  },
  {
    section: "INTELLIGENCE & AUDIT",
    items: [
      {
        label: "Reports & Analytics",
        href: "/reports",
        icon: BarChart3,
      },
      {
        label: "Audit Trail",
        href: "/audit",
        icon: History,
      },
    ],
  },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileOpen) {
        onClose();
      }
    };
    if (mobileOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onClose]);

  return (
    <>
      {mobileOpen && (
        <button
          className={styles.overlay}
          onClick={onClose}
          aria-label="Close navigation overlay"
        />
      )}

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ""}`}>
        <div className={styles.header}>
          <Link href="/dashboard" className={styles.brand} onClick={onClose}>
            <div className={styles.brandIcon}>
              <ShieldCheck size={20} />
            </div>

            <div>
              <strong>Bharat Vault</strong>
              <span>Land Record Intelligence</span>
            </div>
          </Link>

          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.navigation}>
          {navigation.map((group) => (
            <div className={styles.navGroup} key={group.section}>
              <span className={styles.groupTitle}>{group.section}</span>

              <div className={styles.navItems}>
                {group.items.map((item) => {
                  const Icon = item.icon;

                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(`${item.href}`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`${styles.navItem} ${active ? styles.active : ""}`}
                    >
                      <Icon size={17} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge && (
                        <span className={styles.badge}>{item.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {user?.name?.charAt(0) || "U"}
            </div>

            <div className={styles.userInfo}>
              <strong>{user?.name || "Revenue Officer"}</strong>
              <span>{user?.role || "Authorized Officer"}</span>
            </div>

            <button
              type="button"
              className={styles.logoutButton}
              aria-label="Sign out"
              title="Sign out"
              onClick={async () => {
                try {
                  await logout();
                } catch (err) {
                  setLogoutError(err.message);
                }
              }}
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className={styles.version}>
            Bharat Vault v1.0 • Government Enterprise Edition
          </div>
          {logoutError && <p role="alert" style={{ color: "var(--badge-rose-text)", fontSize: 10, margin: "4px 0 0" }}>{logoutError}</p>}
        </div>
      </aside>
    </>
  );
}
