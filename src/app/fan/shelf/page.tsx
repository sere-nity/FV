'use client';

import { useState, useEffect } from 'react';
import { parseDevToken, getTokenFromUrl, ShelfUser } from '@/lib/auth';
import Link from 'next/link';

interface ShelfItem {
  id: string;
  type: string;
  title: string;
  imageUrl: string | null;
  creatorNote: string;
  url: string | null;
  quoteText: string | null;
  tags: string | null;
  description: string | null;
}

export default function FanShelfPage() {
  const [user, setUser] = useState<ShelfUser | null>(null);
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const types = ['all', 'song', 'playlist', 'film', 'book', 'article', 'place', 'quote', 'other'];

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
    loadShelf(parsed.creatorId);
  }, []);

  const loadShelf = async (creatorId: string, type = 'all') => {
    try {
      const url = `/api/shelf?creatorId=${creatorId}${type !== 'all' ? `&type=${type}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error loading shelf:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    if (user) {
      setLoading(true);
      loadShelf(user.creatorId, type);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading shelf...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Full Shelf</h1>
          <p className="text-gray-600 mt-1">
            Everything {user.creatorHandle} recommends
          </p>
        </div>

        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex gap-2 flex-wrap">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange(type)}
                className={`px-3 py-2 text-sm rounded transition-colors ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => {
            const tags = item.tags ? JSON.parse(item.tags) : [];
            return (
              <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-5">
                  <div className="text-xs text-gray-500 uppercase mb-1">{item.type}</div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>

                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  )}

                  {item.quoteText && (
                    <blockquote className="text-sm italic text-gray-700 border-l-2 border-gray-300 pl-3 mb-3">
                      "{item.quoteText}"
                    </blockquote>
                  )}

                  <div className="text-sm text-gray-700 mb-3">
                    <strong>{user.creatorHandle}:</strong> {item.creatorNote}
                  </div>

                  {tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {tags.slice(0, 4).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items in this category yet.</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href={`/fan?token=${getTokenFromUrl()}`}
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Your Picks
          </Link>
        </div>
      </div>
    </div>
  );
}
