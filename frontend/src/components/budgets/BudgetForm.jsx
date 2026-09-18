import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { getCurrencySymbol } from '../../utils/currency';

export function BudgetForm({
  onCancel,
  onSave,
  existingCategories = [],
  mode = 'create',
  initialCategory,
  initialTotal,
}) {
  const [category, setCategory] = useState(initialCategory || 'Food');
  const [amount, setAmount] = useState(initialTotal !== undefined ? String(initialTotal) : '');
  const currencySymbol = getCurrencySymbol();

  const categoryOptions = [
    { value: 'Food', label: 'Food & Dining' },
    { value: 'Housing', label: 'Housing & Rent' },
    { value: 'Bills', label: 'Bills & Utilities' },
    { value: 'Shopping', label: 'Shopping & Apparel' },
    { value: 'Transport', label: 'Transportation' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Health', label: 'Health' },
    { value: 'Education', label: 'Education' },
    { value: 'Other', label: 'Other' },
  ];

  const handleSave = () => {
    if (!category) return alert('Please select a category');
    const num = Number(amount);
    if (!amount || Number.isNaN(num) || num <= 0) return alert('Please enter a valid positive amount');
    if (existingCategories.includes(category)) return alert('A budget for this category already exists');

    onSave({ category, total: Math.abs(num) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-lg">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <Card className="w-full max-w-md z-10">
        <h2 className="font-headline-md text-headline-md font-bold text-primary mb-sm">
          {mode === 'edit' ? 'Edit Budget' : 'Create Budget'}
        </h2>
        <div className="flex flex-col gap-md">
          <Select
            label="CATEGORY"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categoryOptions.map((o) => ({ value: o.value, label: o.label }))}
          />

          <Input label={`MONTHLY LIMIT (${currencySymbol})`} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />

          <div className="flex gap-md justify-end">
            <Button variant="outline" onClick={onCancel}>CANCEL</Button>
            <Button onClick={handleSave}>{mode === 'edit' ? 'SAVE CHANGES' : 'CREATE'}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default BudgetForm;
