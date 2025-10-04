import { inngest } from '../../inngest/client.js';
import { Ticket } from '../models/ticket.model.js';
import ApiError from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';

const createTicket = async (req, res) => {
  const { title = '', description = -'' } = req.body;
  if (!title || !description) {
    return res.status(400).json(new ApiError(400, 'All fields are required'));
  }

  try {
    const ticket = new Ticket({
      title,
      description,
      createdBy: req.user._id.toString(),
    });
    await inngest.send({
      name: 'ticket/created',
      data: { ticketId: ticket._id.toString() },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { ticket },
          'Ticket Created and processing started'
        )
      );
  } catch (error) {
    console.error('❌ Internal Server Error at createTicket', error);
    return new ApiError(500, 'Internal Server Error at createTicket');
  }
};

//Get all tickets from the db if user is(moderator or admin) or getAllTickets published by a user .
const getAllTicket = async (req, res) => {
  const user = req.user;
  try {
    let tickets = [];
    if (user.role !== 'user') {
      tickets = Ticket.find({})
        .populate('assignedTo', ['email', '_id'])
        .sort({ createdAt: -1 });
    } else {
      tickets = await Ticket.find({ createdBy: user._id })
        .select('title description status createdAt')
        .sort({ createdAt: -1 });
    }
    return res
      .status(200)
      .json(new ApiResponse(200, { tickets }, 'Tickets Fetched succesfully'));
  } catch (error) {
    console.error('Internal Server Error at getAllTickets ', error.message);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at getAllTickets'));
  }
};

//Get all tickets assigned to moderator or admin
const getTickets = async (req, res) => {};

//Get more info about for a specific ticket
const getTicket = async (req, res) => {
  const user = req.user;
  const ticketId = req.params?.ticketId;
  try {
    let ticket;
    if (user.role !== 'user') {
      ticket = Ticket.findById(ticketId).populate('assignedTo', [
        'email',
        '_id',
      ]);
    } else {
      ticket = Ticket.findOne({
        createdBy: user._id.toString(),
        _id: ticketId,
      }).select('title description status createdAt');
    }
    if (!ticket) {
      return res.status(404).json(new ApiError(404, 'No any tickets found'));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, { ticket }, 'Ticket fetched successfully'));
  } catch (error) {
    console.error('Internal Server Error at getTicket', error.message);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at getTicket'));
  }
};

export { createTicket, getAllTicket, getTickets, getTicket };
