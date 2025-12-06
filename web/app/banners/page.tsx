'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, Edit, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAlertDialog } from '@/components/useAlertDialog';

interface Banner {
  id: number;
  name: string;
  url_pattern: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function BannersPage() {
  const router = useRouter();
  const { showAlert, AlertDialogComponent } = useAlertDialog();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const response = await fetch('/api/banners');
      if (response.ok) {
        const data = await response.json();
        setBanners(data);
      }
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const response = await fetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.is_active }),
      });

      if (response.ok) {
        setBanners(banners.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b));
      } else {
        showAlert({ title: 'Error', description: 'Failed to update banner status' });
      }
    } catch (error) {
      showAlert({ title: 'Error', description: 'Failed to update banner status' });
    }
  };

  const handleDuplicate = async (banner: Banner) => {
    try {
      const response = await fetch(`/api/banners/${banner.id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        loadBanners();
        showAlert({ title: 'Success', description: 'Banner duplicated successfully!' });
      } else {
        showAlert({ title: 'Error', description: 'Failed to duplicate banner' });
      }
    } catch (error) {
      showAlert({ title: 'Error', description: 'Failed to duplicate banner' });
    }
  };

  const handleDelete = async (banner: Banner) => {
    showAlert({
      title: 'Delete Banner',
      description: `Are you sure you want to delete "${banner.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/banners/${banner.id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setBanners(banners.filter(b => b.id !== banner.id));
            showAlert({ title: 'Success', description: 'Banner deleted successfully!' });
          } else {
            showAlert({ title: 'Error', description: 'Failed to delete banner' });
          }
        } catch (error) {
          showAlert({ title: 'Error', description: 'Failed to delete banner' });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <AlertDialogComponent />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create auto-triggered banners that appear when users visit specific pages
            </p>
          </div>
          <Button onClick={() => router.push('/banners/new')}>
            <Plus size={16} className="mr-2" />
            New Banner
          </Button>
        </div>

        {/* Banners List */}
        {banners.length === 0 ? (
          <Empty
            title="No banners yet"
            description="Create your first banner to get started. Banners appear automatically when users visit matching pages."
            action={
              <Button onClick={() => router.push('/banners/new')}>
                <Plus size={16} className="mr-2" />
                Create Banner
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/banners/${banner.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{banner.name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          banner.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      URL Pattern: <code className="bg-gray-100 px-1 rounded">{banner.url_pattern}</code>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created {new Date(banner.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(banner);
                      }}
                    >
                      {banner.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/banners/${banner.id}`);
                        }}>
                          <Edit size={14} className="mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(banner);
                        }}>
                          <Copy size={14} className="mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(banner);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

