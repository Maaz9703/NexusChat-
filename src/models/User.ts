import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Please provide a valid Pakistani phone number'],
    unique: true,
    match: [/^((\+92)|(0092))-{0,1}\d{3}-{0,1}\d{7}$|^\d{11}$|^\d{4}-\d{7}$/, 'Please add a valid Pakistani phone number.'],
  },
  name: {
    type: String,
    required: [true, 'Please provide your name'],
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  about: {
    type: String,
    default: 'Hey there! I am using NexusChat.',
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
