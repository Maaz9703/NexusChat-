import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Chat from '@/models/Chat';
import { pusherServer } from '@/lib/pusher';
import { getSessionUserId } from '@/lib/session';
import { BOT_PHONE, botReply, ensureBot } from '@/lib/bot';

const unauthorized = () => NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

async function chatForUser(chatId: string | null, userId: string) {
  if (!chatId || !mongoose.isValidObjectId(chatId)) return null;
  return Chat.findOne({ _id: chatId, participants: userId });
}

async function broadcast(chatId: string, message: unknown) {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(`chat-${chatId}`, 'incoming-message', message);
    const chat = await Chat.findById(chatId).select('participants');
    await Promise.all((chat?.participants ?? []).map((p: unknown) => pusherServer!.trigger(`user-${String(p)}`, 'chat-updated', { chatId })));
  } catch (err) {
    console.warn('Pusher broadcast failed:', err);
  }
}

// Messages of a chat the signed-in user takes part in.
export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();
  try {
    await dbConnect();
    const chatId = new URL(req.url).searchParams.get('chatId');
    if (!(await chatForUser(chatId, userId))) return NextResponse.json({ error: 'Chat not found.' }, { status: 404 });

    // Mark the other person's messages as read.
    await Message.updateMany({ chatId, senderId: { $ne: userId }, status: { $ne: 'read' } }, { status: 'read' });
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).limit(200).populate('senderId', 'name avatarUrl');
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not load messages.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();
  try {
    await dbConnect();
    const { chatId, text } = await req.json();
    const clean = String(text || '').trim().slice(0, 2000);
    if (!clean) return NextResponse.json({ error: 'Message is empty.' }, { status: 400 });
    const chat = await chatForUser(chatId, userId);
    if (!chat) return NextResponse.json({ error: 'Chat not found.' }, { status: 404 });

    const message = await Message.create({ senderId: userId, chatId, text: clean, type: 'text', status: 'sent' });
    await message.populate('senderId', 'name avatarUrl');
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id, updatedAt: new Date() });
    await broadcast(chatId, message);

    // The demo assistant answers straight away.
    const bot = await ensureBot();
    const isBotChat = chat.participants.some((p: unknown) => String(p) === String(bot._id));
    if (isBotChat && bot.phone === BOT_PHONE) {
      const reply = await Message.create({ senderId: bot._id, chatId, text: botReply(clean), type: 'text', status: 'delivered' });
      await reply.populate('senderId', 'name avatarUrl');
      await Chat.findByIdAndUpdate(chatId, { lastMessage: reply._id, updatedAt: new Date() });
      await Message.findByIdAndUpdate(message._id, { status: 'read' });
      await broadcast(chatId, reply);
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not send message.' }, { status: 500 });
  }
}
