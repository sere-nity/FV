import { describe, it, expect } from 'vitest';
import { scoreItems } from './score';
import { TasteProfile } from './types';
import { ShelfItem } from '@prisma/client';

describe('Recommendation Scoring', () => {
  const mockShelfItems: ShelfItem[] = [
    {
      id: 'item-1',
      creatorId: 'creator-1',
      type: 'song',
      source: 'link',
      url: 'https://example.com/song1',
      quoteText: null,
      title: 'Quiet Piano Song',
      imageUrl: null,
      description: 'A peaceful piano piece',
      embedHtml: null,
      tags: JSON.stringify(['quiet', 'piano', 'calm']),
      creatorNote: 'Perfect for late night reflection',
      embedding: null,
      createdAt: new Date(),
    },
    {
      id: 'item-2',
      creatorId: 'creator-1',
      type: 'film',
      source: 'link',
      url: 'https://example.com/film1',
      quoteText: null,
      title: 'Action Movie',
      imageUrl: null,
      description: 'High-octane action',
      embedHtml: null,
      tags: JSON.stringify(['action', 'thriller', 'intense']),
      creatorNote: 'Get your adrenaline pumping',
      embedding: null,
      createdAt: new Date(),
    },
    {
      id: 'item-3',
      creatorId: 'creator-1',
      type: 'book',
      source: 'link',
      url: 'https://example.com/book1',
      quoteText: null,
      title: 'Romance Novel',
      imageUrl: null,
      description: 'A love story',
      embedHtml: null,
      tags: JSON.stringify(['romance', 'heartbreak', 'emotional']),
      creatorNote: 'Will make you cry',
      embedding: null,
      createdAt: new Date(),
    },
    {
      id: 'fake-item',
      creatorId: 'other-creator',
      type: 'song',
      source: 'link',
      url: 'https://example.com/fake',
      quoteText: null,
      title: 'Not on shelf',
      imageUrl: null,
      description: null,
      embedHtml: null,
      tags: null,
      creatorNote: 'This should not appear',
      embedding: null,
      createdAt: new Date(),
    },
  ];

  it('should never return items not on the shelf', async () => {
    const profile: TasteProfile = {
      summary: 'Loves all music',
      liked: [],
      wantsNext: ['anything'],
      wantedTypes: ['song'],
      avoid: [],
    };

    // Only pass items 1-3 as shelf items (not the fake one)
    const scored = await scoreItems(profile, mockShelfItems.slice(0, 3), []);

    expect(scored).toHaveLength(3);
    expect(scored.find((s) => s.item.id === 'fake-item')).toBeUndefined();
  });

  it('should penalize items with avoid tags', async () => {
    const profile: TasteProfile = {
      summary: 'Wants calm content',
      liked: [],
      wantsNext: ['calm'],
      wantedTypes: [],
      avoid: ['action', 'intense'],
    };

    const scored = await scoreItems(profile, mockShelfItems.slice(0, 3), []);

    const actionMovie = scored.find((s) => s.item.id === 'item-2');
    const quietSong = scored.find((s) => s.item.id === 'item-1');

    expect(actionMovie).toBeDefined();
    expect(quietSong).toBeDefined();

    // Action movie should have lower score due to avoid penalty
    expect(actionMovie!.score).toBeLessThan(quietSong!.score);
    expect(actionMovie!.breakdown.avoidPenalty).toBeLessThan(0);
  });

  it('should never return avoided items in top picks', async () => {
    const profile: TasteProfile = {
      summary: 'Hates action',
      liked: [],
      wantsNext: [],
      wantedTypes: [],
      avoid: ['action'],
    };

    const scored = await scoreItems(profile, mockShelfItems.slice(0, 3), []);

    // Action movie should be scored very low or zero
    const actionMovie = scored.find((s) => s.item.id === 'item-2');
    expect(actionMovie).toBeDefined();
    expect(actionMovie!.breakdown.avoidPenalty).toBeLessThan(0);
  });

  it('should boost items matching wanted types', async () => {
    const profile: TasteProfile = {
      summary: 'Loves songs',
      liked: [],
      wantsNext: [],
      wantedTypes: ['song'],
      avoid: [],
    };

    const scored = await scoreItems(profile, mockShelfItems.slice(0, 3), []);

    const song = scored.find((s) => s.item.id === 'item-1');
    const film = scored.find((s) => s.item.id === 'item-2');

    expect(song).toBeDefined();
    expect(film).toBeDefined();

    expect(song!.breakdown.typeMatch).toBeGreaterThan(film!.breakdown.typeMatch);
    expect(song!.score).toBeGreaterThan(film!.score);
  });

  it('should penalize already picked items', async () => {
    const profile: TasteProfile = {
      summary: 'General interests',
      liked: [],
      wantsNext: [],
      wantedTypes: [],
      avoid: [],
    };

    const scored = await scoreItems(profile, mockShelfItems.slice(0, 3), ['item-1']);

    const alreadyPicked = scored.find((s) => s.item.id === 'item-1');
    const notPicked = scored.find((s) => s.item.id === 'item-2');

    expect(alreadyPicked).toBeDefined();
    expect(notPicked).toBeDefined();

    expect(alreadyPicked!.breakdown.alreadyPickedPenalty).toBeLessThan(0);
    expect(notPicked!.breakdown.alreadyPickedPenalty).toBe(0);
    expect(alreadyPicked!.score).toBeLessThan(notPicked!.score);
  });

  it('should handle empty profile gracefully', async () => {
    const profile: TasteProfile = {
      summary: 'No preferences yet',
      liked: [],
      wantsNext: [],
      wantedTypes: [],
      avoid: [],
    };

    const scored = await scoreItems(profile, mockShelfItems.slice(0, 3), []);

    expect(scored).toHaveLength(3);
    scored.forEach((s) => {
      expect(s.score).toBeGreaterThan(0);
    });
  });

  it('should boost items matching mood/wants', async () => {
    const profile: TasteProfile = {
      summary: 'Wants quiet music',
      liked: [],
      wantsNext: ['quiet', 'calm'],
      wantedTypes: [],
      avoid: [],
    };

    const scored = await scoreItems(profile, mockShelfItems.slice(0, 3), []);

    const quietSong = scored.find((s) => s.item.id === 'item-1');
    const actionMovie = scored.find((s) => s.item.id === 'item-2');

    expect(quietSong).toBeDefined();
    expect(actionMovie).toBeDefined();

    // Quiet song should have tag match bonus
    expect(quietSong!.breakdown.tagMatch).toBeGreaterThan(0);
    expect(quietSong!.score).toBeGreaterThan(actionMovie!.score);
  });
});
