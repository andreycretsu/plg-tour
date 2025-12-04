'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface InviteInfo {
  workspaceName: string;
  workspaceSlug: string;
  email: string;
  role: string;
  inviterName: string;
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  // New user form
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);

  useEffect(() => {
    fetchInviteInfo();
  }, [params.token]);

  const fetchInviteInfo = async () => {
    try {
      const response = await fetch(`/api/invite/${params.token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid or expired invite');
      }

      setInviteInfo(data);
      setIsNewUser(!data.existingUser);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccepting(true);
    setError('');

    try {
      const response = await fetch(`/api/invite/${params.token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invite');
      }

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('workspace', JSON.stringify(data.workspace));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
    setAccepting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="card p-8 max-w-md text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button asChild>
            <Link href="/login">
              Go to Login
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎯 TourLayer</h1>
          <p className="text-gray-600 mt-2">You've been invited!</p>
        </div>

        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              {inviteInfo?.workspaceName?.charAt(0) || 'W'}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Join {inviteInfo?.workspaceName}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              You're invited as a {inviteInfo?.role}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {isNewUser ? (
            <form onSubmit={handleAccept} className="space-y-4">
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                Create your account to join the workspace.
              </p>
              
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input bg-gray-100"
                  value={inviteInfo?.email || ''}
                  readOnly
                />
              </div>

              <div>
                <label className="label">Your Name</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="label">Create Password</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={accepting}
              >
                {accepting ? 'Joining...' : 'Create Account & Join'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAccept} className="space-y-4">
              <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                You already have an account. Click below to join this workspace.
              </p>

              <Button
                type="submit"
                className="w-full"
                disabled={accepting}
              >
                {accepting ? 'Joining...' : 'Join Workspace'}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

