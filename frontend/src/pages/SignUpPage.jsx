import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { isAuthenticated } from '../utils/userStorage';
import { apiRequest } from '../utils/api';

export function SignUpPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const data = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: fullName,
          email,
          password,
        }),
      });

      console.log('Signup successful:', data);

      navigate('/verify-otp', {
        state: { email },
      });

    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-margin-mobile py-xl">
      <div className="w-full max-w-md flex flex-col gap-lg">

        <div className="flex flex-col items-center gap-xs text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary mb-xs">
            <span className="material-symbols-outlined text-[24px]">
              account_balance
            </span>
          </div>

          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Create your account
          </h1>

          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Start managing your personal finances with precision
          </p>
        </div>

        <Card className="p-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">

            {error && (
              <p className="text-red-500 text-sm">
                {error}
              </p>
            )}

            <Input
              label="FULL NAME"
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon="person"
              autoComplete="name"
              required
            />

            <Input
              label="EMAIL ADDRESS"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon="mail"
              autoComplete="email"
              required
            />

            <Input
              label="CREATE A PASSWORD"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon="lock"
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-sm"
              disabled={loading}
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </Button>

          </form>
        </Card>

        <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
          Already have an account?{' '}

          <Link
            to="/login"
            className="font-bold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}