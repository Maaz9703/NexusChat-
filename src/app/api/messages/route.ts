import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';

export async function GET(req: Request) {
  try {
    await dbConnect();
    // fetch last 100 messages sorted by time
    const messages = await Message.find({}).sort({ createdAt: 1 }).limit(100).populate('senderId', 'name phone');
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { senderId, text } = body;

    if (!senderId || !text) {
      return NextResponse.json({ error: 'senderId and text are required' }, { status: 400 });
    }

    const newMessage = await Message.create({ senderId, text });
    await newMessage.populate('senderId', 'name phone');

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
