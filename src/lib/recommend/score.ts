import { ShelfItem } from '@prisma/client';
import { TasteProfile, ScoredItem } from './types';

/**
 * Score all shelf items against a taste profile
 * Pure code scoring - no LLM needed
 */
export async function scoreItems(
  profile: TasteProfile,
  shelfItems: ShelfItem[],
  alreadyPickedIds: string[]
): Promise<ScoredItem[]> {
  const scored: ScoredItem[] = [];

  for (const item of shelfItems) {
    const score = calculateScore(item, profile, alreadyPickedIds);
    scored.push({
      item,
      score: score.total,
      breakdown: score.breakdown,
    });
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

interface ScoreResult {
  total: number;
  breakdown: {
    typeMatch: number;
    tagMatch: number;
    avoidPenalty: number;
    varietyBonus: number;
    alreadyPickedPenalty: number;
    embeddingSimilarity?: number;
  };
}

function calculateScore(
  item: ShelfItem,
  profile: TasteProfile,
  alreadyPickedIds: string[]
): ScoreResult {
  let score = 0;
  const breakdown = {
    typeMatch: 0,
    tagMatch: 0,
    avoidPenalty: 0,
    varietyBonus: 0,
    alreadyPickedPenalty: 0,
  };

  // Base score
  score = 50;

  // Type match (+20 if matches wanted types)
  if (profile.wantedTypes.length > 0) {
    if (profile.wantedTypes.includes(item.type)) {
      breakdown.typeMatch = 20;
      score += 20;
    }
  } else {
    // If no specific types wanted, slight bonus to variety
    breakdown.typeMatch = 5;
    score += 5;
  }

  // Tag/mood match (+15 per match, max 30)
  const itemTags = item.tags ? JSON.parse(item.tags) : [];
  const allWants = [...profile.wantsNext, ...profile.liked].map((w) =>
    w.toLowerCase()
  );

  let tagMatches = 0;
  for (const tag of itemTags) {
    const tagLower = tag.toLowerCase();
    for (const want of allWants) {
      if (
        tagLower.includes(want) ||
        want.includes(tagLower) ||
        levenshteinSimilarity(tagLower, want) > 0.7
      ) {
        tagMatches++;
        break;
      }
    }
  }
  breakdown.tagMatch = Math.min(tagMatches * 15, 30);
  score += breakdown.tagMatch;

  // Note relevance (+10 if note mentions wants)
  const noteLower = item.creatorNote.toLowerCase();
  for (const want of allWants) {
    if (noteLower.includes(want)) {
      score += 10;
      breakdown.tagMatch += 10;
      break;
    }
  }

  // Avoid penalty (-50 per avoid match)
  for (const avoidItem of profile.avoid) {
    const avoidLower = avoidItem.toLowerCase();
    const itemText = `${item.title} ${item.description || ''} ${
      item.creatorNote
    } ${itemTags.join(' ')}`.toLowerCase();

    if (
      itemText.includes(avoidLower) ||
      avoidLower.includes(item.type.toLowerCase())
    ) {
      breakdown.avoidPenalty -= 50;
      score -= 50;
    }
  }

  // Already picked penalty (-30)
  if (alreadyPickedIds.includes(item.id)) {
    breakdown.alreadyPickedPenalty = -30;
    score -= 30;
  }

  // Variety bonus for diverse types (placeholder for multi-pick scenarios)
  // Could be enhanced to check existing picks in a session
  breakdown.varietyBonus = 0;

  return {
    total: Math.max(score, 0),
    breakdown,
  };
}

/**
 * Simple Levenshtein-based similarity for fuzzy matching
 */
function levenshteinSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s2.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s1.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(j - 1) !== s2.charAt(i - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s1.length] = lastValue;
    }
  }
  return costs[s1.length];
}
