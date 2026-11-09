import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';
import Message from '@/models/Message';
import { getSessionUserId } from '@/lib/session';

const unauthorized = () => NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

// Lists the signed-in user's chats.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();
  try {
    await dbConnect();
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name avatarUrl isOnline lastSeen about')
      .populate({ path: 'lastMessage', model: Message, select: 'text createdAt status type senderId' })
      .sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, chats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not load chats.' }, { status: 500 });
  }
}

// Opens (or creates) a chat between the signed-in user and another user.
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();
  try {
    await dbConnect();
    const { user2Id } = await req.json();
    if (!user2Id || !mongoose.isValidObjectId(user2Id) || user2Id === userId) {
      return NextResponse.json({ error: 'Choose someone to chat with.' }, { status: 400 });
    }
    if (!(await User.exists({ _id: user2Id }))) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    let chat = await Chat.findOne({ participants: { $all: [userId, user2Id], $size: 2 } });
    if (!chat) chat = await Chat.create({ participants: [userId, user2Id] });
    await chat.populate('participants', 'name avatarUrl isOnline lastSeen about');
    return NextResponse.json({ success: true, chat });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not open chat.' }, { status: 500 });
  }
}
