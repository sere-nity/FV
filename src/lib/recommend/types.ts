import { ShelfItem } from '@prisma/client';

export interface TasteProfile {
  summary: string;
  liked: string[];
  wantsNext: string[];
  wantedTypes: string[];
  avoid: string[];
}

export interface ScoredItem {
  item: ShelfItem;
  score: number;
  breakdown: {
    typeMatch: number;
    tagMatch: number;
    avoidPenalty: number;
    varietyBonus: number;
    alreadyPickedPenalty: number;
    embeddingSimilarity?: number;
  };
}

export interface Pick {
  item: ShelfItem;
  reason: string;
  score: number;
}

export interface RecommendationEngine {
  /**
   * Extract taste profile from chat messages
   */
  extractProfile(messages: { sender: string; text: string }[]): Promise<TasteProfile>;

  /**
   * Score all shelf items for a fan
   */
  scoreItems(
    profile: TasteProfile,
    shelfItems: ShelfItem[],
    alreadyPickedIds: string[]
  ): Promise<ScoredItem[]>;

  /**
   * Generate explanation for a pick
   */
  explainPick(
    item: ShelfItem,
    profile: TasteProfile,
    fanName: string
  ): Promise<string>;
}
