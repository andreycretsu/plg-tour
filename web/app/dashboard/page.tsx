'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Target, Eye } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData || '{}'));

    // Fetch tours
    fetch('/api/tours', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setTours(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your product tours and track engagement
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tours</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{tours.length}</p>
              </div>
              <Target className="text-primary-500" size={40} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Tours</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {tours.filter((t) => t.is_active).length}
                </p>
              </div>
              <Eye className="text-green-500" size={40} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Views</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <Eye className="text-blue-500" size={40} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/tours/new" className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Plus className="text-primary-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Create New Tour</h3>
                  <p className="text-sm text-gray-600">Build an interactive tour</p>
                </div>
              </div>
            </Link>

            <Link href="/settings" className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Get API Token</h3>
                  <p className="text-sm text-gray-600">Connect Chrome extension</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Tours */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Tours</h2>
            <Link href="/tours" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all →
            </Link>
          </div>

          {tours.length === 0 ? (
            <div className="card p-12 text-center">
              <Target className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tours yet</h3>
              <p className="text-gray-600 mb-6">Create your first tour to get started</p>
              <Link href="/tours/new" className="btn btn-primary">
                <Plus size={20} />
                Create Tour
              </Link>
            </div>
          ) : (
            <div className="card divide-y">
              {tours.slice(0, 5).map((tour) => (
                <div key={tour.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{tour.name}</h3>
                      <p className="text-sm text-gray-600">{tour.url_pattern}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tour.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {tour.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <Link
                        href={`/tours/${tour.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Edit →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

