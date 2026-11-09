import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSessionUserId } from '@/lib/session';
import { ensureBot } from '@/lib/bot';

// Contact directory for signed-in users. Phone numbers are never exposed.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  try {
    await dbConnect();
    await ensureBot();
    const users = await User.find({ _id: { $ne: userId }, isGuest: { $ne: true } })
      .select('name lastSeen avatarUrl about isOnline')
      .sort({ lastSeen: -1 })
      .limit(100);
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not load contacts.' }, { status: 500 });
  }
}
