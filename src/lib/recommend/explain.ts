import OpenAI from 'openai';
import { ShelfItem } from '@prisma/client';
import { TasteProfile } from './types';

/**
 * Generate a one-line reason for a pick grounded in creator note + fan words
 */
export async function explainPick(
  item: ShelfItem,
  profile: TasteProfile,
  fanName: string
): Promise<string> {
  // If no XAI_API_KEY, use deterministic fallback
  if (!process.env.XAI_API_KEY) {
    return explainPickFallback(item, profile, fanName);
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });

    const prompt = `You're Maya, a London singer-songwriter. Explain why you're recommending this item to ${fanName}.

Item: ${item.title}
Type: ${item.type}
Your note: "${item.creatorNote}"

${fanName}'s taste: ${profile.summary}
${profile.wantsNext.length > 0 ? `They want: ${profile.wantsNext.join(', ')}` : ''}

Write a ONE-LINE reason (under 120 characters) that:
1. Connects your note to what ${fanName} said in chat
2. Sounds like you (warm, personal, honest)
3. Never rewrites or replaces your original note - reference it naturally

Example: "You mentioned wanting quiet music, and this piano version gets me every time too."`;

    const response = await client.chat.completions.create({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'You are Maya, a thoughtful creator recommending items to fans. Keep it under 120 characters.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const reason = response.choices[0].message.content?.trim();
    if (!reason) {
      return explainPickFallback(item, profile, fanName);
    }

    // Ensure it's not too long
    return reason.length > 140 ? reason.substring(0, 137) + '...' : reason;
  } catch (error) {
    console.error('Error generating pick explanation:', error);
    return explainPickFallback(item, profile, fanName);
  }
}

/**
 * Deterministic fallback when LLM is unavailable
 */
function explainPickFallback(
  item: ShelfItem,
  profile: TasteProfile,
  fanName: string
): string {
  const itemTags = item.tags ? JSON.parse(item.tags) : [];
  const allWants = [...profile.wantsNext, ...profile.liked];

  // Find a matching want/tag
  let matchedWant = '';
  for (const want of allWants) {
    const wantLower = want.toLowerCase();
    for (const tag of itemTags) {
      if (tag.toLowerCase().includes(wantLower) || wantLower.includes(tag.toLowerCase())) {
        matchedWant = want;
        break;
      }
    }
    if (matchedWant) break;
  }

  if (matchedWant) {
    return `Based on what you said about ${matchedWant}, I think you'll love this.`;
  }

  if (profile.wantsNext.length > 0) {
    return `This feels right for where you're at — ${profile.wantsNext[0]}.`;
  }

  // Generic fallback
  return `I think this one will resonate with you.`;
}
