import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      {/* Header */}
      <header className="w-full h-20 border-b border-outline-variant/30 px-margin-mobile md:px-margin-desktop flex items-center justify-between max-w-[1400px] mx-auto">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-bold">
            <span className="material-symbols-outlined">account_balance</span>
          </div>
          <span className="font-headline-md text-headline-md font-bold text-primary">BudgetFlow</span>
        </div>
        <div className="flex items-center gap-md">
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-xl md:py-40 flex flex-col items-center text-center justify-center gap-lg">
        <span className="bg-surface-container text-on-surface-variant px-4 py-1.5 rounded-full font-label-caps text-label-caps">
          Fiscal Precision Design System
        </span>
        <h1 className="font-headline-lg text-4xl md:text-6xl font-bold text-primary tracking-tight max-w-3xl">
          Modern Personal Finance Management for Everyone
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Track expenses, manage budgets, analyze trends, and achieve your financial goals with high precision across desktop and mobile devices.
        </p>
        <div className="flex items-center gap-md mt-md">
          <Link to="/dashboard">
            <Button variant="primary" size="lg" icon="dashboard">
              Open Dashboard
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="secondary" size="lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-lg border-t border-outline-variant/30 text-center font-body-sm text-body-sm text-on-surface-variant">
        BudgetFlow &copy; 2026 — Built with Fiscal Precision
      </footer>
    </div>
  );
}
