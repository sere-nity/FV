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
}

export default function CreatorShelfPage() {
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
    if (!parsed || parsed.role !== 'creator') {
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
            <h1 className="text-3xl font-bold">My Shelf</h1>
            <p className="text-gray-600 mt-1">Curate items to recommend to your fans</p>
          </div>
          <Link
            href={`/creator/preview?token=${getTokenFromUrl()}`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Preview Fan View
          </Link>
        </div>

        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex gap-2 flex-wrap">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange(type)}
                className={`px-4 py-2 rounded transition-colors ${
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

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Import from:</h3>
          <div className="flex gap-2 flex-wrap">
            <button className="px-3 py-1 bg-gray-200 text-gray-500 rounded cursor-not-allowed">
              Fanvue Posts (coming soon)
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-500 rounded cursor-not-allowed">
              Spotify (coming soon)
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-500 rounded cursor-not-allowed">
              Letterboxd (coming soon)
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-500 rounded cursor-not-allowed">
              Goodreads (coming soon)
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-500 rounded cursor-not-allowed">
              Are.na (coming soon)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="p-4">
                  <div className="text-xs text-gray-500 uppercase mb-1">{item.type}</div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mb-2 block"
                    >
                      View →
                    </a>
                  )}
                  {item.quoteText && (
                    <blockquote className="text-sm italic text-gray-700 border-l-2 border-gray-300 pl-3 mb-2">
                      {item.quoteText}
                    </blockquote>
                  )}
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Your note:</strong> {item.creatorNote}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items yet. Start curating your shelf!</p>
          </div>
        )}
      </div>
    </div>
  );
}
