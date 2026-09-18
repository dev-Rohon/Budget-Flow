import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { apiRequest } from '../utils/api';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest('/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify({
    email: email.trim(),
  }),
});

      console.log('Reset OTP sent:', data);

      // Move to OTP verification page
      navigate('/verify-reset-otp', {
        state: {
          email: email.trim(),
        },
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      alert(error.message || 'Unable to send reset code');
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
            <span className="material-symbols-outlined text-[24px]">
              account_balance
            </span>
          </div>

          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Forgot your password?
          </h1>

          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Enter your email address and we'll send you a verification code
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">

            <Input
              label="EMAIL ADDRESS"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              icon="mail"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-sm"
              disabled={loading}
            >
              {loading ? 'SENDING CODE...' : 'SEND RESET CODE'}
            </Button>

          </form>
        </Card>

        {/* Back to Login */}
        <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
          Remember your password?{' '}

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