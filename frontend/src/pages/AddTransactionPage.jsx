import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { getCurrencySymbol } from '../utils/currency';
import { createTransaction } from '../utils/api';

export function AddTransactionPage() {
  const navigate = useNavigate();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const expenseCategories = [
    'Food',
    'Housing',
    'Bills',
    'Shopping',
    'Transport',
    'Entertainment',
    'Health',
    'Education',
    'Other',
  ];

  const incomeCategories = [
    'Salary',
    'Freelance',
    'Business',
    'Investment',
    'Interest',
    'Gift',
    'Other Income',
  ];

  const [category, setCategory] = useState(expenseCategories[0]);
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [description, setDescription] = useState('');
  const currencySymbol = getCurrencySymbol();



  const categoryIconMap = {
    Food: 'restaurant',
    Housing: 'home',
    Bills: 'bolt',
    Shopping: 'shopping_bag',
    Transport: 'directions_car',
    Entertainment: 'movie',
    Health: 'health_and_safety',
    Education: 'school',
    Other: 'receipt_long',
    // income icons
    Salary: 'payments',
    Freelance: 'work',
    Business: 'account_balance',
    Investment: 'trending_up',
    Interest: 'attach_money',
    Gift: 'card_giftcard',
    'Other Income': 'receipt_long',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const name = description && description.trim();

    if (!name) {
      alert('Transaction name cannot be empty');
      return;
    }

    const amt = Number(amount);

    if (!amount || Number.isNaN(amt) || amt <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    if (!category) {
      alert('Please select a category');
      return;
    }

    if (!date || isNaN(Date.parse(date))) {
      alert('Please enter a valid date');
      return;
    }

    const icon = categoryIconMap[category] || 'receipt_long';

    const newTransaction = {
      name,
      category,
      date,
      amount: Math.abs(amt),
      status: 'Completed',
      type: type === 'income' ? 'income' : 'expense',
      icon,
    };

    try {
      await createTransaction(newTransaction);

      navigate('/transactions');
    } catch (error) {
      console.error('Failed to create transaction:', error);

      alert(
        error.message || 'Failed to save transaction. Please try again.'
      );
    }
  };

  return (
    <>
      <header className="flex items-center gap-md">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary hover:bg-surface-container-high cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Add Transaction</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            Log a new income or expense item
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full">
        <Card className="p-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            {/* Type Selector (Income vs Expense) */}
            <div className="flex bg-surface-container rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory(expenseCategories[0]);
                }}
                className={`flex-1 py-2 font-label-caps text-label-caps rounded-md transition-colors ${type === 'expense'
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                  }`}
              >
                EXPENSE
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory(incomeCategories[0]);
                }}
                className={`flex-1 py-2 font-label-caps text-label-caps rounded-md transition-colors ${type === 'income'
                    ? 'bg-tertiary-container text-on-tertiary-container font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                  }`}
              >
                INCOME
              </button>
            </div>

            <Input
              label={`AMOUNT (${currencySymbol})`}
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <Select
              label="CATEGORY"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={
                type === 'income'
                  ? incomeCategories.map((c) => ({ value: c, label: c }))
                  : expenseCategories.map((c) => ({ value: c, label: c }))
              }
            />

            <Input
              label="DATE"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <Input
              label="DESCRIPTION / NOTE"
              type="text"
              placeholder="e.g. Lunch with team"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex gap-md justify-end mt-md">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                CANCEL
              </Button>
              <Button type="submit" variant="primary">
                SAVE TRANSACTION
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
