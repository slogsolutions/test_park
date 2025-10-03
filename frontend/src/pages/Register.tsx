import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  // Guard to prevent duplicate submission and hold the in-flight promise
  const isSubmittingRef = useRef(false);
  const ongoingPromiseRef = useRef<Promise<any> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Synchronous guard: if we're already submitting, reuse the in-flight promise.
    if (isSubmittingRef.current) {
      console.warn('[Register] submit ignored: already submitting');
      if (ongoingPromiseRef.current) {
        try {
          await ongoingPromiseRef.current;
        } catch {
          /* swallow here - original call will handle errors/toasts */
        }
      }
      return;
    }

    // local validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // mark submitting and set loading UI
    isSubmittingRef.current = true;
    setLoading(true);

    // create the promise and store it so repeated calls reuse it
    const submitPromise = (async () => {
      try {
        console.log('[WEB DEBUG] Register submit started', { email: formData.email, ts: new Date().toISOString() });

        const res = await register(formData.name, formData.email, formData.password);

        // If backend returned status 201 or user object treat as success
        if (res?.status === 201 || res?.user) {
          toast.success('Registration successful! Please check your email for verification.');
          console.log('[WEB DEBUG] Register resolved success', res);
          
          // === FIX: Reset loading state and refs before navigating away ===
          ongoingPromiseRef.current = null;
          isSubmittingRef.current = false;
          setLoading(false);
          // ===============================================================
          
          navigate('/login', { replace: true });
        } else {
          // fallback: show server message or generic success message
          const msg = res?.message || 'Registration completed. Please verify your email.';
          toast.success(msg);
          console.log('[WEB DEBUG] Register resolved (no user in response)', res);

          // === FIX: Reset loading state and refs before navigating away ===
          ongoingPromiseRef.current = null;
          isSubmittingRef.current = false;
          setLoading(false);
          // ===============================================================

          navigate('/login', { replace: true });
        }
      } catch (error: any) {
        // robust extraction of server message
        console.error('[WEB DEBUG] register failed (caught):', error);
        const serverMessage =
          error?.response?.data?.message ||
          error?.response?.data ||
          error?.message ||
          'Registration failed';
        toast.error(serverMessage);
        throw error;
      } finally {
        // cleanup will be done by the outer finally
      }
    })();

    ongoingPromiseRef.current = submitPromise;

    try {
      await submitPromise;
    } catch {
      // already toasted inside; nothing extra needed
    } finally {
      // This finally block now only serves the error path where navigation did not happen,
      // as the success path cleans up before navigate().
      if (isSubmittingRef.current) {
        // reset guard + UI
        ongoingPromiseRef.current = null;
        isSubmittingRef.current = false;
        setLoading(false);
        console.log('[WEB DEBUG] Register submit finished (Error path cleanup)', { email: formData.email, ts: new Date().toISOString() });
      } else {
        console.log('[WEB DEBUG] Register submit finished (Success path cleanup assumed)', { email: formData.email, ts: new Date().toISOString() });
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // optional: block google login while a normal registration is in-flight
      if (isSubmittingRef.current) {
        toast.info('Please wait until the current request finishes');
        return;
      }
      setLoading(true);
      await googleLogin(credentialResponse.credential);
      toast.success('Google registration successful!');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('[WEB DEBUG] googleLogin failed', error);
      toast.error(error?.message || 'Google registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-red-100 p-3 rounded-full">
            <UserPlus className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create Your Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join us today and get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-red-100/50 sm:rounded-xl sm:px-10 border border-red-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-red-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-red-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google registration failed')}
                />
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-red-600 hover:text-red-500 transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
