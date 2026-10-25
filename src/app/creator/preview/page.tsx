'use client';

import { useState, useEffect } from 'react';
import { parseDevToken, getTokenFromUrl, ShelfUser } from '@/lib/auth';
import Link from 'next/link';

interface Fan {
  id: string;
  displayName: string;
  fanvueUserUuid: string;
  _count: { messages: number };
  tasteProfile: any;
}

interface Pick {
  id: string;
  item: any;
  reason: string;
  score: number;
  breakdown: any;
}

export default function CreatorPreviewPage() {
  const [user, setUser] = useState<ShelfUser | null>(null);
  const [fans, setFans] = useState<Fan[]>([]);
  const [selectedFan, setSelectedFan] = useState<Fan | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const token = getTokenFromUrl();
    if (!token) {
      window.location.href = '/dev';
      return;
    }

    const parsed = parseDevToken(token);
    if (!parsed || parsed.role !== 'creator') {
      window.location.href = '/dev';
      return;
    }

    setUser(parsed);
    loadFans(parsed.creatorId);
  }, []);

  const loadFans = async (creatorId: string) => {
    try {
      const response = await fetch(`/api/fans?creatorId=${creatorId}`);
      const data = await response.json();
      setFans(data.fans || []);
    } catch (error) {
      console.error('Error loading fans:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePicks = async (fan: Fan) => {
    setSelectedFan(fan);
    setGenerating(true);
    setPicks([]);
    setProfile(null);

    try {
      const response = await fetch(
        `/api/picks?fanId=${fan.id}&creatorId=${user!.creatorId}&count=3`
      );
      const data = await response.json();
      setPicks(data.picks || []);
      setProfile(data.profile);
    } catch (error) {
      console.error('Error generating picks:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fan Preview</h1>
            <p className="text-gray-600 mt-1">
              See how picks are personalized for each fan
            </p>
          </div>
          <Link
            href={`/creator?token=${getTokenFromUrl()}`}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            ← Back to My Shelf
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-4">Select a Fan</h2>
              <div className="space-y-2">
                {fans.map((fan) => (
                  <button
                    key={fan.id}
                    onClick={() => generatePicks(fan)}
                    className={`w-full text-left px-4 py-3 rounded border transition-colors ${
                      selectedFan?.id === fan.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{fan.displayName}</div>
                    <div className="text-sm text-gray-500">
                      {fan._count.messages} messages
                      {fan._count.messages === 0 && ' (empty chat)'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!selectedFan && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">Select a fan to preview their picks</p>
              </div>
            )}

            {generating && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">Generating picks for {selectedFan?.displayName}...</p>
              </div>
            )}

            {selectedFan && !generating && profile && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="font-semibold mb-3">Taste Profile</h2>
                  <p className="text-gray-700 mb-4">{profile.summary}</p>
                  {profile.wantsNext && profile.wantsNext.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        Wants next:
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {profile.wantsNext.map((want: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            {want}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.wantedTypes && profile.wantedTypes.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        Interested in:
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {profile.wantedTypes.map((type: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="font-semibold mb-4">
                    Top 3 Picks for {selectedFan.displayName}
                  </h2>
                  <div className="space-y-4">
                    {picks.map((pick, idx) => (
                      <div key={pick.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex gap-4">
                          {pick.item.imageUrl && (
                            <img
                              src={pick.item.imageUrl}
                              alt={pick.item.title}
                              className="w-24 h-24 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 uppercase">
                              #{idx + 1} · {pick.item.type}
                            </div>
                            <h3 className="font-semibold mb-1">{pick.item.title}</h3>
                            <div className="text-sm text-gray-700 mb-2">
                              <strong>Your note:</strong> {pick.item.creatorNote}
                            </div>
                            <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                              <strong>Why for {selectedFan.displayName}:</strong> {pick.reason}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Score: {pick.score.toFixed(1)} (type: {pick.breakdown.typeMatch}, 
                              tags: {pick.breakdown.tagMatch})
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
