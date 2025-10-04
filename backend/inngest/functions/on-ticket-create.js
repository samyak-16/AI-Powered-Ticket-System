import { NonRetriableError } from 'inngest';
import { User } from '../../src/models/user.model.js';
import { inngest } from '../client.js';
import { sendMail } from '../../src/utils/sendMail.js';
import { Ticket } from '../../src/models/ticket.model.js';
import { analyzeTicket } from '../../src/utils/ai.js';

const onTicketCreate = inngest.createFunction(
  {
    id: 'on-ticket-create',
    retries: 3,
  },
  { event: 'ticket/created' },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      //Fetch Ticket From db

      const ticket = await step.run('fetch-ticket', async () => {
        const ticketObject = await Ticket.findById(ticketId);
        if (!ticketObject) {
          throw new NonRetriableError(
            'Ticket no longer exists in our databases'
          );
        }
        return ticketObject;
      });

      await step.run('update-ticket-status', async () => {
        await Ticket.findByIdAndUpdate(ticketId, { status: 'Analyzing-By-AI' });
      });

      const aiResponse = await step.run('ai-response', async () => {
        const aiResponse = await analyzeTicket(ticket);
        if (!aiResponse) {
          throw new Error('AI response was null, retrying...');
        }
        return aiResponse;
      });

      console.log('AI Response : ', aiResponse);

      // {
      // "summary": "Short summary of the ticket",
      // "priority": "high",
      // "helpfulNotes": "Here are useful tips...",
      // "relatedSkills": ["React", "Node.js"]
      // }

      const requiredSkills = await step.run('ai-processing', async () => {
        let skills = [];
        await Ticket.findByIdAndUpdate(ticketId, {
          priority: !['low', 'medium', 'high'].includes(aiResponse.priority)
            ? 'medium'
            : aiResponse.priority,
          helpfulNotes: aiResponse.helpfulNotes,
          relatedSkills: aiResponse.relatedSkills,
        });
        skills = aiResponse.relatedSkills;
        return skills;
      });

      const moderator = await step.run(
        'assign-ticket-to-moderator',
        async () => {
          let user = await User.findOne({
            role: 'moderator',
            skills: {
              $elemMatch: {
                $regex: relatedskills.join('|'),
                $options: 'i',
              },
            },
          });
          if (!user) {
            const user = await User.findOne({ role: 'admin' });
          }
          await Ticket.findByIdAndUpdate(ticketId, { assignedTo: user._id });
          return user;
        }
      );
      await step.run('send-ticket-email', async () => {
        if (moderator) {
          const finalTicket = await Ticket.findById(ticketId);
          const subject = 'Ticket Assigned';
          const message = `Hi
        \n \n
        A new ticket is ssigned to you : ${finalTicket.title}.
        `;
          await sendMail(moderator.email, subject, text);
        }
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error running step : ', error.message);
      return { success: false };
    }
  }
);

export { onTicketCreate };
