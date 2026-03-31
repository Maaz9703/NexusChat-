"use client";

import { useState } from "react";
import styles from "./Login.module.css";

interface LoginProps {
  onLogin: (user: { _id: string; name: string; phone: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsName, setNeedsName] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404 && data.error.includes("name")) {
          setNeedsName(true);
          setError("Number not found. Please enter your name to register.");
        } else {
          setError(data.error || "Authentication failed.");
        }
      } else {
        localStorage.setItem("chatUser", JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.glassCard} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Nexus Chat</h1>
        <p className={styles.subtitle}>Enter your details to connect</p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.inputGroup}>
          <label className={styles.label}>Pakistani Phone Number</label>
          <input
            type="tel"
            className={styles.input}
            placeholder="+92-300-1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading || needsName}
            required
          />
        </div>

        {needsName && (
          <div className={styles.inputGroup}>
            <label className={styles.label}>Your Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Ali Ahmed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        )}

        <button 
          type="submit" 
          className={styles.button}
          disabled={isLoading}
        >
          {isLoading ? "Connecting..." : needsName ? "Register & Enter" : "Enter Chat"}
        </button>
      </form>
    </div>
  );
}
