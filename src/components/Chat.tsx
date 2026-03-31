"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import styles from "./Chat.module.css";
import { ArrowLeft } from "lucide-react";

interface User {
  _id: string;
  name: string;
  phone: string;
  isOnline?: boolean;
}

interface ChatObj {
  _id: string;
  participants: User[];
}

interface ChatProps {
  currentUser: User;
  onLogout: () => void;
}

export default function Chat({ currentUser, onLogout }: ChatProps) {
  const [activeChat, setActiveChat] = useState<ChatObj | null>(null);
  const [activeOtherUser, setActiveOtherUser] = useState<User | null>(null);

  const handleSelectChat = (chat: ChatObj, otherUser: User) => {
    setActiveChat(chat);
    setActiveOtherUser(otherUser);
  };

  const handleBackToList = () => {
    setActiveChat(null);
    setActiveOtherUser(null);
  };

  return (
    <div className={`${styles.chatApp} ${activeChat ? styles.chatActive : ''}`}>
      <div className={styles.chatContainer}>
        <div className={styles.sidebarWrapper}>
          <Sidebar 
            currentUser={currentUser} 
            onSelectChat={handleSelectChat}
            activeChatId={activeChat?._id}
            onLogout={onLogout}
          />
        </div>
        
        {/* On mobile, we might need a custom wrapper to add a back button to the chat window,
            but we can just overlay it or pass it. Let's pass a wrapper or handle it here! */}
        <div className={styles.chatWindowWrapper}>
          {activeChat && (
            <div className={styles.mobileBackBtn}>
               <button onClick={handleBackToList} className={styles.backButton}>
                 <ArrowLeft size={24} />
               </button>
            </div>
          )}
          <ChatWindow 
            chat={activeChat}
            currentUser={currentUser}
            otherUser={activeOtherUser}
          />
        </div>
      </div>
    </div>
  );
}
