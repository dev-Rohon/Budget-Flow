import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { apiRequest } from '../utils/api';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const otp = location.state?.otp || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !otp) {
      alert('Reset session expired. Please start again.');
      navigate('/forgot-password');
      return;
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

     const data = await apiRequest('/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify({
    email,
    otp,
    new_password: newPassword,
  }),
});

      alert('Password reset successfully!');

      navigate('/login', {
        replace: true,
      });
    } catch (error) {
      console.error('Reset password error:', error);
      alert(error.message || 'Unable to reset password');
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
              lock_reset
            </span>
          </div>

          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Create a new password
          </h1>

          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Choose a new password for your BudgetFlow account
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">

            <Input
              label="NEW PASSWORD"
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              icon="lock"
              required
            />

            <Input
              label="CONFIRM PASSWORD"
              type="password"
              placeholder="Enter your password again"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              icon="lock"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-sm"
              disabled={loading}
            >
              {loading ? 'RESETTING PASSWORD...' : 'RESET PASSWORD'}
            </Button>

          </form>
        </Card>

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