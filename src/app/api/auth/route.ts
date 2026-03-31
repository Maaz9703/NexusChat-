import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { phone, name } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Try finding the user
    let user = await User.findOne({ phone });

    // If user doesn't exist but name is provided, create
    if (!user && name) {
      user = await User.create({ phone, name });
    }
    
    // If user doesn't exist and name is NOT provided, return error to prompt for name
    if (!user && !name) {
      return NextResponse.json({ error: 'User not found. Please provide a name to register.' }, { status: 404 });
    }

    // Update last seen
    if (user) {
      user.lastSeen = Date.now();
      await user.save();
    }

    // Send back minimal user object
    return NextResponse.json({
        success: true,
        user: { _id: user._id, name: user.name, phone: user.phone }
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
