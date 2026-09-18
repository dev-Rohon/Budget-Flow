import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { apiRequest } from '../utils/api';

export function VerifyResetOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      alert('Email address is missing. Please start again.');
      navigate('/forgot-password');
      return;
    }

    if (otp.length !== 6) {
      alert('Please enter the 6-digit verification code');
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest('/auth/verify-reset-otp', {
  method: 'POST',
  body: JSON.stringify({
    email,
    otp,
  }),
});

      console.log('Reset OTP verified:', data);

      navigate('/reset-password', {
        state: {
          email,
          otp,
        },
      });
    } catch (error) {
      console.error('Reset OTP error:', error);
      alert(error.message || 'Unable to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-margin-mobile py-xl">
      <div className="w-full max-w-md flex flex-col gap-lg">

        <div className="flex flex-col items-center gap-xs text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary mb-xs">
            <span className="material-symbols-outlined text-[24px]">
              mail
            </span>
          </div>

          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Verify your email
          </h1>

          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Enter the 6-digit code sent to your email address
          </p>
        </div>

        <Card className="p-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">

            <Input
              label="VERIFICATION CODE"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              inputMode="numeric"
              maxLength={6}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-sm"
              disabled={loading}
            >
              {loading ? 'VERIFYING...' : 'VERIFY CODE'}
            </Button>

          </form>
        </Card>

      </div>
    </div>
  );
}