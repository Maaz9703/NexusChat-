"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Smile, Phone, Video, Search } from "lucide-react";
import styles from "./ChatWindow.module.css";
import { pusherClient } from "@/lib/pusher";

interface User {
  _id: string;
  name: string;
  phone: string;
  isOnline?: boolean;
}

interface Chat {
  _id: string;
  participants: User[];
}

interface Message {
  _id: string;
  senderId: User;
  text: string;
  createdAt: string;
  status: string;
  type: string;
}

interface ChatWindowProps {
  chat: Chat | null;
  currentUser: User;
  otherUser: User | null;
}

export default function ChatWindow({ chat, currentUser, otherUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      fetchMessages();
      
      const channel = pusherClient.subscribe(`chat-${chat._id}`);
      channel.bind('incoming-message', (newMessage: Message) => {
        setMessages((prev) => {
           // Prevent duplicates
           if (prev.find(m => m._id === newMessage._id)) return prev;
           return [...prev, newMessage];
        });
      });
      
      return () => {
        pusherClient.unsubscribe(`chat-${chat._id}`);
      };
    } else {
      setMessages([]);
    }
  }, [chat?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!chat) return;
    try {
      const res = await fetch(`/api/messages?chatId=${chat._id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
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
    if (!text.trim() || !chat || isSending) return;

    setIsSending(true);
    const textToSend = text;
    setText("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          senderId: currentUser._id, 
          chatId: chat._id, 
          text: textToSend 
        }),
      });

      const data = await res.json();
      if (data.success) {
         // Pusher will update the list, but we can also manually add for instant feedback
         setMessages(prev => {
            if (prev.find(m => m._id === data.message._id)) return prev;
            return [...prev, data.message];
         });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const DoubleTick = ({ status }: { status: string }) => {
     let color = "rgba(255,255,255,0.6)";
     if (status === 'read') color = "#53bdeb"; // WhatsApp Blue tick
     return (
       <svg viewBox="0 0 16 15" width="16" height="15">
         <path fill={color} d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
       </svg>
     );
  };

  if (!chat || !otherUser) {
    return (
      <div className={styles.emptyState}>
        <h1>NexusChat Web</h1>
        <p>Send and receive messages without keeping your phone online.</p>
        <p>Use NexusChat on up to 4 linked devices and 1 phone at the same time.</p>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      <header className={styles.header}>
        <div className={styles.profilePic} style={{
          width: 40, height: 40, borderRadius: '50%', background: '#667781',
          display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold'
        }}>
          {otherUser.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>{otherUser.name}</div>
          <div className={styles.headerStatus}>{otherUser.isOnline ? 'Online' : 'Offline'}</div>
        </div>
        <div className={styles.headerActions}>
           <Video size={20} className={styles.inputIcon} />
           <Phone size={20} className={styles.inputIcon} />
           <Search size={20} className={styles.inputIcon} />
        </div>
      </header>

      <div className={styles.messagesArea} ref={scrollRef}>
        {messages.map((msg, index) => {
          const isMe = msg.senderId._id === currentUser._id;
          const showTail = index === 0 || messages[index - 1].senderId._id !== msg.senderId._id;
          
          return (
            <div 
               key={msg._id} 
               className={`${styles.messageRow} ${isMe ? styles.myMessageRow : styles.otherMessageRow}`}
               style={{ marginTop: showTail ? 8 : 2 }} // Less margin if from same sender
            >
              <div className={`${styles.messageBubble} ${isMe ? styles.myMessage : styles.otherMessage}`}>
                <span>{msg.text}</span>
                <div className={styles.messageMeta}>
                   <span className={styles.messageTime}>{formatTime(msg.createdAt)}</span>
                   {isMe && <DoubleTick status={msg.status} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form className={styles.inputArea} onSubmit={handleSend}>
        <Smile size={24} className={styles.inputIcon} />
        <Paperclip size={24} className={styles.inputIcon} />
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.textInput}
            placeholder="Type a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <button type="submit" className={`${styles.sendButton} ${text.trim() ? styles.active : ''}`}>
          <Send size={24} />
        </button>
      </form>
    </div>
  );
}
