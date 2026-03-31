import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';
import Message from '@/models/Message';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name phone avatarUrl isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        model: Message,
        select: 'text createdAt status type'
      })
      .sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, chats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { user1Id, user2Id } = body;

    if (!user1Id || !user2Id) {
      return NextResponse.json({ error: 'Both user IDs are required' }, { status: 400 });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [user1Id, user2Id], $size: 2 }
    }).populate('participants', 'name phone avatarUrl isOnline lastSeen');

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        participants: [user1Id, user2Id]
      });
      await chat.populate('participants', 'name phone avatarUrl isOnline lastSeen');
    }

    return NextResponse.json({ success: true, chat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
