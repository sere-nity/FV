'use client';

import { useState, useEffect } from 'react';
import { parseDevToken, getTokenFromUrl, ShelfUser } from '@/lib/auth';
import Link from 'next/link';

interface Pick {
  id: string;
  item: any;
  reason: string;
  score: number;
}

export default function FanPicksPage() {
  const [user, setUser] = useState<ShelfUser | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getTokenFromUrl();
    if (!token) {
      window.location.href = '/dev';
      return;
    }

    const parsed = parseDevToken(token);
    if (!parsed || parsed.role !== 'fan') {
      window.location.href = '/dev';
      return;
    }

    setUser(parsed);
    loadPicks(parsed.fanId!, parsed.creatorId);
  }, []);

  const loadPicks = async (fanId: string, creatorId: string) => {
    try {
      const response = await fetch(
        `/api/picks?fanId=${fanId}&creatorId=${creatorId}&count=3`
      );
      const data = await response.json();
      setPicks(data.picks || []);
      setProfile(data.profile);

      // Mark picks as shown
      for (const pick of data.picks) {
        await fetch('/api/picks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pickId: pick.id, status: 'shown' }),
        });
      }
    } catch (error) {
      console.error('Error loading picks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickClick = async (pickId: string) => {
    try {
      await fetch('/api/picks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickId, status: 'opened' }),
      });
    } catch (error) {
      console.error('Error updating pick status:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading your picks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Picks for You</h1>
          <p className="text-gray-600 mt-1">
            From {user.creatorHandle}, chosen just for you
          </p>
        </div>

        {picks.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              No picks yet. Start chatting with {user.creatorHandle} to get personalized
              recommendations!
            </p>
          </div>
        )}

        <div className="space-y-6">
          {picks.map((pick, idx) => {
            const tags = pick.item.tags ? JSON.parse(pick.item.tags) : [];
            const isSpotify = pick.item.url?.includes('spotify.com');
            const isYouTube = pick.item.url?.includes('youtube.com') || pick.item.url?.includes('youtu.be');

            return (
              <div key={pick.id} className="bg-white rounded-lg shadow overflow-hidden">
                {pick.item.imageUrl && (
                  <img
                    src={pick.item.imageUrl}
                    alt={pick.item.title}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="p-5">
                  <div className="text-xs text-gray-500 uppercase mb-1">
                    Pick #{idx + 1} · {pick.item.type}
                  </div>
                  <h2 className="text-xl font-bold mb-3">{pick.item.title}</h2>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
                    <div className="text-sm text-gray-600 mb-1">
                      From {user.creatorHandle}:
                    </div>
                    <p className="text-gray-800">{pick.item.creatorNote}</p>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-4">
                    <div className="text-sm text-gray-600 mb-1">Why for you:</div>
                    <p className="text-gray-800">{pick.reason}</p>
                  </div>

                  {pick.item.quoteText && (
                    <blockquote className="text-lg italic text-gray-800 border-l-4 border-gray-300 pl-4 py-2 mb-4">
                      "{pick.item.quoteText}"
                    </blockquote>
                  )}

                  {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-4">
                      {tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {pick.item.url && (
                    <a
                      href={pick.item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handlePickClick(pick.id)}
                      className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {pick.item.type === 'song' || pick.item.type === 'playlist'
                        ? 'Listen Now'
                        : pick.item.type === 'film'
                        ? 'Watch Info'
                        : pick.item.type === 'book'
                        ? 'Find Book'
                        : pick.item.type === 'place'
                        ? 'Get Directions'
                        : pick.item.type === 'article'
                        ? 'Read Article'
                        : 'View'}
                    </a>
                  )}

                  {isSpotify && (
                    <div className="mt-4">
                      <iframe
                        src={pick.item.url.replace('open.spotify.com', 'open.spotify.com/embed')}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="encrypted-media"
                        className="rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={`/fan/shelf?token=${getTokenFromUrl()}`}
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Browse Full Shelf
          </Link>
        </div>
      </div>
    </div>
  );
}
