import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { getBudgets, getTransactions } from '../utils/api';
import {
  formatCurrency,
  formatCurrencyWithSign,
  convertCurrency,
  getSelectedCurrency,
} from '../utils/currency';
import { isDateInCurrentMonth } from '../utils/monthlyReset';
import { getCurrentUser } from '../utils/userStorage';

export function DashboardPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [displayCurrency, setDisplayCurrency] = useState(getSelectedCurrency());
  const [conversionRate, setConversionRate] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [transactionData, budgetData] = await Promise.all([
          getTransactions(),
          getBudgets(),
        ]);
        setTransactions(Array.isArray(transactionData) ? transactionData : []);
        setBudgets(Array.isArray(budgetData) ? budgetData : []);
        setLoadError(null);
      } catch (_error) {
        setTransactions([]);
        setBudgets([]);
        setLoadError('Unable to load dashboard data.');
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadConversionRate = async () => {
      const currency = getSelectedCurrency();

      setDisplayCurrency(currency);

      if (currency === 'INR') {
        setConversionRate(1);
        return;
      }

      try {
        const rate = await convertCurrency(1, 'INR', currency);
        setConversionRate(Number(rate) || 1);
      } catch (error) {
        console.error('Currency conversion failed:', error);
        setConversionRate(1);
      }
    };

    loadConversionRate();
  }, []);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthLabel = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const monthlyTransactions = useMemo(() => {
    return transactions.filter((tx) => isDateInCurrentMonth(tx.date, now));
  }, [transactions, currentYear, currentMonth]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    monthlyTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') income += amt;
      else expense += amt;
    });

    const totalBudget = (budgets || []).reduce((s, b) => s + (Number(b.total) || 0), 0);
    const remainingBudget = totalBudget - expense;
    const balance = income - expense;

    return { income, expense, balance, totalBudget, remainingBudget };
  }, [monthlyTransactions, budgets]);

  const recentTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;

      return (
        db - da ||
        String(b.id || '').localeCompare(String(a.id || ''))
      );
    });

    return sorted.slice(0, 5);
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const map = {};
    monthlyTransactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      const cat = tx.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(tx.amount) || 0);
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions]);

  const convertForDisplay = (amount) => {
    return Number(amount || 0) * conversionRate;
  };

  return (
    <>
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            {(() => {
              const user = getCurrentUser();
              return user && user.name ? `Good evening, ${user.name} 👋` : 'Good evening';
            })()}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            Here's your financial overview for {currentMonthLabel}.
          </p>
          {loadError && (
            <p className="font-body-sm text-body-sm text-error mt-xs">{loadError}</p>
          )}
        </div>
        <Button
          icon="add"
          onClick={() => navigate('/add-transaction')}
          className="whitespace-nowrap"
        >
          ADD TRANSACTION
        </Button>
      </header>

      {/* Summary KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <MetricCard
          title="TOTAL BALANCE"
          amount={formatCurrency(convertForDisplay(totals.balance), displayCurrency)}
          icon="account_balance_wallet"
        />
        <MetricCard
          title="INCOME"
          amount={formatCurrency(convertForDisplay(totals.income), displayCurrency)}
          icon="arrow_downward"
          subtitle={`Month: ${now.toLocaleString(undefined, {
            month: 'long',
            year: 'numeric',
          })}`}
        />
        <MetricCard
          title="EXPENSES"
          amount={formatCurrency(convertForDisplay(totals.expense), displayCurrency)}
          icon="arrow_upward"
          trendType="negative"
        />
        <MetricCard
          title="REMAINING BUDGET"
          amount={formatCurrency(
            convertForDisplay(totals.remainingBudget),
            displayCurrency
          )}
          icon="savings"
          subtitle="Safe to spend"
          variant="highlight"
        />
      </section>

      {/* Main Grid: Budget Overview + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-lg">
          {/* Budget Overview Card */}
          <Card>
            <div className="flex justify-between items-center mb-md">
              <h2 className="font-headline-md text-headline-md text-primary">Monthly Budget</h2>
              <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full font-label-caps text-label-caps">
                {currentMonthLabel}
              </span>
            </div>
            <div className="flex justify-between items-end mb-sm">
              <div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-xs">Spent so far</p>
                <p className="font-headline-md text-headline-md font-bold text-primary font-data-mono">
                  {formatCurrency(convertForDisplay(totals.expense), displayCurrency)} <span className="text-body-sm text-outline font-normal">/{formatCurrency(convertForDisplay(totals.totalBudget), displayCurrency)}</span>
                </p>
              </div>
              <div className="text-right">
                {(() => {
                  const percentActual = totals.totalBudget > 0 ? Math.round((totals.expense / totals.totalBudget) * 100) : 0;
                  return <span className="font-headline-md text-headline-md font-bold text-primary">{percentActual}%</span>;
                })()}
              </div>
            </div>
            {(() => {
              const percentActual = totals.totalBudget > 0 ? Math.round((totals.expense / totals.totalBudget) * 100) : 0;
              const percentForBar = Math.min(100, percentActual);
              return <ProgressBar percentage={percentForBar} className="mb-sm" />;
            })()}
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              You are on track to meet your monthly goal.
            </p>
          </Card>

          {/* Spending Overview by Category */}
          <Card className="flex-1">
            <h2 className="font-headline-md text-headline-md text-primary mb-lg">Spending Overview</h2>
            <div className="flex flex-col gap-md">
              {expenseByCategory.length === 0 ? (
                <div className="font-body-sm text-body-sm text-on-surface-variant">No expense data for this month.</div>
              ) : (
                expenseByCategory.slice(0, 4).map((cat) => {
                  const percent = totals.expense > 0 ? Math.round((cat.amount / totals.expense) * 100) : 0;
                  const icon =
                    cat.name === 'Food'
                      ? 'restaurant'
                      : cat.name === 'Bills'
                        ? 'bolt'
                        : cat.name === 'Shopping'
                          ? 'shopping_bag'
                          : cat.name === 'Transport'
                            ? 'directions_car'
                            : 'receipt_long';
                  return (
                    <div key={cat.name} className="flex items-center gap-md">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[16px]">{icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between font-body-sm text-body-sm mb-xs">
                          <span className="text-on-surface">{cat.name}</span>
                          <span className="font-data-mono font-medium">{formatCurrency(
                            convertForDisplay(cat.amount),
                            displayCurrency
                          )}</span>
                        </div>
                        <ProgressBar percentage={percent} color="bg-secondary" className="h-1.5" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (1/3 width): Recent Transactions */}
        <Card className="p-0 flex flex-col h-full">
          <div className="p-lg flex justify-between items-center border-b border-outline-variant/30">
            <h2 className="font-headline-md text-headline-md text-primary">Recent Transactions</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="font-label-caps text-label-caps text-primary hover:underline cursor-pointer"
            >
              VIEW ALL
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <div className="p-lg text-center font-body-sm text-on-surface-variant">No transactions yet</div>
            ) : (
              recentTransactions.map((tx) => {
                const displayAmount = formatCurrencyWithSign(
                  convertForDisplay(tx.amount),
                  tx.type,
                  displayCurrency
                );
                const dateStr = (() => {
                  try {
                    const d = new Date(tx.date);
                    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  } catch (e) {
                    return tx.date;
                  }
                })();

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-lg border-b border-outline-variant/20 hover:bg-surface-bright transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-md">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income'
                          ? 'bg-tertiary-container/10 text-on-tertiary-container'
                          : 'bg-surface-container text-on-surface-variant'
                          }`}
                      >
                        <span className="material-symbols-outlined">{tx.icon}</span>
                      </div>
                      <div>
                        <p className="font-body-sm text-body-sm font-semibold text-primary">{tx.name || tx.title || tx.category}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">{dateStr}</p>
                      </div>
                    </div>
                    <span
                      className={`font-data-mono text-data-mono ${tx.type === 'income'
                        ? 'font-bold text-on-tertiary-container'
                        : 'font-medium text-on-surface'
                        }`}
                    >
                      {displayAmount}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
