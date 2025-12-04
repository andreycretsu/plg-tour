'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Search, Trash2, Eye, EyeOff, Copy, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ToursPage() {
  const router = useRouter();
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');

    if (!userData) {
      router.push('/login');
      return;
    }

    fetch('/api/tours')
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          return [];
        }
        return res.json();
      })
      .then((data) => {
        setTours(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const filteredTours = tours.filter((tour) =>
    tour.name.toLowerCase().includes(search.toLowerCase()) ||
    tour.url_pattern.toLowerCase().includes(search.toLowerCase())
  );

  const toggleActive = async (tourId: number, currentState: boolean) => {
    try {
      await fetch(`/api/tours/${tourId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentState }),
      });

      setTours(tours.map(t => 
        t.id === tourId ? { ...t, is_active: !currentState } : t
      ));
    } catch (error) {
      console.error('Failed to toggle tour:', error);
    }
  };

  const deleteTour = async (tourId: number) => {
    if (!confirm('Are you sure you want to delete this tour?')) return;
    
    await fetch(`/api/tours/${tourId}`, {
      method: 'DELETE',
    });

    setTours(tours.filter((t) => t.id !== tourId));
  };

  const duplicateTour = async (tourId: number) => {
    try {
      const response = await fetch(`/api/tours/${tourId}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new tour to the list
        setTours([data.tour, ...tours]);
      }
    } catch (error) {
      console.error('Failed to duplicate tour:', error);
    }
  };

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tours</h1>
            <p className="text-gray-600 mt-2">Manage your product tours</p>
          </div>
          <Link href="/tours/new" className="btn btn-primary flex items-center gap-2">
            <Plus size={20} />
            Create Tour
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tours..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tours Table */}
        {filteredTours.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-gray-400 mb-4">No tours found</div>
            {tours.length === 0 && (
              <Link href="/tours/new" className="btn btn-primary inline-flex items-center gap-2">
                <Plus size={20} />
                Create Your First Tour
              </Link>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    URL Pattern
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{tour.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{tour.url_pattern}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          tour.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {tour.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                        {tour.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {new Date(tour.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActive(tour.id, tour.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            tour.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={tour.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {tour.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                          onClick={() => duplicateTour(tour.id)}
                          className="text-purple-600 hover:text-purple-700 p-2"
                          title="Duplicate"
                        >
                          <Copy size={16} />
                        </button>
                        <Link
                          href={`/tours/${tour.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteTour(tour.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

