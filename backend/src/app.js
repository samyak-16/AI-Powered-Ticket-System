import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.route.js';
import { serve } from 'inngest/express';
import ticketRouter from './routes/ticket.route.js';
import { onUserSignUp } from '../inngest/functions/on-signup.js';
import { onTicketCreate } from '../inngest/functions/on-ticket-create.js';
import { inngest } from '../inngest/client.js';
const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use('/api/auth', userRouter);
app.use('/api/tickets', ticketRouter);
app.use(
  '/api/inngest',
  serve({ client: inngest, functions: [onUserSignUp, onTicketCreate] })
);
// app.use();

export { app };
