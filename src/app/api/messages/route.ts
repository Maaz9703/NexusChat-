import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { pusherServer } from '@/lib/pusher';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
       return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
    }

    // fetch last 100 messages for this specific chat
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).limit(100).populate('senderId', 'name phone avatarUrl');
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { senderId, chatId, text, type = 'text' } = body;

    if (!senderId || !chatId || !text) {
      return NextResponse.json({ error: 'senderId, chatId, and text are required' }, { status: 400 });
    }

    const newMessage = await Message.create({ senderId, chatId, text, type, status: 'sent' });
    await newMessage.populate('senderId', 'name phone avatarUrl');

    // Update the last message tracker on the chat
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: newMessage._id,
      updatedAt: new Date()
    });

    let currentChat: any = null;
    // Broadcast the new message via Pusher
    try {
      await pusherServer.trigger(`chat-${chatId}`, 'incoming-message', newMessage);
      // Also broadcast to the active user's 'conversations' channel to update sidebars instantly
      currentChat = await Chat.findById(chatId).populate('participants', 'name phone avatarUrl isOnline lastSeen');
      if (currentChat) {
         currentChat.participants.forEach((user: any) => {
            pusherServer.trigger(`user-${user._id.toString()}`, 'chat-updated', currentChat);
         });
      }
    } catch (pusherErr) {
      console.warn("Pusher error, continuing without real-time broadcast:", pusherErr);
      if (!currentChat) currentChat = await Chat.findById(chatId).populate('participants', 'name phone avatarUrl isOnline lastSeen');
    }

    // Auto-Reply Logic for Nexus AI
    if (currentChat) {
       const isAiChat = currentChat.participants.some((p: any) => p.toString() === "00000000000" || p.phone === "00000000000" || p.name === "Nexus AI (Bot)");
       
       if (isAiChat) {
          // If we are not the AI sending it, let the AI reply!
          const aiUser = await User.findOne({ phone: "00000000000" });
          if (aiUser && senderId !== aiUser._id.toString()) {
             // We won't block the request, we just save the AI message immediately
             const autoReply = await Message.create({
                senderId: aiUser._id,
                chatId: chatId,
                text: "I'm Nexus AI! I'm currently in demo mode, but soon I'll be fully connected to an LLM!",
                type: 'text',
                status: 'delivered'
             });
             await autoReply.populate('senderId', 'name phone avatarUrl');
             
             await Chat.findByIdAndUpdate(chatId, {
               lastMessage: autoReply._id,
               updatedAt: new Date()
             });

             // Note: In a production Vercel app, we'd use a background job to delay this.
             // For now, we trigger it immediately over Pusher.
             try {
                await pusherServer.trigger(`chat-${chatId}`, 'incoming-message', autoReply);
             } catch (e) {}
          }
       }
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
