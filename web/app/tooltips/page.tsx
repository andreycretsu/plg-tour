'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, MessageCircle, Trash2, Edit, ToggleLeft, ToggleRight, MousePointer, Hand, Copy, Sparkles, Eye } from 'lucide-react';
import { Banner, PromoBanner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

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
  const [showPromoBanner, setShowPromoBanner] = useState(true);

  useEffect(() => {
    fetchTooltips();
  }, []);

  const fetchTooltips = async () => {
    try {
      const response = await fetch('/api/tooltips');

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
      await fetch(`/api/tooltips/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
      await fetch(`/api/tooltips/${id}`, {
        method: 'DELETE',
      });

      setTooltips(tooltips.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete tooltip:', error);
    }
  };

  const duplicateTooltip = async (id: number) => {
    try {
      const response = await fetch(`/api/tooltips/${id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new tooltip to the list
        setTooltips([data.tooltip, ...tooltips]);
      }
    } catch (error) {
      console.error('Failed to duplicate tooltip:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Promotional Banner */}
        {showPromoBanner && (
          <PromoBanner
            className="mb-6 shadow-sm"
            icon={<Sparkles className="h-5 w-5 text-emerald-600" />}
            linkText="Learn more"
            linkHref="/docs"
            actionText="Try Analytics"
            onAction={() => router.push('/dashboard')}
            onDismiss={() => setShowPromoBanner(false)}
          >
            New: <strong>Analytics Dashboard</strong> is now available! Track tooltip engagement.
          </PromoBanner>
        )}

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
        <Banner
          variant="info"
          className="mb-6 rounded-xl"
          icon={<MessageCircle className="h-5 w-5" />}
          dismissible={false}
        >
          <div>
            <strong>What are Tooltips?</strong>{" "}
            <span className="text-blue-700">
              Tooltips are single-step hints that appear next to elements with a pulsating beacon. 
              They can be triggered on hover or click, perfect for contextual help and feature discovery.
            </span>
          </div>
        </Banner>

        {/* Tooltips List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading tooltips...</p>
          </div>
        ) : tooltips.length === 0 ? (
          <Empty className="card border border-dashed py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageCircle />
              </EmptyMedia>
              <EmptyTitle>No Tooltips Yet</EmptyTitle>
              <EmptyDescription>
                Create your first tooltip to add contextual hints and feature discovery to your product.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/tooltips/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tooltip
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
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
                    <button
                      onClick={() => duplicateTooltip(tooltip.id)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={18} />
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

