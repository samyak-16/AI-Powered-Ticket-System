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

      // Fetch ticket
      const ticket = await step.run('fetch-ticket', async () => {
        const ticketObject = await Ticket.findById(ticketId);
        if (!ticketObject) {
          throw new NonRetriableError('Ticket no longer exists in database');
        }
        return ticketObject;
      });

      // Update status to analyzing
      await step.run('update-ticket-status', async () => {
        await Ticket.findByIdAndUpdate(ticketId, { status: 'Analyzing-By-AI' });
      });

      // Analyze with AI
      const aiResponse = await analyzeTicket(ticket);
      console.log('AI Response:', JSON.stringify(aiResponse, null, 2));

      // Update ticket with AI results
      const requiredSkills = await step.run('ai-processing', async () => {
        const skills = aiResponse.relatedSkills || [];
        await Ticket.findByIdAndUpdate(ticketId, {
          priority: ['low', 'medium', 'high'].includes(aiResponse.priority)
            ? aiResponse.priority
            : 'medium',
          helpfulNotes: aiResponse.helpfulNotes,
          relatedSkills: skills,
        });
        return skills;
      });

      // Assign to moderator/admin
      const moderator = await step.run(
        'assign-ticket-to-moderator',
        async () => {
          let user = await User.findOne({
            role: 'moderator',
            skills: requiredSkills.length
              ? {
                  $elemMatch: {
                    $regex: requiredSkills.join('|'),
                    $options: 'i',
                  },
                }
              : undefined,
          });

          if (!user) {
            user = await User.findOne({ role: 'admin' });
          }

          await Ticket.findByIdAndUpdate(ticketId, {
            assignedTo: user._id,
            status: 'sent-to-moderator',
          });

          return user;
        }
      );

      // Send email notification
      await step.run('send-ticket-email', async () => {
        if (moderator) {
          const finalTicket = await Ticket.findById(ticketId);
          const subject = 'Ticket Assigned';
          const message = `Hi,

A new ticket has been assigned to you: ${finalTicket.title}.
`;
          await sendMail(moderator.email, subject, message);
        }
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error running step:', error.message);
      return { success: false };
    }
  }
);

export { onTicketCreate };
