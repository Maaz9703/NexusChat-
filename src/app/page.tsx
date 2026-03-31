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

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("chatUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("chatUser");
    setCurrentUser(null);
  };

  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <ThreeBackground />
      {!currentUser ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Chat currentUser={currentUser} onLogout={handleLogout} />
      )}
    </main>
  );
}
