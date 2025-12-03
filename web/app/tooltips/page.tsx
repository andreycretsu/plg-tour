'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, MessageCircle, Trash2, Edit, ToggleLeft, ToggleRight, MousePointer, Hand } from 'lucide-react';

interface Tooltip {
  id: number;
  name: string;
  url_pattern: string;
  selector: string;
  is_active: boolean;
  trigger_type: string;
  icon_type: string;
  title: string;
  created_at: string;
}

export default function TooltipsPage() {
  const router = useRouter();
  const [tooltips, setTooltips] = useState<Tooltip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTooltips();
  }, []);

  const fetchTooltips = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tooltips', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTooltips(data);
      }
    } catch (error) {
      console.error('Failed to fetch tooltips:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: number, currentState: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/tooltips/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentState }),
      });

      setTooltips(tooltips.map(t => 
        t.id === id ? { ...t, is_active: !currentState } : t
      ));
    } catch (error) {
      console.error('Failed to toggle tooltip:', error);
    }
  };

  const deleteTooltip = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tooltip?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/tooltips/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setTooltips(tooltips.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete tooltip:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tooltips</h1>
            <p className="text-gray-600 mt-2">
              Single-step hints with pulsating beacons
            </p>
          </div>
          <Link
            href="/tooltips/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            New Tooltip
          </Link>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <MessageCircle className="text-purple-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-purple-900">What are Tooltips?</h3>
              <p className="text-sm text-purple-700 mt-1">
                Tooltips are single-step hints that appear next to elements with a pulsating beacon. 
                They can be triggered on hover or click, perfect for contextual help and feature discovery.
              </p>
            </div>
          </div>
        </div>

        {/* Tooltips List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading tooltips...</p>
          </div>
        ) : tooltips.length === 0 ? (
          <div className="card p-12 text-center">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No tooltips yet</h2>
            <p className="text-gray-500 mb-6">
              Create your first tooltip to add contextual hints to your product.
            </p>
            <Link
              href="/tooltips/new"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Create Tooltip
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tooltips.map((tooltip) => (
              <div
                key={tooltip.id}
                className="card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tooltip.is_active 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <MessageCircle size={20} />
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{tooltip.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          tooltip.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {tooltip.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                          {tooltip.trigger_type === 'hover' ? (
                            <><Hand size={10} /> Hover</>
                          ) : (
                            <><MousePointer size={10} /> Click</>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {tooltip.title} • {tooltip.url_pattern}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(tooltip.id, tooltip.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        tooltip.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={tooltip.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {tooltip.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <Link
                      href={`/tooltips/${tooltip.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => deleteTooltip(tooltip.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

