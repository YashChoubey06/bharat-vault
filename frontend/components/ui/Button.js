"use client";

import React from "react";
import styles from "./Button.module.css";

export default function Button({
  children,
  variant = "primary", // "primary", "secondary", "ghost"
  className = "",
  ...props
}) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
