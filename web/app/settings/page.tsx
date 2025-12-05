'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Copy, Check, RefreshCw, Code, Chrome, Building2, Users, UserPlus, Trash2, Crown, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkspaceMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'install' | 'workspace' | 'account'>('install');
  const [installTab, setInstallTab] = useState<'snippet' | 'extension'>('snippet');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const workspaceData = localStorage.getItem('workspace');

    if (!userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    
    if (workspaceData) {
      const ws = JSON.parse(workspaceData);
      setWorkspace(ws);
      fetchMembers(ws.id);
    }
  }, [router]);

  const fetchMembers = async (workspaceId: number) => {
    setLoadingMembers(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
    setLoadingMembers(false);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const getEmbedSnippet = (withUser: boolean = false) => {
    const apiToken = workspace?.apiToken || user?.apiToken || 'YOUR_API_TOKEN';
    
    if (withUser) {
      return `<!-- Walko - Product Tours with User Tracking & Personalization -->
<script>
  window.WalkoConfig = {
    token: '${apiToken}',
    userId: 'YOUR_USER_ID',     // Your app's logged-in user ID
    userName: 'John Doe',       // Full name (for {{userName}} variable)
    firstName: 'John',          // First name (for {{firstName}} variable)
    lastName: 'Doe',            // Last name (for {{lastName}} variable)
    userLocale: 'en'            // User's language (en, uk, pl, es, de, ru, fr, it, ja, zh)
  };
</script>
<script src="https://www.cleaqops.com/embed.js"></script>`;
    }
    
    return `<!-- Walko - Product Tours (Basic) -->
<script 
  src="https://www.cleaqops.com/embed.js" 
  data-token="${apiToken}">
</script>`;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !workspace) return;

    setInviting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      setInviteSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      fetchMembers(workspace.id);
    } catch (err: any) {
      setInviteError(err.message);
    }
    setInviting(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown size={14} className="text-amber-500" />;
      case 'admin': return <Shield size={14} className="text-blue-500" />;
      default: return <User size={14} className="text-gray-400" />;
    }
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
          <p className="text-gray-600 mt-2">
            Manage your workspace, team, and installation options
          </p>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('install')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'install'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Code size={18} />
            Installation
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'workspace'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Building2 size={18} />
            Workspace
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'account'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User size={18} />
            Account
          </button>
        </div>

        {/* Installation Tab */}
        {activeTab === 'install' && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Install Walko</h2>
            <p className="text-gray-600 mb-6">
              Choose how you want to show tours to your users. The embed snippet is recommended for production.
            </p>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setInstallTab('snippet')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  installTab === 'snippet'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Code size={18} />
                Embed Snippet
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Recommended</span>
              </button>
              <button
                onClick={() => setInstallTab('extension')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  installTab === 'extension'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Chrome size={18} />
                Chrome Extension
              </button>
            </div>

            {/* Snippet Tab */}
            {installTab === 'snippet' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Shows tours to ALL visitors</h3>
                  <p className="text-sm text-green-800">
                    Add this snippet once to your website and all your tours will automatically appear to every visitor.
                    No extension required for your users!
                  </p>
                </div>

                {/* Recommended: With User Tracking */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="label mb-0">With User Tracking</label>
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Recommended</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getEmbedSnippet(true), 'snippet-user')}
                    >
                      {copied === 'snippet-user' ? (
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
                    </Button>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
{getEmbedSnippet(true)}
                    </pre>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    👆 Use this to enable "Show Once" across browsers/devices. Replace YOUR_USER_ID with your app's user ID.
                  </p>
                </div>

                {/* Basic: Anonymous */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="label mb-0">Basic (Anonymous)</label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getEmbedSnippet(false), 'snippet-basic')}
                    >
                      {copied === 'snippet-basic' ? (
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
                    </Button>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
{getEmbedSnippet(false)}
                    </pre>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    👆 Simple setup, but "Show Once" only works per browser (uses localStorage).
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 Installation Steps:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li>Copy the embed code above</li>
                    <li>Replace <code className="bg-blue-100 px-1 rounded">YOUR_USER_ID</code> with your logged-in user's ID</li>
                    <li>Paste it into your website's HTML, just before the closing <code className="bg-blue-100 px-1 rounded">&lt;/body&gt;</code> tag</li>
                    <li>Deploy your changes</li>
                    <li>Tours will automatically appear on matching URLs!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Extension Tab */}
            {installTab === 'extension' && (
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
                    <label className="label mb-0">Workspace API Token</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(workspace?.apiToken || user.apiToken, 'token')}
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
                    </Button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <code className="text-sm font-mono text-gray-900 break-all">
                      {workspace?.apiToken || user.apiToken}
                    </code>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 Setup Steps:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li>Download the Walko Chrome extension</li>
                    <li>Click the extension icon in your browser toolbar</li>
                    <li>Paste your API token and click "Connect"</li>
                    <li>Navigate to any website and use "Pick Element" to build tours</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workspace Tab */}
        {activeTab === 'workspace' && (
          <>
            {/* Workspace Info */}
            <div className="card p-6 mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  {workspace?.name?.charAt(0) || 'W'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{workspace?.name || 'My Workspace'}</h2>
                  <p className="text-gray-500 text-sm">/{workspace?.slug}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium mt-2">
                    {getRoleIcon(workspace?.role || 'member')}
                    {workspace?.role?.charAt(0).toUpperCase() + workspace?.role?.slice(1) || 'Member'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Workspace Name</label>
                  <input
                    type="text"
                    className="input"
                    value={workspace?.name || ''}
                    readOnly
                  />
                </div>
                <div>
                  <label className="label">Created</label>
                  <input
                    type="text"
                    className="input"
                    value={workspace?.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : '-'}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Users size={20} />
                  Team Members
                </h2>
              </div>

              {/* Invite Form */}
              {(workspace?.role === 'owner' || workspace?.role === 'admin') && (
                <form onSubmit={handleInvite} className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <UserPlus size={16} />
                    Invite a team member
                  </h3>
                  
                  {inviteSuccess && (
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm mb-3">
                      {inviteSuccess}
                    </div>
                  )}
                  
                  {inviteError && (
                    <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
                      {inviteError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <input
                      type="email"
                      className="input flex-1"
                      placeholder="teammate@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                    <select
                      className="input w-32"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button
                      type="submit"
                      disabled={inviting}
                    >
                      {inviting ? 'Sending...' : 'Invite'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Members List */}
              <div className="space-y-2">
                {loadingMembers ? (
                  <div className="text-center py-4 text-gray-500">Loading members...</div>
                ) : members.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No team members yet</p>
                  </div>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium">
                          {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.name || member.email}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {getRoleIcon(member.role)}
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                        {member.userId === user.id && (
                          <span className="text-xs text-gray-400">(You)</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Danger Zone */}
            {workspace?.role === 'owner' && (
              <div className="card p-6 border-red-200">
                <h2 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h2>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Regenerate API Token</h3>
                    <p className="text-sm text-gray-600">
                      This will invalidate your current token. Update your embed code after regenerating.
                    </p>
                  </div>
                  <button className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2">
                    <RefreshCw size={16} />
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="card p-6">
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
        )}
      </div>
    </DashboardLayout>
  );
}
