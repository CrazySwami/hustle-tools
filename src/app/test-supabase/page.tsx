'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSupabasePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  const supabase = createSupabaseClient();

  // Check connection and auth status
  useEffect(() => {
    checkConnection();
    checkUser();
  }, []);

  const checkConnection = async () => {
    try {
      // Try to fetch from auth endpoint to verify connection
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setConnectionStatus('connected');
    } catch (err) {
      console.error('Connection error:', err);
      setConnectionStatus('error');
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (err) {
      console.error('Get user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError('');
    setSuccess('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSuccess('Sign-up successful! Check your email for confirmation.');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Sign-up failed');
    }
  };

  const handleSignIn = async () => {
    setError('');
    setSuccess('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setSuccess('Sign-in successful!');
      setUser(data.user);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Sign-in failed');
    }
  };

  const handleSignInWithGoogle = async () => {
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSuccess('Signed out successfully');
    } catch (err: any) {
      setError(err.message || 'Sign-out failed');
    }
  };

  const testDatabaseAccess = async () => {
    setError('');
    setSuccess('');
    try {
      // Try to fetch documents
      const response = await fetch('/api/documents');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch documents');
      }
      const documents = await response.json();
      setSuccess(`Database access successful! Found ${documents.length} documents.`);
    } catch (err: any) {
      setError(`Database error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'error' ? 'bg-red-500' :
              'bg-yellow-500'
            }`} />
            <span className="font-medium">
              {connectionStatus === 'connected' ? 'Connected to Supabase' :
               connectionStatus === 'error' ? 'Connection Error' :
               'Checking connection...'}
            </span>
          </div>
          {connectionStatus === 'connected' && (
            <p className="text-sm text-muted-foreground mt-2">
              Instance: racltbidxkdiyhlgpgar.supabase.co
            </p>
          )}
        </CardContent>
      </Card>

      {/* User Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="font-medium">Signed In</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSignOut} variant="outline">
                  Sign Out
                </Button>
                <Button onClick={testDatabaseAccess} variant="secondary">
                  Test Database Access
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>Not signed in</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
          {success}
        </div>
      )}

      {/* Auth Forms */}
      {!user && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sign Up */}
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create a new account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button onClick={handleSignUp} className="w-full">
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sign In */}
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Sign in to existing account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button onClick={handleSignIn} className="w-full">
                  Sign In
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleSignInWithGoogle}
                  variant="outline"
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>1. Enable Email Auth:</strong> Go to Supabase Dashboard → Authentication → Providers → Enable Email
          </p>
          <p>
            <strong>2. Enable Google OAuth (Optional):</strong> Configure Google OAuth client and add credentials to Supabase
          </p>
          <p>
            <strong>3. Set Redirect URLs:</strong> Add http://localhost:3000/auth/callback to Supabase Auth settings
          </p>
          <p className="text-muted-foreground">
            See full guide: <code className="text-xs bg-muted px-1 py-0.5 rounded">/docs/SUPABASE_AUTH_SETUP.md</code>
          </p>
          <div className="pt-2">
            <a
              href="https://supabase.com/dashboard/project/racltbidxkdiyhlgpgar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Open Supabase Dashboard →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
