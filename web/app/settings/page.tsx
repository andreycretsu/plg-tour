'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Copy, Check, Key, RefreshCw, Code, Chrome, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'extension' | 'snippet'>('snippet');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData || '{}'));
  }, [router]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const getEmbedSnippet = () => {
    return `<!-- TourLayer - Product Tours -->
<script 
  src="https://plg-tour.vercel.app/embed.js" 
  data-token="${user?.apiToken || 'YOUR_API_TOKEN'}">
</script>`;
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
          <p className="text-gray-600 mt-2">Manage your account and installation options</p>
        </div>

        {/* Installation Section */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Install TourLayer</h2>
          <p className="text-gray-600 mb-6">
            Choose how you want to show tours to your users. The embed snippet is recommended for production.
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('snippet')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'snippet'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Code size={18} />
              Embed Snippet
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Recommended</span>
            </button>
            <button
              onClick={() => setActiveTab('extension')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'extension'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Chrome size={18} />
              Chrome Extension
            </button>
          </div>

          {/* Snippet Tab */}
          {activeTab === 'snippet' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Shows tours to ALL visitors</h3>
                <p className="text-sm text-green-800">
                  Add this snippet once to your website and all your tours will automatically appear to every visitor.
                  No extension required for your users!
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Your Embed Code</label>
                  <button
                    onClick={() => copyToClipboard(getEmbedSnippet(), 'snippet')}
                    className="btn btn-secondary btn-sm flex items-center gap-2"
                  >
                    {copied === 'snippet' ? (
                      <>
                        <Check size={14} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
{getEmbedSnippet()}
                  </pre>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Installation Steps:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Copy the embed code above</li>
                  <li>Paste it into your website's HTML, just before the closing <code className="bg-blue-100 px-1 rounded">&lt;/body&gt;</code> tag</li>
                  <li>Deploy your changes</li>
                  <li>Tours will automatically appear on matching URLs!</li>
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">💡 Pro Tips:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                  <li>Tours are shown based on URL patterns you configure</li>
                  <li>Users who complete a tour won't see it again</li>
                  <li>Use <code className="bg-amber-100 px-1 rounded">TourLayer.reset(tourId)</code> in console to show a tour again</li>
                  <li>The script loads asynchronously and won't slow down your site</li>
                </ul>
              </div>
            </div>
          )}

          {/* Extension Tab */}
          {activeTab === 'extension' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-purple-900 mb-2">🔧 For Building Tours</h3>
                <p className="text-sm text-purple-800">
                  The Chrome extension is used to BUILD tours with the visual element picker.
                  It's for you and your team, not your end users.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">API Token</label>
                  <button
                    onClick={() => copyToClipboard(user.apiToken, 'token')}
                    className="btn btn-secondary btn-sm flex items-center gap-2"
                  >
                    {copied === 'token' ? (
                      <>
                        <Check size={14} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Token
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <code className="text-sm font-mono text-gray-900 break-all">
                    {user.apiToken}
                  </code>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Setup Steps:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Download the TourLayer Chrome extension</li>
                  <li>Click the extension icon in your browser toolbar</li>
                  <li>Paste your API token and click "Connect"</li>
                  <li>Navigate to any website and use "Pick Element" to build tours</li>
                </ol>
              </div>
            </div>
          )}
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
                This will invalidate your current token. You'll need to update your embed code and extension.
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
