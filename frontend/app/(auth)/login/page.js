"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  LockKeyhole,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  Shield,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("officer@bharatvault.gov.in");
  const [password, setPassword] = useState("Officer@12345");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err?.message ||
          "Unable to sign in. Please verify backend is running on port 8000."
      );
    }
  }

  const fillOfficerCredentials = () => {
    setEmail("officer@bharatvault.gov.in");
    setPassword("Officer@12345");
    setError("");
  };

  const fillAdminCredentials = () => {
    setEmail("admin@bharatvault.gov.in");
    setPassword("Admin@12345");
    setError("");
  };

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGrid} />

      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <div className={styles.brandIcon}>
            <ShieldCheck size={22} />
          </div>

          <div>
            <strong>Bharat Vault</strong>
            <span>Land Record Intelligence</span>
          </div>
        </Link>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.securityIcon}>
              <ShieldCheck size={20} />
            </div>

            <div>
              <h1>Sign in to Bharat Vault</h1>
              <p>Access your land record verification workspace.</p>
            </div>
          </div>

          {/* QUICK DEMO AUTOFILL BUTTONS */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            padding: "12px",
            background: "rgba(37, 99, 235, 0.06)",
            borderRadius: "10px",
            border: "1px solid rgba(37, 99, 235, 0.15)"
          }}>
            <button
              type="button"
              onClick={fillOfficerCredentials}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#2563eb",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              <UserCheck size={14} />
              Demo Officer
            </button>
            <button
              type="button"
              onClick={fillAdminCredentials}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#475569",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              <Shield size={14} />
              Demo Admin
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="email">Official email</label>

              <div className={styles.inputWrapper}>
                <Mail size={17} />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="officer@bharatvault.gov.in"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="password">Password</label>
                <span>Demo Account</span>
              </div>

              <div className={styles.inputWrapper}>
                <LockKeyhole size={17} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />

                <button
                  type="button"
                  className={styles.passwordButton}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className={styles.demoNotice}>
            <strong>Quick Demo Sign In</strong>
            <span>
              Click <strong>Demo Officer</strong> or <strong>Demo Admin</strong> above to auto-fill valid credentials.
            </span>
          </div>
        </section>

        <p className={styles.footerText}>
          Bharat Vault · Evidence-driven land record intelligence
        </p>
      </div>
    </main>
  );
}
