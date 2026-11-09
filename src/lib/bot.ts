import User from '@/models/User';

export const BOT_PHONE = '00000000000';

export async function ensureBot() {
  let bot = await User.findOne({ phone: BOT_PHONE });
  if (!bot) {
    bot = await User.create({ phone: BOT_PHONE, name: 'Nexus Assistant', about: 'Say hi — I reply instantly.', isOnline: true });
  }
  return bot;
}

/** Gives a brand-new account a chat with the assistant so the inbox isn't empty. */
export async function welcomeNewUser(userId: string) {
  const [{ default: Chat }, { default: Message }] = await Promise.all([import('@/models/Chat'), import('@/models/Message')]);
  const bot = await ensureBot();
  const chat = await Chat.create({ participants: [userId, bot._id] });
  const msg = await Message.create({
    senderId: bot._id, chatId: chat._id, type: 'text', status: 'delivered',
    text: 'Welcome to NexusChat! 👋 I’m the Nexus Assistant. Send me a message to try it out, or tap the new-chat icon to message another user.',
  });
  await Chat.findByIdAndUpdate(chat._id, { lastMessage: msg._id, updatedAt: new Date() });
}

const REPLIES: [RegExp, string][] = [
  [/\b(hi|hello|hey|salam|assalam)\b/i, 'Hey! 👋 Welcome to NexusChat. Try opening “New chat” to message another user, or keep chatting with me.'],
  [/how are you|kaise|kese/i, 'Running smoothly, thanks! Messages here are stored in MongoDB and update live.'],
  [/feature|what can|kya kar/i, 'NexusChat supports one-to-one chats, delivery ticks, online status, contact search and a mobile app built with Capacitor.'],
  [/who (made|built)|developer|maaz/i, 'NexusChat was built by Maaz with Next.js, MongoDB and Pusher.'],
  [/bye|thanks|thank you|shukriya/i, 'Anytime! Have a great day ✨'],
];

export function botReply(text: string) {
  const hit = REPLIES.find(([re]) => re.test(text));
  return hit ? hit[1] : `You said: “${text.slice(0, 120)}”. I’m a demo assistant — ask me about features, or start a chat with another user.`;
}
