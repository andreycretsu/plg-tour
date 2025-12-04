'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldGroup, FieldDescription } from '@/components/ui/field';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate slug from company name
  const workspaceSlug = useMemo(() => {
    return company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30) || 'your-workspace';
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, company }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store non-sensitive data in localStorage (token is in HttpOnly cookie)
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('workspace', JSON.stringify(data.workspace));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎯 TourLayer</h1>
          <p className="text-gray-600 mt-2">Create your workspace</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-5">
                {error}
              </div>
            )}

            <FieldGroup>
              {/* Company Name with URL Preview - Like Fibery */}
              <Field>
                <FieldLabel htmlFor="company" className="flex items-center gap-2">
                  <Building2 size={14} />
                  Company Name
                </FieldLabel>
                <Input
                  id="company"
                  className="text-lg font-medium"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                  required
                />
              </Field>

              {/* Auto-generated URL preview */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden -mt-3">
                <div className="flex-1 px-4 py-3">
                  <span className="text-gray-900 font-medium">{workspaceSlug}</span>
                </div>
                <div className="px-4 py-3 bg-gray-100 text-gray-500 text-sm border-l border-gray-200">
                  .tourlayer.io
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <Field>
                  <FieldLabel htmlFor="name">Your Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Work Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </Field>

              <Button
                type="submit"
                className="w-full text-lg py-3"
                disabled={loading}
              >
                {loading ? 'Creating workspace...' : 'Continue'}
              </Button>
            </FieldGroup>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
