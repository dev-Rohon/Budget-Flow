import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import {
  formatCurrencyWithSign,
  convertCurrency,
  getSelectedCurrency,
} from '../utils/currency';
import {
  getTransactions,
  deleteTransaction as deleteTransactionAPI,
  updateTransaction,
} from '../utils/api';

export function TransactionsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const categories = [
    'All',
    'Income',
    'Expense',
    'Food',
    'Housing',
    'Bills',
    'Shopping',
    'Transport',
    'Entertainment',
    'Health',
    'Education',
    'Other',
    // income categories
    'Salary',
    'Freelance',
    'Business',
    'Investment',
    'Interest',
    'Gift',
    'Other Income',
  ];
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [displayCurrency, setDisplayCurrency] = useState(getSelectedCurrency());
  const [conversionRate, setConversionRate] = useState(1);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    date: '',
    amount: '',
    type: 'expense',
    icon: 'receipt_long',
  });
  const [editLoading, setEditLoading] = useState(false);

  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await getTransactions();
        setTransactions(data);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        setTransactions([]);
      }
    };

    loadTransactions();
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

  const formatAmount = (amount, type) => {
    try {
      const convertedAmount = Number(amount || 0) * conversionRate;

      return formatCurrencyWithSign(
        convertedAmount,
        type,
        displayCurrency
      );
    } catch (e) {
      return `${type === 'income' ? '+' : '-'}${amount}`;
    }
  };

  const formatDate = (isoDate) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return isoDate;
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    // category filter
    let catMatch = true;
    if (activeFilter === 'Income') catMatch = tx.type === 'income';
    else if (activeFilter === 'Expense') catMatch = tx.type === 'expense';
    else if (activeFilter !== 'All') catMatch = tx.category === activeFilter;

    // search filter
    const search = searchTerm.trim().toLowerCase();
    const searchMatch = search === '' || (tx.name && tx.name.toLowerCase().includes(search));

    return catMatch && searchMatch;
  });

  const confirmDelete = (tx) => {
    setTransactionToDelete(tx);
  };

  const cancelDelete = () => {
    setTransactionToDelete(null);
  };

  const deleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      await deleteTransactionAPI(transactionToDelete.id);

      setTransactions((current) =>
        current.filter(
          (tx) => tx.id !== transactionToDelete.id
        )
      );

      setTransactionToDelete(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert(error.message || 'Failed to delete transaction');
    }
  };

  const startEdit = (tx) => {
    setTransactionToEdit(tx);

    setEditForm({
      name: tx.name,
      category: tx.category,
      date: tx.date,
      amount: tx.amount,
      type: tx.type,
      icon: tx.icon || 'receipt_long',
    });
  };

  const cancelEdit = () => {
    setTransactionToEdit(null);
  };

  const saveEdit = async () => {
    if (!transactionToEdit) return;

    if (!editForm.name.trim()) {
      alert('Transaction name cannot be empty');
      return;
    }

    if (!editForm.amount || Number(editForm.amount) <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    if (!editForm.category) {
      alert('Please select a category');
      return;
    }

    if (!editForm.date || Number.isNaN(Date.parse(editForm.date))) {
      alert('Please enter a valid date');
      return;
    }

    try {
      setEditLoading(true);

      const updatedTransaction = await updateTransaction(
        transactionToEdit.id,
        {
          name: editForm.name.trim(),
          category: editForm.category,
          date: editForm.date,
          amount: Number(editForm.amount),
          type: editForm.type,
          icon: editForm.icon || 'receipt_long',
        }
      );

      setTransactions((current) =>
        current.map((tx) =>
          tx.id === transactionToEdit.id
            ? updatedTransaction
            : tx
        )
      );

      setTransactionToEdit(null);
    } catch (error) {
      console.error('Failed to update transaction:', error);

      alert(
        error.message || 'Failed to update transaction.'
      );
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-md min-w-0 w-full">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Transactions</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            Inspect and search your transaction ledger history
          </p>
        </div>
        <Button icon="add" onClick={() => navigate('/add-transaction')}>
          NEW TRANSACTION
        </Button>
      </header>

      <Card className="flex flex-col gap-md min-w-0 w-full max-w-full">
        {/* Search & Category Filter Pills */}
        <div className="flex flex-col md:flex-row gap-md justify-between items-start md:items-center min-w-0 w-full">
          <div className="w-full md:w-80 min-w-0">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon="search"
            />
          </div>
          <div className="flex items-center gap-xs overflow-x-auto w-full md:w-auto min-w-0 pb-sm md:pb-0">
            <div className="flex gap-xs min-w-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-3 py-1.5 rounded-full font-label-caps text-label-caps whitespace-nowrap transition-colors ${activeFilter === cat
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto mt-sm min-w-0 w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-caps text-label-caps bg-surface-container-low">
                <th className="p-md">TRANSACTION</th>
                <th className="p-md">CATEGORY</th>
                <th className="p-md">DATE</th>
                <th className="p-md">STATUS</th>
                <th className="p-md text-right">AMOUNT</th>
                <th className="p-md text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-md text-center text-on-surface-variant">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-surface-bright dark:hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    <td className="p-md flex items-center gap-md">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'income'
                          ? 'bg-tertiary-container/10 text-on-tertiary-container'
                          : 'bg-surface-container text-on-surface-variant'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{tx.icon}</span>
                      </div>
                      <span className="font-body-sm text-body-sm font-semibold text-primary">{tx.name}</span>
                    </td>
                    <td className="p-md font-body-sm text-body-sm text-on-surface-variant">{tx.category}</td>
                    <td className="p-md font-body-sm text-body-sm text-on-surface-variant">{formatDate(tx.date)}</td>
                    <td className="p-md">
                      <Badge variant={tx.status === 'Completed' ? 'success' : 'warning'}>{tx.status}</Badge>
                    </td>
                    <td
                      className={`p-md text-right font-data-mono text-data-mono ${tx.type === 'income' ? 'font-bold text-on-tertiary-container' : 'font-medium text-primary'
                        }`}
                    >
                      {formatAmount(tx.amount, tx.type)}
                    </td>
                    <td className="p-md text-right">
                      <div className="flex items-center justify-end gap-sm">
                        <button
                          type="button"
                          onClick={() => startEdit(tx)}
                          className="text-on-surface-variant hover:text-primary transition-colors"
                          aria-label={`Edit ${tx.name}`}
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => confirmDelete(tx)}
                          className="text-on-surface-variant hover:text-error transition-colors"
                          aria-label={`Delete ${tx.name}`}
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-lg">
          <div className="absolute inset-0 bg-black/40" onClick={cancelDelete} />
          <Card className="w-full max-w-sm z-10">
            <div className="flex flex-col gap-md">
              <div>
                <h2 className="font-headline-md text-headline-md font-bold text-primary">Delete Transaction?</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                  Are you sure you want to delete this transaction?
                </p>
              </div>
              <div className="flex justify-end gap-sm">
                <Button variant="outline" onClick={cancelDelete}>CANCEL</Button>
                <Button variant="primary" onClick={deleteTransaction}>DELETE</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {transactionToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-lg">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={cancelEdit}
          />

          <Card className="w-full max-w-md z-10">
            <div className="flex flex-col gap-md">

              <div>
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  Edit Transaction
                </h2>

                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                  Update your transaction details
                </p>
              </div>

              <Input
                label="TRANSACTION"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    name: e.target.value,
                  })
                }
              />

              <Input
                label="AMOUNT"
                type="number"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    amount: e.target.value,
                  })
                }
              />

              <Select
                label="CATEGORY"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    category: e.target.value,
                  })
                }
                options={[
                  'Food',
                  'Housing',
                  'Bills',
                  'Shopping',
                  'Transport',
                  'Entertainment',
                  'Health',
                  'Education',
                  'Other',
                  'Salary',
                  'Freelance',
                  'Business',
                  'Investment',
                  'Interest',
                  'Gift',
                  'Other Income',
                ].map((category) => ({
                  value: category,
                  label: category,
                }))}
              />

              <Input
                label="DATE"
                type="date"
                value={editForm.date}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    date: e.target.value,
                  })
                }
              />

              <div className="flex gap-sm justify-end mt-sm">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={editLoading}
                >
                  CANCEL
                </Button>

                <Button
                  variant="primary"
                  onClick={saveEdit}
                  disabled={editLoading}
                >
                  {editLoading ? 'SAVING...' : 'SAVE CHANGES'}
                </Button>
              </div>

            </div>
          </Card>
        </div>
      )}
    </>
  );
}
