import express from 'express';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import {
  createTicket,
  getAllTicket,
  getTickets,
  getTicket,
} from '../controllers/ticket.controller.js';
const router = express.Router();

router.get('/', authenticateUser, getAllTicket);
router.get('/:ticketId', authenticateUser, getTicket);
router.post('/', authenticateUser, createTicket);

export default router;
