import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      uniqie: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'User',
      enum: ['user', 'admin', 'moderator'],
    },
    skills: {
      type: [String],
    },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
