"use client";

import { useState } from "react";
import styles from "./Login.module.css";

interface LoginProps {
  onLogin: (user: { _id: string; name: string; phone: string }) => void;
}

type Mode = "login" | "register";

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (payload: Record<string, string>) => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Authentication failed.");
      else onLogin(data.user);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit({ mode, phone, password, ...(mode === "register" ? { name } : {}) });
  };

  return (
    <div className={styles.container}>
      <form className={styles.glassCard} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Nexus Chat</h1>
        <p className={styles.subtitle}>{mode === "login" ? "Sign in to continue" : "Create your account"}</p>

        {error && <div className={styles.error} role="alert">{error}</div>}

        {mode === "register" && (
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="name">Your Name</label>
            <input id="name" type="text" className={styles.input} placeholder="e.g. Ali Ahmed" autoComplete="name"
              value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} required minLength={2} />
          </div>
        )}

        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="phone">Mobile Number</label>
          <input id="phone" type="tel" className={styles.input} placeholder="03001234567" autoComplete="tel"
            value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading} required />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input id="password" type="password" className={styles.input} placeholder="At least 6 characters"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} required minLength={6} />
        </div>

        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <button type="button" className={styles.button} disabled={isLoading} onClick={() => submit({ mode: "guest" })}
          style={{ marginTop: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.35)" }}>
          Try as Guest — no sign-up
        </button>

        <p className={styles.subtitle} style={{ marginTop: 18, marginBottom: 0 }}>
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{ background: "none", border: "none", color: "#25d366", fontWeight: 600, cursor: "pointer", padding: 0, font: "inherit" }}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}
