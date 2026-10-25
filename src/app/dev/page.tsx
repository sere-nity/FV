'use client';

import { useState } from 'react';

export default function DevAuthPage() {
  const [selectedUser, setSelectedUser] = useState('');
  const [role, setRole] = useState<'fan' | 'creator'>('fan');

  const fanUsers = [
    { uuid: 'sam-uuid-001', name: 'Sam' },
    { uuid: 'priya-uuid-001', name: 'Priya' },
    { uuid: 'leo-uuid-001', name: 'Leo' },
    { uuid: 'jess-uuid-001', name: 'Jess' },
    { uuid: 'alex-uuid-001', name: 'Alex' },
    { uuid: 'maya-uuid-002', name: 'Maya K' },
    { uuid: 'taylor-uuid-001', name: 'Taylor' },
    { uuid: 'chris-uuid-001', name: 'Chris' },
    { uuid: 'emma-uuid-001', name: 'Emma' },
    { uuid: 'jordan-uuid-001', name: 'Jordan' },
    { uuid: 'riley-uuid-001', name: 'Riley (empty chat)' },
    { uuid: 'morgan-uuid-001', name: 'Morgan (empty chat)' },
  ];

  const creatorUsers = [{ uuid: 'maya-uuid-001', name: 'Maya (Creator)' }];

  const handleAuth = async (fanvueUserUuid: string) => {
    try {
      const response = await fetch('/api/dev/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fanvueUserUuid, role }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const { token } = await response.json();

      if (role === 'creator') {
        window.location.href = `/creator?token=${token}`;
      } else {
        window.location.href = `/fan?token=${token}`;
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Failed to authenticate');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Shelf Dev Auth</h1>
          <p className="text-gray-600 mb-6">
            Bypass Fanvue auth for local testing. Select a user from the seed data.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Role</label>
            <div className="flex gap-4">
              <button
                onClick={() => setRole('fan')}
                className={`px-4 py-2 rounded ${
                  role === 'fan'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Fan
              </button>
              <button
                onClick={() => setRole('creator')}
                className={`px-4 py-2 rounded ${
                  role === 'creator'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Creator
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Select User
            </label>
            <div className="space-y-2">
              {(role === 'fan' ? fanUsers : creatorUsers).map((user) => (
                <button
                  key={user.uuid}
                  onClick={() => handleAuth(user.uuid)}
                  className="w-full text-left px-4 py-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {user.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This endpoint is only available in
              development. In production, users authenticate via Fanvue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
