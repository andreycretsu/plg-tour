'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Target, Eye, Route, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [tooltips, setTooltips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');

    if (!userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));

    // Fetch tours and tooltips
    Promise.all([
      fetch('/api/tours')
        .then((res) => {
          if (res.status === 401) {
            router.push('/login');
            return [];
          }
          return res.json();
        })
        .catch(() => []),
      fetch('/api/tooltips')
        .then((res) => {
          if (res.status === 401) {
            return [];
          }
          return res.json();
        })
        .catch(() => [])
    ]).then(([toursData, tooltipsData]) => {
      setTours(toursData || []);
      setTooltips(tooltipsData || []);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  const activeTours = tours.filter((t) => t.is_active).length;
  const activeTooltips = tooltips.filter((t) => t.is_active).length;
  const totalItems = tours.length + tooltips.length;

  // Combine and sort recent items
  const recentItems = [
    ...tours.map(t => ({ ...t, type: 'tour' })),
    ...tooltips.map(t => ({ ...t, type: 'tooltip' }))
  ]
    .sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your product tours and tooltips, track engagement
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tours</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tours.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tours</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTours}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tooltips</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tooltips.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tooltips</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTooltips}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/tours/new">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Plus className="text-primary" size={24} />
                    </div>
                    <div>
                      <CardTitle>Create New Tour</CardTitle>
                      <CardDescription>Build an interactive tour</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/tooltips/new">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <CardTitle>Create New Tooltip</CardTitle>
                      <CardDescription>Add contextual help</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Items</h2>
            <div className="flex gap-4">
              <Link href="/tours" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all tours →
              </Link>
              <Link href="/tooltips" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all tooltips →
              </Link>
            </div>
          </div>

          {recentItems.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Route />
                    </EmptyMedia>
                    <EmptyTitle>No Items Yet</EmptyTitle>
                    <EmptyDescription>
                      Create your first product tour or tooltip to get started.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <div className="flex gap-2">
                      <Button asChild>
                        <Link href="/tours/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Tour
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/tooltips/new">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Create Tooltip
                        </Link>
                      </Button>
                    </div>
                  </EmptyContent>
                </Empty>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentItems.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {item.type === 'tour' ? (
                            <Route className="h-5 w-5 text-primary" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.name || item.title}</h3>
                            <p className="text-sm text-gray-600">{item.url_pattern || item.selector}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                            {item.type === 'tour' ? 'Tour' : 'Tooltip'}
                          </span>
                          <Link
                            href={item.type === 'tour' ? `/tours/${item.id}` : `/tooltips/${item.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Edit →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
