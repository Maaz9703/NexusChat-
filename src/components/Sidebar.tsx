"use client";

import { useState, useEffect } from "react";
import { MessageSquarePlus, MoreVertical, Search, Check, CheckCheck } from "lucide-react";
import styles from "./Sidebar.module.css";
import { pusherClient } from "@/lib/pusher";

interface User {
  _id: string;
  name: string;
  phone: string;
}

interface Chat {
  _id: string;
  participants: User[];
  lastMessage?: {
    text: string;
    createdAt: string;
    status: string;
  };
  updatedAt: string;
}

interface SidebarProps {
  currentUser: User;
  onSelectChat: (chat: Chat, otherUser: User) => void;
  activeChatId?: string;
  onLogout: () => void;
}

export default function Sidebar({ currentUser, onSelectChat, activeChatId, onLogout }: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [viewingContacts, setViewingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchChats();
    fetchContacts();

    // Bind Pusher to listen for chat list updates (e.g. new message pushes chat to top)
    const channel = pusherClient.subscribe(`user-${currentUser._id}`);
    channel.bind("chat-updated", () => {
       fetchChats(); // Refresh order and preview
    });
    return () => {
      pusherClient.unsubscribe(`user-${currentUser._id}`);
    };
  }, [currentUser._id]);

  const fetchChats = async () => {
    const res = await fetch(`/api/chats?userId=${currentUser._id}`);
    const data = await res.json();
    if (data.success) {
      setChats(data.chats);
    }
  };

  const fetchContacts = async () => {
    const res = await fetch(`/api/users`);
    const data = await res.json();
    if (data.success) {
      // Filter out ourselves
      setContacts(data.users.filter((u: User) => u._id !== currentUser._id));
    }
  };

  const startNewChat = async (contact: User) => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user1Id: currentUser._id, user2Id: contact._id }),
      });
      const data = await res.json();
      if (data.success) {
        setViewingContacts(false);
        fetchChats();
        onSelectChat(data.chat, contact);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.participants.find(p => p._id !== currentUser._id);
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.profilePic}>
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={() => setViewingContacts(!viewingContacts)}>
            <MessageSquarePlus size={20} />
          </button>
          <button className={styles.iconBtn} onClick={onLogout}>
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <Search size={18} color="#8696a0" />
          <input
            type="text"
            placeholder={viewingContacts ? "Search contacts..." : "Search or start new chat"}
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.chatList}>
        {viewingContacts ? (
          <>
            <div className={styles.contactsHeader}>New Chat</div>
            {contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(contact => (
              <div key={contact._id} className={styles.chatItem} onClick={() => startNewChat(contact)}>
                <div className={styles.chatAvatar}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.chatDetails}>
                  <div className={styles.chatName}>{contact.name}</div>
                  <div className={styles.chatPreview}>{contact.phone}</div>
                </div>
              </div>
            ))}
          </>
        ) : (
          filteredChats.map(chat => {
            const otherUser = chat.participants.find(p => p._id !== currentUser._id) || chat.participants[0];
            const isActive = activeChatId === chat._id;
            return (
              <div 
                key={chat._id} 
                className={`${styles.chatItem} ${isActive ? styles.active : ''}`}
                onClick={() => onSelectChat(chat, otherUser)}
              >
                <div className={styles.chatAvatar}>
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.chatDetails}>
                  <div className={styles.chatTopLine}>
                    <span className={styles.chatName}>{otherUser.name}</span>
                    <span className={styles.chatTime}>{formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}</span>
                  </div>
                  <div className={styles.chatBottomLine}>
                    <span className={styles.chatPreview}>
                      {chat.lastMessage?.text || "Started a conversation"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
