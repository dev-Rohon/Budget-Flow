import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import BudgetForm from '../components/budgets/BudgetForm';
import {
  formatCurrency,
  getSelectedCurrency,
  convertCurrency,
} from '../utils/currency';
import { isDateInCurrentMonth } from '../utils/monthlyReset';
import {
  getBudgets,
  getTransactions,
  createBudget,
  updateBudget,
  deleteBudget as deleteBudgetAPI,
} from '../utils/api';

export function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  const [currency, setCurrency] = useState(() => getSelectedCurrency());
  const [exchangeRate, setExchangeRate] = useState(1);

  /*
   * All financial data in the backend is stored in INR.
   * We convert the displayed values into the user's selected currency.
   */
  useEffect(() => {
    let cancelled = false;

    const loadExchangeRate = async () => {
      const selectedCurrency = getSelectedCurrency();

      setCurrency(selectedCurrency);

      if (selectedCurrency === 'INR') {
        setExchangeRate(1);
        return;
      }

      try {
        // Convert 1 INR to the selected currency.
        const converted = await convertCurrency(
          1,
          'INR',
          selectedCurrency
        );

        if (!cancelled) {
          setExchangeRate(Number(converted) || 1);
        }
      } catch (error) {
        console.error('Failed to load currency rate:', error);

        if (!cancelled) {
          setExchangeRate(1);
        }
      }
    };

    loadExchangeRate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [budgetData, transactionData] = await Promise.all([
          getBudgets(),
          getTransactions(),
        ]);

        setBudgets(Array.isArray(budgetData) ? budgetData : []);
        setTransactions(Array.isArray(transactionData) ? transactionData : []);
      } catch (error) {
        console.error('Failed to load budgets:', error);
        setBudgets([]);
        setTransactions([]);
      }
    };

    loadData();
  }, []);

  /*
   * Convert a backend INR amount into the currently selected currency.
   */
  const displayAmount = (amount) => {
    return Number(amount || 0) * exchangeRate;
  };

  const handleCreateBudget = async ({ category, total }) => {
    const nameMap = {
      Food: 'Food & Dining',
      Housing: 'Housing & Rent',
      Bills: 'Bills & Utilities',
      Shopping: 'Shopping & Apparel',
      Transport: 'Transportation',
      Entertainment: 'Entertainment',
      Health: 'Health',
      Education: 'Education',
      Other: 'Other',
    };

    if (budgets.some((b) => b.category === category)) {
      alert('A budget for this category already exists');
      return;
    }

    const iconMap = {
      Food: 'restaurant',
      Housing: 'home',
      Bills: 'bolt',
      Shopping: 'shopping_bag',
      Transport: 'directions_car',
      Entertainment: 'movie',
      Health: 'health_and_safety',
      Education: 'school',
      Other: 'receipt_long',
    };

    try {
      /*
       * Budget is stored in the backend base currency (INR).
       * The form displays the selected currency, so convert the
       * entered amount back to INR before saving.
       */
      let totalInINR = Number(total);

      if (currency !== 'INR') {
        try {
          const convertedBack = await convertCurrency(
            Number(total),
            currency,
            'INR'
          );

          totalInINR = Number(convertedBack);
        } catch (error) {
          console.error('Failed to convert budget to INR:', error);
          alert('Unable to convert budget currency. Please try again.');
          return;
        }
      }

      const newBudget = await createBudget({
        name: nameMap[category] || category,
        category,
        total: Math.abs(totalInINR),
        icon: iconMap[category] || 'receipt_long',
        color: 'bg-secondary',
      });

      setBudgets((prev) => [newBudget, ...prev]);
      setShowForm(false);
      setEditBudget(null);
    } catch (error) {
      console.error('Failed to create budget:', error);
      alert(error.message || 'Failed to create budget');
    }
  };

  const handleEditBudget = async ({ category, total }) => {
    if (!editBudget) return;

    if (
      budgets.some(
        (b) => b.category === category && b.id !== editBudget.id
      )
    ) {
      alert('A budget for this category already exists');
      return;
    }

    const nameMap = {
      Food: 'Food & Dining',
      Housing: 'Housing & Rent',
      Bills: 'Bills & Utilities',
      Shopping: 'Shopping & Apparel',
      Transport: 'Transportation',
      Entertainment: 'Entertainment',
      Health: 'Health',
      Education: 'Education',
      Other: 'Other',
    };

    const iconMap = {
      Food: 'restaurant',
      Housing: 'home',
      Bills: 'bolt',
      Shopping: 'shopping_bag',
      Transport: 'directions_car',
      Entertainment: 'movie',
      Health: 'health_and_safety',
      Education: 'school',
      Other: 'receipt_long',
    };

    try {
      /*
       * Convert edited amount from selected currency back to INR.
       */
      let totalInINR = Number(total);

      if (currency !== 'INR') {
        try {
          const convertedBack = await convertCurrency(
            Number(total),
            currency,
            'INR'
          );

          totalInINR = Number(convertedBack);
        } catch (error) {
          console.error('Failed to convert budget to INR:', error);
          alert('Unable to convert budget currency. Please try again.');
          return;
        }
      }

      const updatedBudget = await updateBudget(editBudget.id, {
        name: nameMap[category] || category,
        category,
        total: Math.abs(totalInINR),
        icon: iconMap[category] || 'receipt_long',
        color: editBudget.color || 'bg-secondary',
      });

      setBudgets((prev) =>
        prev.map((b) =>
          b.id === editBudget.id ? updatedBudget : b
        )
      );

      setShowForm(false);
      setEditBudget(null);
    } catch (error) {
      console.error('Failed to update budget:', error);
      alert(error.message || 'Failed to update budget');
    }
  };

  const confirmDeleteBudget = (budget) => {
    setBudgetToDelete(budget);
  };

  const cancelDeleteBudget = () => {
    setBudgetToDelete(null);
  };

  const deleteBudget = async () => {
    if (!budgetToDelete) return;

    try {
      await deleteBudgetAPI(budgetToDelete.id);

      setBudgets((prev) =>
        prev.filter((b) => b.id !== budgetToDelete.id)
      );

      setBudgetToDelete(null);
    } catch (error) {
      console.error('Failed to delete budget:', error);
      alert(error.message || 'Failed to delete budget');
    }
  };

  const calculateSpent = (category) => {
    if (!transactions || transactions.length === 0) return 0;

    return transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category === category &&
          isDateInCurrentMonth(t.date)
      )
      .reduce(
        (sum, t) => sum + (Number(t.amount) || 0),
        0
      );
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Budgets
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            Manage spending limits and track category allocations for{' '}
            {new Date().toLocaleString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <Button
          icon="add"
          onClick={() => setShowForm(true)}
        >
          CREATE BUDGET
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {budgets.map((b) => {
          const spent = calculateSpent(b.category);

          const percentActual = b.total
            ? Math.round((spent / Number(b.total)) * 100)
            : 0;

          const percentForBar = Math.min(
            100,
            percentActual
          );

          const displayedSpent = displayAmount(spent);
          const displayedTotal = displayAmount(b.total);

          return (
            <Card
              key={b.id}
              className="flex flex-col justify-between gap-md"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">
                      {b.icon}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-headline-md text-[18px] font-bold text-primary">
                      {b.name}
                    </h3>

                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Monthly Goal
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-xs">
                  <span className="font-headline-md text-headline-md font-bold text-primary">
                    {percentActual}%
                  </span>

                  <div className="flex items-center gap-xs">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditBudget(b);
                        setShowForm(true);
                      }}
                    >
                      EDIT
                    </Button>

                    <button
                      type="button"
                      onClick={() => confirmDeleteBudget(b)}
                      className="text-on-surface-variant hover:text-error transition-colors"
                      aria-label={`Delete ${b.name}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-body-sm text-body-sm mb-xs">
                  <span className="text-on-surface-variant">
                    Spent:{' '}
                    {formatCurrency(
                      displayedSpent,
                      currency
                    )}
                  </span>

                  <span className="font-data-mono font-medium text-primary">
                    Target:{' '}
                    {formatCurrency(
                      displayedTotal,
                      currency
                    )}
                  </span>
                </div>

                <ProgressBar
                  percentage={percentForBar}
                  color={
                    percentActual >= 100
                      ? 'bg-error'
                      : b.color
                  }
                />
              </div>
            </Card>
          );
        })}
      </div>

      {showForm && (
        <BudgetForm
          mode={editBudget ? 'edit' : 'create'}
          initialCategory={
            editBudget
              ? editBudget.category
              : undefined
          }
          initialTotal={
            editBudget
              ? displayAmount(editBudget.total)
              : undefined
          }
          existingCategories={budgets
            .map((b) => b.category)
            .filter((c) =>
              editBudget
                ? c !== editBudget.category
                : true
            )}
          onCancel={() => {
            setShowForm(false);
            setEditBudget(null);
          }}
          onSave={(data) => {
            if (editBudget) {
              handleEditBudget(data);
            } else {
              handleCreateBudget(data);
            }
          }}
        />
      )}

      {budgetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-lg">
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
          />

          <Card className="w-full max-w-sm z-10">
            <div className="flex flex-col gap-md">
              <div>
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  Delete Budget?
                </h2>

                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                  Are you sure you want to delete the "
                  {budgetToDelete.name}" budget?
                </p>

                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                  This will not delete any transactions.
                </p>
              </div>

              <div className="flex justify-end gap-sm">
                <Button
                  variant="outline"
                  onClick={cancelDeleteBudget}
                >
                  CANCEL
                </Button>

                <Button
                  variant="primary"
                  onClick={deleteBudget}
                >
                  DELETE BUDGET
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}