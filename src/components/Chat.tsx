"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Chat.module.css";

interface User {
  _id: string;
  name: string;
  phone: string;
}

interface Message {
  _id: string;
  senderId: User;
  text: string;
  createdAt: string;
}

interface ChatProps {
  currentUser: User;
  onLogout: () => void;
}

export default function Chat({ currentUser, onLogout }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages initially and poll every 3 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSending(true);
    const textToSend = text;
    setText("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: currentUser._id, text: textToSend }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <header className={styles.header}>
        <h2>Nexus Chat</h2>
        <button onClick={onLogout} className={styles.logoutBtn}>
          Exit
        </button>
      </header>

      <div className={styles.messagesArea} ref={scrollRef}>
        <AnimatePresence>
          {messages.map((msg) => {
            const isMe = msg.senderId._id === currentUser._id;
            return (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${styles.messageRow} ${
                  isMe ? styles.myMessage : styles.otherMessage
                }`}
              >
                {!isMe && (
                  <span className={styles.senderName}>{msg.senderId.name}</span>
                )}
                <div className={styles.messageBubble}>{msg.text}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <form className={styles.inputContainer} onSubmit={handleSend}>
        <input
          type="text"
          className={styles.input}
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSending}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!text.trim() || isSending}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
