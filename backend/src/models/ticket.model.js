import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: {
    type: String,
    default: 'todo',
    enums: ['TODO', 'Analyzing-By-AI', 'sent-to-moderator', 'ressolved'],
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },

  priority: {
    type: [String],
    default: null,
    enums: ['low', 'medium', 'high'],
  },
  deadline: Date,
  helpfulNotes: String,
  relatedSkills: [String],
});

export const Ticket = mongoose.model('Ticket', ticketSchema);
