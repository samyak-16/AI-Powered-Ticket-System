import { createAgent, gemini } from '@inngest/agent-kit';
import { env } from '../config/env.js';

const analyzeTicket = async (ticket) => {
  const supportAgent = createAgent({
    model: gemini({
      model: 'gemini-2.0-flash-lite',
      apiKey: env.GEMINI_API_KEY,
    }),
    name: 'AI Ticket Triage Assistant',
    system: `You are an expert AI assistant that processes technical support tickets.

Your job is to:
1. Summarize the issue.
2. Estimate its priority.
3. Provide helpful notes and resource links for human moderators.
4. List relevant technical skills required.

IMPORTANT:
- Respond with only valid raw JSON.
- Do NOT include markdown, code fences, comments, or extra formatting.
- The format must be a raw JSON object.`,
  });

  let response;
  try {
    response =
      await supportAgent.run(`You are a ticket triage agent. Return only a strict JSON object with no extra text or markdown.

Analyze this support ticket:

- Title: ${ticket.title}
- Description: ${ticket.description}

Respond ONLY in this JSON format:

{
  "summary": "Short summary of the ticket",
  "priority": "high",
  "helpfulNotes": "Here are useful tips...",
  "relatedSkills": ["React", "Node.js"]
}`);
  } catch (err) {
    console.error('Error calling AI:', err.message);
    return {
      summary: ticket?.description?.slice(0, 140) || 'No summary available',
      priority: 'medium',
      helpfulNotes:
        'AI analysis unavailable. Please review this ticket manually.',
      relatedSkills: [],
    };
  }

  // Extract raw content
  const raw = response?.output?.[0]?.content || '';
  const cleaned = raw
    .replace(/```json\s*/i, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Invalid AI response. Using fallback:', err.message);
    return {
      summary: ticket?.description?.slice(0, 140) || 'No summary available',
      priority: 'medium',
      helpfulNotes:
        'AI response was invalid. Please review this ticket manually.',
      relatedSkills: [],
    };
  }
};

export { analyzeTicket };
