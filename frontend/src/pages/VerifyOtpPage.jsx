import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signInUser, signUpUser } from '../utils/userStorage';
import { apiRequest } from '../utils/api';

export const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || '';
  const name = location.state?.name || '';

  // Determine whether this is signup OTP or login OTP
  const isLoginOtp = location.pathname === '/verify-login-otp';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!email) {
      setError('Email information is missing. Please login again.');
      return;
    }

    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);

      const endpoint = isLoginOtp
        ? '/auth/verify-login-otp'
        : '/auth/verify-otp';

      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
        }),
      });

      // Login OTP → create authenticated session
      if (isLoginOtp) {
        console.log('Login OTP response:', data);
        console.log('Access token:', data.access_token);

        if (!data.access_token) {
          throw new Error('Access token was not received from the server.');
        }

        localStorage.setItem(
          'budgetflow-access-token',
          data.access_token
        );

        signInUser(email);

        setSuccess('Login verified successfully!');

        setTimeout(() => {
          navigate(location.state?.from || '/dashboard', {
            replace: true,
          });
        }, 1000);
      }

      // Signup OTP → create the local user session
      else {
        if (!data.access_token) {
          throw new Error('Access token was not received from the server.');
        }

        localStorage.setItem(
          'budgetflow-access-token',
          data.access_token
        );

        signUpUser({
          name,
          email,
        });

        setSuccess('Email verified successfully!');

        setTimeout(() => {
          navigate('/dashboard', {
            replace: true,
          });
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || resendCooldown > 0 || resendLoading) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      setResendLoading(true);

      const endpoint = isLoginOtp
        ? '/auth/resend-login-otp'
        : '/auth/resend-otp';

      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      setSuccess(
        isLoginOtp
          ? 'A new login OTP has been sent to your email.'
          : 'A new OTP has been sent to your email.'
      );

      // Backend cooldown is 60 seconds
      setResendCooldown(60);

      // Clear old OTP from input
      setOtp('');
    } catch (err) {
      setError(err.message || 'Unable to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-surface-container p-8 shadow-lg">

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-on-surface">
              {isLoginOtp ? 'Verify Your Login' : 'Verify Your Email'}
            </h1>

            <p className="mt-2 text-sm text-on-surface-variant">
              Enter the 6-digit OTP sent to your email address.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-on-surface">
                Email
              </label>

              <div className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-on-surface">
                {email}
              </div>
            </div>

            <div>
              <label
                htmlFor="otp"
                className="mb-2 block text-sm font-medium text-on-surface"
              >
                OTP
              </label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setOtp(value);
                }}
                placeholder="Enter 6-digit OTP"
                className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-center text-lg tracking-[0.4em] text-on-surface outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-lg bg-primary-container px-4 py-3 text-sm text-on-primary-container">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || resendLoading}
              className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-on-surface-variant">
                Didn't receive the email?
              </p>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resendLoading || loading}
                className="mt-2 font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
              >
                {resendLoading
                  ? 'Sending...'
                  : resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : 'Resend OTP'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};