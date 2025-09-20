import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthProvider';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('Signin error:', error);
        const errorMessage = (error as { message?: string })?.message || '';
        
        if (errorMessage.includes('Invalid login credentials')) {
          setError('Invalid email or password.');
        } else if (errorMessage.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account.');
        } else if (errorMessage.includes('Email rate limit exceeded')) {
          setError('Too many attempts. Please wait before trying again.');
        } else {
          setError('Sign in failed. Please try again.');
        }
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Unexpected signin error:', err);
      setError('An unexpected error occurred during sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await signUp(email, password, name);
      
      if (error) {
        console.error('Signup error:', error);
        const errorMessage = (error as { message?: string })?.message || '';
        
        if (errorMessage.includes('already registered')) {
          setError('Email already registered. Please sign in instead.');
        } else if (errorMessage.includes('invalid email')) {
          setError('Please enter a valid email address.');
        } else if (errorMessage.includes('password')) {
          setError('Password must be at least 6 characters.');
        } else {
          setError('Signup failed. Please try again.');
        }
      } else {
        setMessage('Account created successfully! Check your email if confirmation is required.');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error('Unexpected signup error:', err);
      setError('An unexpected error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Quiet Hours Scheduler
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUpMode ? 'Create your account' : 'Sign in to your account'}
          </p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setError('');
                setMessage('');
              }}
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              {isSignUpMode ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={isSignUpMode ? handleSignUp : handleSignIn}>
          <div className="rounded-md shadow-sm -space-y-px">
            {isSignUpMode && (
              <div>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <input
                type="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${isSignUpMode ? '' : 'rounded-t-md'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          
          {message && (
            <div className="text-green-600 text-sm text-center">{message}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading && isSignUpMode && 'Creating Account...'}
              {loading && !isSignUpMode && 'Signing In...'}
              {!loading && isSignUpMode && 'Create Account'}
              {!loading && !isSignUpMode && 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
