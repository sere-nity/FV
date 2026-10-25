import OpenAI from 'openai';
import { TasteProfile } from './types';

/**
 * Extract taste profile from chat messages using LLM
 */
export async function extractProfile(
  messages: { sender: string; text: string }[]
): Promise<TasteProfile> {
  // If no XAI_API_KEY, use deterministic fallback
  if (!process.env.XAI_API_KEY) {
    return extractProfileFallback(messages);
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });

    const fanMessages = messages.filter((m) => m.sender === 'fan');
    const conversationText = fanMessages.map((m) => m.text).join('\n');

    if (!conversationText.trim()) {
      return getEmptyProfileFallback();
    }

    const prompt = `Analyze this fan's chat messages and extract their taste profile.

Messages:
${conversationText}

Extract:
1. What they explicitly liked or enjoyed
2. What they want next (mood, situation, or specific asks)
3. Types of content they're interested in (song, film, book, article, place, quote)
4. Things to avoid (if any mentioned)

Return a JSON object with this structure:
{
  "summary": "2-3 sentence summary of their taste and current situation",
  "liked": ["thing 1", "thing 2"],
  "wantsNext": ["mood or need 1", "mood or need 2"],
  "wantedTypes": ["song", "book", etc],
  "avoid": ["thing to avoid"]
}`;

    const response = await client.chat.completions.create({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts taste profiles from conversations. Be concise and specific.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return extractProfileFallback(messages);
    }

    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || '',
      liked: Array.isArray(parsed.liked) ? parsed.liked : [],
      wantsNext: Array.isArray(parsed.wantsNext) ? parsed.wantsNext : [],
      wantedTypes: Array.isArray(parsed.wantedTypes) ? parsed.wantedTypes : [],
      avoid: Array.isArray(parsed.avoid) ? parsed.avoid : [],
    };
  } catch (error) {
    console.error('Error extracting profile with LLM:', error);
    return extractProfileFallback(messages);
  }
}

/**
 * Deterministic fallback when LLM is unavailable
 */
function extractProfileFallback(
  messages: { sender: string; text: string }[]
): TasteProfile {
  const fanMessages = messages.filter((m) => m.sender === 'fan');

  if (fanMessages.length === 0) {
    return getEmptyProfileFallback();
  }

  const allText = fanMessages.map((m) => m.text.toLowerCase()).join(' ');

  // Simple keyword matching for fallback
  const liked: string[] = [];
  const wantsNext: string[] = [];
  const wantedTypes: string[] = [];
  const avoid: string[] = [];

  // Type detection
  if (allText.includes('song') || allText.includes('music') || allText.includes('listen')) {
    wantedTypes.push('song', 'playlist');
  }
  if (allText.includes('book') || allText.includes('read')) {
    wantedTypes.push('book');
  }
  if (allText.includes('film') || allText.includes('movie') || allText.includes('watch')) {
    wantedTypes.push('film');
  }
  if (allText.includes('travel') || allText.includes('visit') || allText.includes('going to')) {
    wantedTypes.push('place');
  }
  if (allText.includes('article') || allText.includes('read')) {
    wantedTypes.push('article');
  }

  // Mood detection
  if (allText.includes('quiet') || allText.includes('calm') || allText.includes('peaceful')) {
    wantsNext.push('quiet and calm');
  }
  if (allText.includes('sad') || allText.includes('breakup') || allText.includes('heartbreak')) {
    wantsNext.push('emotional support');
  }
  if (allText.includes('uplifting') || allText.includes('happy') || allText.includes('positive')) {
    wantsNext.push('uplifting');
  }
  if (allText.includes('learn') || allText.includes('start') || allText.includes('how to')) {
    wantsNext.push('learning and growth');
  }

  let summary = 'Fan with';
  if (wantedTypes.length > 0) {
    summary += ` interest in ${wantedTypes.slice(0, 2).join(' and ')}`;
  }
  if (wantsNext.length > 0) {
    summary += `, seeking ${wantsNext[0]}`;
  } else {
    summary += ' general interests';
  }
  summary += '.';

  return {
    summary,
    liked,
    wantsNext,
    wantedTypes,
    avoid,
  };
}

function getEmptyProfileFallback(): TasteProfile {
  return {
    summary: 'New fan with no chat history yet.',
    liked: [],
    wantsNext: ['something meaningful', 'connection'],
    wantedTypes: [],
    avoid: [],
  };
}
