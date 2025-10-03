import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: {
    type: String,
    default: 'todo',
    enums: ['todo'],
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

  priority: String,
  deadline: Date,
  helpfulNotes: String,
  relatedSkills: [String],
});

export const Ticket = mongoose.model('Ticket', ticketSchema);
