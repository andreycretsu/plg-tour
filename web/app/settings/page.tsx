'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Copy, Check, Key, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData || '{}'));
  }, [router]);

  const copyToken = () => {
    navigator.clipboard.writeText(user?.apiToken || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and API access</p>
        </div>

        {/* API Token Section */}
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Key className="text-primary-600" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">API Token</h2>
              <p className="text-gray-600 mb-4">
                Use this token to connect the Chrome extension to your account.
                Copy and paste it into the extension popup.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between gap-4">
                  <code className="text-sm font-mono text-gray-900 break-all">
                    {user.apiToken}
                  </code>
                  <button
                    onClick={copyToken}
                    className="btn btn-secondary flex items-center gap-2 flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📌 How to use:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Install the TourLayer Chrome extension</li>
                  <li>Click the extension icon in your browser toolbar</li>
                  <li>Paste this API token into the input field</li>
                  <li>Click "Save" to connect</li>
                  <li>Your tours will now appear on matching websites!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                className="input"
                value={user.name}
                readOnly
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={user.email}
                readOnly
              />
            </div>

            <div>
              <label className="label">Member Since</label>
              <input
                type="text"
                className="input"
                value={new Date(user.createdAt).toLocaleDateString()}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-6 border-red-200">
          <h2 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Regenerate API Token</h3>
              <p className="text-sm text-gray-600">
                This will invalidate your current token. You'll need to update your extension.
              </p>
            </div>
            <button className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2">
              <RefreshCw size={16} />
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

