import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { apiRequest } from '../utils/api';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    const message = sessionStorage.getItem('budgetflow-session-expired');

    if (message) {
      setSessionMessage(message);
      sessionStorage.removeItem('budgetflow-session-expired');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest('/auth/login', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const from =
        location.state && location.state.from
          ? location.state.from.pathname
          : '/dashboard';

      // Existing account but email is not verified
      if (!data.is_verified) {
        navigate('/verify-otp', {
          replace: true,
          state: {
            email: email.trim(),
            name: data.name,
          },
        });

        return;
      }

      // Existing account and email is already verified
      navigate('/verify-login-otp', {
        replace: true,
        state: {
          email: email.trim(),
          from,
        },
      });

    } catch (error) {
      console.error('Login error:', error);
      alert(error.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-margin-mobile py-xl">
      <div className="w-full max-w-md flex flex-col gap-lg">
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-xs text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary mb-xs">
            <span className="material-symbols-outlined text-[24px]">account_balance</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Sign in to BudgetFlow</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Enter your details to access your dashboard
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="p-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <Input
              label="EMAIL ADDRESS"
              type="email"
              placeholder="rohan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              icon="mail"
              required
            />
            <Input
              label="PASSWORD"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              icon="lock"
              required
            />
            <div className="flex justify-between items-center text-body-sm">
              <label className="flex items-center gap-xs cursor-pointer text-on-surface-variant">
                <input type="checkbox" className="rounded border-outline-variant text-primary" />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="font-label-caps text-label-caps text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-sm"
              disabled={loading}
            >
              {loading ? 'CHECKING...' : 'SIGN IN'}
            </Button>
          </form>
        </Card>

        <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
