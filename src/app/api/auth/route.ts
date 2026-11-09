import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { ensureBot } from '@/lib/bot';
import { endSession, getSessionUserId, hashPassword, startSession, verifyPassword } from '@/lib/session';

const publicUser = (u: any) => ({ _id: u._id, name: u.name, phone: u.phone, avatarUrl: u.avatarUrl, about: u.about, isGuest: u.isGuest });
const normalizePhone = (p: string) => p.replace(/[\s-]/g, '').replace(/^(\+92|0092)/, '0');

/** Current signed-in user. */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ user: null });
  await dbConnect();
  const user = await User.findById(userId);
  return NextResponse.json({ user: user ? publicUser(user) : null });
}

/**
 * Sign in or register.
 * body: { mode: 'login' | 'register' | 'guest', phone?, password?, name? }
 */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { mode = 'login', phone: rawPhone = '', password = '', name = '' } = await req.json();
    await ensureBot();

    if (mode === 'guest') {
      const guest = await User.create({
        phone: `0999${randomInt(1_000_000, 9_999_999)}`,
        name: `Guest ${randomInt(100, 999)}`,
        isGuest: true,
        about: 'Exploring NexusChat',
      });
      await startSession(String(guest._id));
      return NextResponse.json({ success: true, user: publicUser(guest) });
    }

    const phone = normalizePhone(String(rawPhone));
    if (!/^0\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid Pakistani mobile number, e.g. 03001234567.' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    if (mode === 'register') {
      if (String(name).trim().length < 2) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
      if (await User.exists({ phone })) return NextResponse.json({ error: 'This number is already registered. Please sign in.' }, { status: 409 });
      const user = await User.create({ phone, name: String(name).trim().slice(0, 40), passwordHash: hashPassword(String(password)) });
      await startSession(String(user._id));
      return NextResponse.json({ success: true, user: publicUser(user) });
    }

    const user = await User.findOne({ phone }).select('+passwordHash');
    if (!user || !user.passwordHash || !verifyPassword(String(password), user.passwordHash)) {
      return NextResponse.json({ error: 'Incorrect phone number or password.' }, { status: 401 });
    }
    user.lastSeen = new Date();
    await user.save();
    await startSession(String(user._id));
    return NextResponse.json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function DELETE() {
  await endSession();
  return NextResponse.json({ success: true });
}
