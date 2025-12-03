'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Code, Chrome, Zap, Shield, Eye, Settings, ChevronRight, ExternalLink } from 'lucide-react';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Zap },
    { id: 'embed-snippet', title: 'Embed Snippet', icon: Code },
    { id: 'chrome-extension', title: 'Chrome Extension', icon: Chrome },
    { id: 'creating-tours', title: 'Creating Tours', icon: Eye },
    { id: 'url-patterns', title: 'URL Patterns', icon: Settings },
    { id: 'api-reference', title: 'API Reference', icon: Shield },
  ];

  return (
    <DashboardLayout>
      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h2>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <section.icon size={18} />
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-3xl">
          {activeSection === 'getting-started' && (
            <div className="prose prose-blue max-w-none">
              <h1>Getting Started with TourLayer</h1>
              <p className="lead">
                TourLayer helps you create interactive product tours that guide users through your application.
                Get started in minutes with our simple installation process.
              </p>

              <h2>Quick Start</h2>
              <ol>
                <li><strong>Create your account</strong> - Sign up and get your API token</li>
                <li><strong>Install TourLayer</strong> - Add the embed snippet to your website</li>
                <li><strong>Build tours</strong> - Use our Chrome extension to create tours visually</li>
                <li><strong>Go live!</strong> - Tours automatically appear to your users</li>
              </ol>

              <h2>Two Ways to Install</h2>
              
              <div className="not-prose grid gap-4 my-6">
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    <Code size={20} />
                    Embed Snippet (Recommended)
                  </h3>
                  <p className="text-green-800 text-sm mt-2">
                    Add a single script tag to your website. Tours will appear to ALL visitors automatically.
                    Best for production use.
                  </p>
                </div>

                <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                    <Chrome size={20} />
                    Chrome Extension
                  </h3>
                  <p className="text-purple-800 text-sm mt-2">
                    Install our Chrome extension to BUILD tours using a visual element picker.
                    Required for creating tours, optional for viewing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'embed-snippet' && (
            <div className="prose prose-blue max-w-none">
              <h1>Embed Snippet Installation</h1>
              <p className="lead">
                The embed snippet is the easiest way to show tours to all your users.
                Just add one script tag and you're done!
              </p>

              <h2>Installation</h2>
              <p>Add this code to your website, just before the closing <code>&lt;/body&gt;</code> tag:</p>

              <div className="not-prose bg-slate-900 rounded-lg p-4 my-4">
                <pre className="text-sm text-green-400 font-mono overflow-x-auto">
{`<!-- TourLayer - Product Tours -->
<script 
  src="https://plg-tour.vercel.app/embed.js" 
  data-token="YOUR_API_TOKEN">
</script>`}
                </pre>
              </div>

              <p>Replace <code>YOUR_API_TOKEN</code> with your actual token from the Settings page.</p>

              <h2>How It Works</h2>
              <ol>
                <li>The script loads asynchronously (won't slow down your page)</li>
                <li>It checks the current URL against your tour patterns</li>
                <li>If there's a matching tour, it displays automatically</li>
                <li>Users who complete tours won't see them again</li>
              </ol>

              <h2>Configuration Options</h2>
              <table>
                <thead>
                  <tr>
                    <th>Attribute</th>
                    <th>Description</th>
                    <th>Required</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>data-token</code></td>
                    <td>Your API token</td>
                    <td>Yes</td>
                  </tr>
                </tbody>
              </table>

              <h2>JavaScript API</h2>
              <p>You can also control tours programmatically:</p>

              <div className="not-prose bg-slate-900 rounded-lg p-4 my-4">
                <pre className="text-sm text-green-400 font-mono overflow-x-auto">
{`// Reset a tour (show it again to the user)
TourLayer.reset(tourId);

// Check version
console.log(TourLayer.version);`}
                </pre>
              </div>

              <h2>SPA Support</h2>
              <p>
                TourLayer automatically detects URL changes in Single Page Applications (SPAs)
                and re-evaluates tour conditions. No additional configuration needed!
              </p>
            </div>
          )}

          {activeSection === 'chrome-extension' && (
            <div className="prose prose-blue max-w-none">
              <h1>Chrome Extension</h1>
              <p className="lead">
                The Chrome extension is your tool for building tours visually.
                Pick elements directly on your website without writing any code.
              </p>

              <h2>Installation</h2>
              <ol>
                <li>Download the TourLayer Chrome extension</li>
                <li>Go to <code>chrome://extensions</code></li>
                <li>Enable "Developer mode"</li>
                <li>Click "Load unpacked" and select the extension folder</li>
              </ol>

              <h2>Connecting Your Account</h2>
              <ol>
                <li>Click the TourLayer icon in your browser toolbar</li>
                <li>Paste your API token (from Settings page)</li>
                <li>Click "Connect"</li>
              </ol>

              <h2>Using the Element Picker</h2>
              <ol>
                <li>Go to the TourLayer dashboard and create a new tour</li>
                <li>Enter the URL pattern for your tour</li>
                <li>Click "Add Step" and then "Pick"</li>
                <li>A new tab opens with your target website</li>
                <li>Hover over elements - they'll highlight in blue</li>
                <li>Click to select an element</li>
                <li>The selector is automatically captured!</li>
              </ol>

              <h2>Extension vs Embed Snippet</h2>
              <table>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Extension</th>
                    <th>Embed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Build tours</td>
                    <td>✅ Yes</td>
                    <td>❌ No</td>
                  </tr>
                  <tr>
                    <td>Show tours to you</td>
                    <td>✅ Yes</td>
                    <td>✅ Yes</td>
                  </tr>
                  <tr>
                    <td>Show tours to all users</td>
                    <td>❌ No</td>
                    <td>✅ Yes</td>
                  </tr>
                  <tr>
                    <td>Requires installation</td>
                    <td>Each user</td>
                    <td>Once on website</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'creating-tours' && (
            <div className="prose prose-blue max-w-none">
              <h1>Creating Tours</h1>
              <p className="lead">
                Learn how to create effective product tours that guide your users.
              </p>

              <h2>Tour Structure</h2>
              <p>Each tour consists of:</p>
              <ul>
                <li><strong>Name</strong> - A descriptive title for your reference</li>
                <li><strong>URL Pattern</strong> - Where the tour should appear</li>
                <li><strong>Steps</strong> - Individual tooltips in the tour</li>
              </ul>

              <h2>Step Properties</h2>
              <table>
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Element Selector</td>
                    <td>CSS selector for the target element</td>
                  </tr>
                  <tr>
                    <td>Title</td>
                    <td>Headline shown in the tooltip</td>
                  </tr>
                  <tr>
                    <td>Content</td>
                    <td>Description text</td>
                  </tr>
                  <tr>
                    <td>Placement</td>
                    <td>Where tooltip appears (top, bottom, left, right)</td>
                  </tr>
                  <tr>
                    <td>Button Text</td>
                    <td>Text for the next button</td>
                  </tr>
                  <tr>
                    <td>Pulse Animation</td>
                    <td>Show pulsing beacon on element</td>
                  </tr>
                  <tr>
                    <td>Z-Index</td>
                    <td>Control stacking order</td>
                  </tr>
                </tbody>
              </table>

              <h2>Best Practices</h2>
              <ul>
                <li>Keep tours short (3-5 steps)</li>
                <li>Focus on one feature per tour</li>
                <li>Use clear, actionable language</li>
                <li>Test tours on different screen sizes</li>
                <li>Use stable CSS selectors (IDs or data attributes)</li>
              </ul>
            </div>
          )}

          {activeSection === 'url-patterns' && (
            <div className="prose prose-blue max-w-none">
              <h1>URL Patterns</h1>
              <p className="lead">
                URL patterns determine when a tour should appear. Use wildcards to match multiple pages.
              </p>

              <h2>Wildcard Matching</h2>
              <p>Use <code>*</code> as a wildcard to match any characters:</p>

              <table>
                <thead>
                  <tr>
                    <th>Pattern</th>
                    <th>Matches</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>https://app.example.com/*</code></td>
                    <td>All pages on app.example.com</td>
                  </tr>
                  <tr>
                    <td><code>https://app.example.com/dashboard</code></td>
                    <td>Only the dashboard page (exact match)</td>
                  </tr>
                  <tr>
                    <td><code>https://app.example.com/users/*</code></td>
                    <td>All pages under /users/</td>
                  </tr>
                </tbody>
              </table>

              <h2>Examples</h2>
              <div className="not-prose space-y-2 my-4">
                <div className="bg-gray-50 border rounded-lg p-3">
                  <code className="text-green-600">https://myapp.com/*</code>
                  <p className="text-sm text-gray-600 mt-1">Shows tour on entire site</p>
                </div>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <code className="text-green-600">https://myapp.com/onboarding*</code>
                  <p className="text-sm text-gray-600 mt-1">Shows tour on onboarding pages</p>
                </div>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <code className="text-green-600">https://myapp.com/dashboard</code>
                  <p className="text-sm text-gray-600 mt-1">Shows tour only on exact dashboard URL</p>
                </div>
              </div>

              <h2>Tips</h2>
              <ul>
                <li>Always include the protocol (https://)</li>
                <li>End patterns with <code>*</code> for flexibility</li>
                <li>Test your patterns match the right pages</li>
                <li>Trailing slashes are handled automatically</li>
              </ul>
            </div>
          )}

          {activeSection === 'api-reference' && (
            <div className="prose prose-blue max-w-none">
              <h1>API Reference</h1>
              <p className="lead">
                Technical reference for the TourLayer API.
              </p>

              <h2>Authentication</h2>
              <p>All API requests require authentication via API token:</p>
              <div className="not-prose bg-slate-900 rounded-lg p-4 my-4">
                <pre className="text-sm text-green-400 font-mono">
{`Authorization: Bearer YOUR_API_TOKEN`}
                </pre>
              </div>

              <h2>Endpoints</h2>

              <h3>GET /api/public/tours</h3>
              <p>Fetch tours for the current URL.</p>
              
              <p><strong>Query Parameters:</strong></p>
              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>url</code></td>
                    <td>string</td>
                    <td>Current page URL to match against patterns</td>
                  </tr>
                </tbody>
              </table>

              <p><strong>Response:</strong></p>
              <div className="not-prose bg-slate-900 rounded-lg p-4 my-4">
                <pre className="text-sm text-green-400 font-mono overflow-x-auto">
{`{
  "tours": [
    {
      "id": 1,
      "name": "Welcome Tour",
      "url_pattern": "https://app.example.com/*",
      "steps": [
        {
          "id": 1,
          "selector": "#welcome-btn",
          "title": "Welcome!",
          "content": "Click here to get started",
          "placement": "bottom",
          "button_text": "Next",
          "pulse_enabled": true,
          "z_index": 2147483647
        }
      ]
    }
  ]
}`}
                </pre>
              </div>

              <h2>Rate Limits</h2>
              <p>API requests are limited to 100 requests per minute per token.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

