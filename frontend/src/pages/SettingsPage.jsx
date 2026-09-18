import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { isAutoResetEnabled, setAutoResetEnabled } from '../utils/monthlyReset';
import { getCurrencyStorageKey, getSelectedCurrency } from '../utils/currency';
import { getScopedStorageKey, signOutUser } from '../utils/userStorage';

const getInitialTheme = () => {
  return localStorage.getItem('budgetflow-theme') ?? 'light';
};

const applyTheme = (theme) => {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
};

export function SettingsPage() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [savedTheme, setSavedTheme] = useState(getInitialTheme);

  const [currency, setCurrency] = useState(() => getSelectedCurrency());
  const [savedCurrency, setSavedCurrency] = useState(() => getSelectedCurrency());

  const [autoReset, setAutoReset] = useState(() => {
    return isAutoResetEnabled(getScopedStorageKey('budgetflow-auto-reset'));
  });

  const [savedAutoReset, setSavedAutoReset] = useState(() => {
    return isAutoResetEnabled(getScopedStorageKey('budgetflow-auto-reset'));
  });

  const [emailReports, setEmailReports] = useState(true);
  const [savedEmailReports, setSavedEmailReports] = useState(true);

  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [savedBudgetAlerts, setSavedBudgetAlerts] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');

  const navigate = useNavigate();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const savedThemeRef = useRef(savedTheme);
  const savedCurrencyRef = useRef(savedCurrency);
  const savedAutoResetRef = useRef(savedAutoReset);

  useEffect(() => {
    savedThemeRef.current = savedTheme;
  }, [savedTheme]);

  useEffect(() => {
    savedCurrencyRef.current = savedCurrency;
  }, [savedCurrency]);

  useEffect(() => {
    savedAutoResetRef.current = savedAutoReset;
  }, [savedAutoReset]);

  useEffect(() => {
    return () => {
      // Restore the previously saved theme
      applyTheme(savedThemeRef.current);

      // Restore temporary settings in React state
      setCurrency(savedCurrencyRef.current);
      setAutoReset(savedAutoResetRef.current);
    };
  }, []);

  const savePreferences = () => {
    try {
      setSaveStatus('saving');

      // Save theme
      localStorage.setItem('budgetflow-theme', theme);

      // Save currency
      localStorage.setItem(getCurrencyStorageKey(), currency);

      // Save auto reset
      const autoResetKey = getScopedStorageKey('budgetflow-auto-reset');
      setAutoResetEnabled(autoReset, autoResetKey);

      // Update saved states
      setSavedTheme(theme);
      setSavedCurrency(currency);
      setSavedAutoReset(autoReset);
      setSavedEmailReports(emailReports);
      setSavedBudgetAlerts(budgetAlerts);

      // Show success state
      setTimeout(() => {
        setSaveStatus('saved');
      }, 300);

      // Return button to normal after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2300);

    } catch (e) {
      setSaveStatus('error');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2500);
    }
  };



  return (
    <>
      <header>
        <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Settings</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
          Customize system preferences, notifications, and application layout
        </p>
      </header>

      <div className="max-w-3xl flex flex-col gap-lg">
        <Card className="flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-primary">General Preferences</h2>
          <div className="flex flex-col gap-md">
            <Select
              label="BASE CURRENCY"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              options={[
                { value: 'INR', label: 'INR (₹) - Indian Rupee' },
                { value: 'USD', label: 'USD ($) - US Dollar' },
                { value: 'EUR', label: 'EUR (€) - Euro' },
              ]}
            />
            <Select
              label="THEME MODE"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              options={[
                { value: 'light', label: 'Light Mode (Fiscal Precision)' },
                { value: 'dark', label: 'Dark Mode' },
                { value: 'system', label: 'System Default' },
              ]}
            />

            <label className="flex items-start justify-between p-sm hover:bg-surface-container rounded-lg cursor-pointer">
              <div className="flex-1 mr-4">
                <div className="font-body-sm text-body-sm text-primary">Auto Reset Monthly Data</div>
                <div className="font-body-xs text-body-xs text-on-surface-variant">Start each month with fresh spending totals while keeping your transaction history.</div>
              </div>
              <div className="relative mt-1">
                <input
                  type="checkbox"
                  checked={autoReset}
                  onChange={(e) => setAutoReset(e.target.checked)}
                  aria-label="Auto Reset Monthly Data"
                  className="absolute inset-0 w-5 h-5 opacity-0 cursor-pointer z-10"
                />
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all ${autoReset
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-surface border-outline text-transparent dark:bg-surface-container'
                    }`}
                  aria-hidden="true"
                >
                  {autoReset && (
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </div>
            </label>
          </div>
        </Card>

        <Card className="flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-primary">Notifications</h2>
          <div className="flex flex-col gap-sm">
            <label className="flex items-center justify-between p-sm hover:bg-surface-container rounded-lg cursor-pointer">
              <span className="font-body-sm text-body-sm text-primary">Email summary reports</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={emailReports}
                  onChange={(e) => setEmailReports(e.target.checked)}
                  aria-label="Email summary reports"
                  className="absolute inset-0 w-5 h-5 opacity-0 cursor-pointer z-10"
                />
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all ${emailReports
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-surface border-outline text-transparent dark:bg-surface-container'
                    }`}
                  aria-hidden="true"
                >
                  {emailReports && (
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </div>
            </label>
            <label className="flex items-center justify-between p-sm hover:bg-surface-container rounded-lg cursor-pointer">
              <span className="font-body-sm text-body-sm text-primary">Budget threshold alerts</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={budgetAlerts}
                  onChange={(e) => setBudgetAlerts(e.target.checked)}
                  aria-label="Budget threshold alerts"
                  className="absolute inset-0 w-5 h-5 opacity-0 cursor-pointer z-10"
                />
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all ${budgetAlerts
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-surface border-outline text-transparent dark:bg-surface-container'
                    }`}
                  aria-hidden="true"
                >
                  {budgetAlerts && (
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </div>
            </label>
          </div>
          <div className="flex flex-col gap-sm mt-sm">
            {saveStatus === 'saved' && (
              <div className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container-high text-primary font-body-sm text-center">
                ✓ Preferences saved successfully
              </div>
            )}

            {saveStatus === 'saving' && (
              <div className="rounded-lg border border-outline-variant bg-surface-container px-md py-sm text-center text-on-surface-variant font-body-sm">
                Saving preferences...
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="rounded-lg border border-error bg-error-container px-md py-sm text-center text-error font-body-sm">
                ✕ Failed to save preferences
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={savePreferences}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving'
                  ? 'SAVING...'
                  : saveStatus === 'saved'
                    ? 'SAVED ✓'
                    : saveStatus === 'error'
                      ? 'SAVE FAILED'
                      : 'SAVE PREFERENCES'}
              </Button>
            </div>
          </div>
        </Card>
        <Card className="flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-primary">Account</h2>
          <div className="flex flex-col gap-sm">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Tap the button below to sign out of BudgetFlow on this device.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                signOutUser();
                navigate('/login', { replace: true });
              }}
            >
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
