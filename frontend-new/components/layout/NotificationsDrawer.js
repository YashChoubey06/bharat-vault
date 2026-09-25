"use client";

import { useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle2, FileText, MapPin, Bell } from "lucide-react";
import { getAuditLogs } from "@/services/api/audit";
import styles from "./NotificationsDrawer.module.css";

export default function NotificationsDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setError("");
    getAuditLogs().then(logs => { if (active) setNotifications(logs.slice(0, 10).map(log => ({
      id:log.id,title:log.action,desc:log.description,time:log.timestamp,type:"info",unread:false,href:"/audit"
    }))); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [isOpen]);


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

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const getIcon = (type) => {
    if (type === "alert") return <ShieldAlert size={15} />;
    if (type === "success") return <CheckCircle2 size={15} />;
    return <FileText size={15} />;
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer} role="dialog" aria-label="System Notifications">
        <div className={styles.header}>
          <h3>
            <Bell size={16} />
            Notifications
            {unreadCount > 0 && <span className={styles.countBadge}>{unreadCount} New</span>}
          </h3>
          {unreadCount > 0 && (
            <button className={styles.markReadBtn} onClick={handleMarkAllRead}>
              Mark all read
            </button>
          )}
        </div>

        <div className={styles.list}>
          {error && <p role="alert">{error}</p>}
          {!error && !notifications.length && <p>No recent backend activity.</p>}
          {notifications.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.item} ${item.unread ? styles.unread : ""}`}
              onClick={onClose}
            >
              <div className={`${styles.itemIcon} ${styles[item.type]}`}>{getIcon(item.type)}</div>
              <div className={styles.itemContent}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.itemDesc}>{item.desc}</span>
                <span className={styles.itemTime}>{item.time}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className={styles.footer}>
          <Link href="/audit" className={styles.viewAll} onClick={onClose}>
            View Audit Trail & System Logs →
          </Link>
        </div>
      </div>
    </>
  );
}
