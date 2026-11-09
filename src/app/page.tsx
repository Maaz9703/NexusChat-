"use client";

import { useState, useEffect } from "react";
import Login from "@/components/Login";
import Chat from "@/components/Chat";
import ThreeBackground from "@/components/ThreeBackground";

interface User {
  _id: string;
  name: string;
  phone: string;
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Restore the session from the secure cookie.
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setCurrentUser(d.user ?? null))
      .catch(() => setCurrentUser(null))
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    setCurrentUser(null);
  };

  return (
    <main style={{ width: "100vw", height: "100dvh", overflow: "hidden" }}>
      <ThreeBackground />
      {checking ? null : !currentUser ? (
        <Login onLogin={setCurrentUser} />
      ) : (
        <Chat currentUser={currentUser} onLogout={handleLogout} />
      )}
    </main>
  );
}
