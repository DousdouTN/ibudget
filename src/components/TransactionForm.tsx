import React, { useState, useEffect } from 'react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useIntl } from 'react-intl';
import { Transaction } from '../types';
import { X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CategoryForm from './CategoryForm';

interface TransactionFormProps {
  onClose: () => void;
  editTransaction?: Transaction;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, editTransaction }) => {
  const { addTransaction, updateTransaction, expenseCategories, incomeCategories } = useTransactions();
  const intl = useIntl();
  const { user } = useAuth();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [allocationAmount, setAllocationAmount] = useState<number>(0);
  
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    date: editTransaction?.date || new Date().toISOString().split('T')[0],
    amount: editTransaction?.amount || 0,
    description: editTransaction?.description || '',
    category: editTransaction?.category || '',
    type: editTransaction?.type || 'expense',
    is_recurring: editTransaction?.is_recurring || false,
    recurrence_interval: editTransaction?.recurrence_interval || 'monthly',
    next_due_date: editTransaction?.next_due_date || new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const currentDate = new Date().toISOString();
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'savings')
        .gte('end_date', currentDate);

      if (error) throw error;

      // Filter goals in JavaScript where current_amount is less than target_amount
      const filteredGoals = (data || []).filter(goal => 
        parseFloat(goal.current_amount) < parseFloat(goal.target_amount)
      );

      setGoals(filteredGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'amount' ? parseFloat(value) : value,
    }));

    // Reset goal allocation when changing transaction type
    if (name === 'type') {
      setSelectedGoal('');
      setAllocationAmount(0);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editTransaction) {
        await updateTransaction(editTransaction.id, formData);
      } else {
        // For goals type, create a transaction and update the goal progress
        if (formData.type === 'goals' && selectedGoal) {
          const transactionData = {
            ...formData,
            type: 'expense', // Save as expense to maintain correct balance calculations
            description: `Savings: ${goals.find(g => g.id === selectedGoal)?.title || 'Goal'}`,
            category: 'savings'
          };
          
          await addTransaction(transactionData);

          const { error } = await supabase.rpc('update_goal_progress', {
            p_goal_id: selectedGoal,
            p_amount: allocationAmount
          });

          if (error) throw error;
        } else {
          await addTransaction(formData);

          // Update goal progress for regular transactions if goal is selected
          if (selectedGoal && allocationAmount > 0) {
            const { error } = await supabase.rpc('update_goal_progress', {
              p_goal_id: selectedGoal,
              p_amount: formData.type === 'expense' ? -allocationAmount : allocationAmount
            });

            if (error) throw error;
          }
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction. Please try again.');
    }
  };
  
  const categories = formData.type === 'expense' ? expenseCategories : incomeCategories;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {editTransaction 
              ? intl.formatMessage({ id: 'transactions.edit' })
              : intl.formatMessage({ id: 'transactions.add' })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {intl.formatMessage({ id: 'transactions.type' })}
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="expense">{intl.formatMessage({ id: 'transactions.expense' })}</option>
                  <option value="income">{intl.formatMessage({ id: 'transactions.income' })}</option>
                  <option value="goals">{intl.formatMessage({ id: 'goals.type.savings' })}</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {intl.formatMessage({ id: 'transactions.date' })}
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {intl.formatMessage({ id: 'transactions.amount' })}
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount || ''}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {formData.type === 'goals' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {intl.formatMessage({ id: 'goals.allocateToGoal' })}
                </label>
                <select
                  value={selectedGoal}
                  onChange={(e) => {
                    setSelectedGoal(e.target.value);
                    setAllocationAmount(formData.amount);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a goal</option>
                  {goals.map(goal => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title} (€{goal.target_amount - goal.current_amount} remaining)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {intl.formatMessage({ id: 'transactions.description' })}
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {intl.formatMessage({ id: 'transactions.category' })}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {intl.formatMessage({ id: 'categories.add' })}
                    </button>
                  </div>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="" disabled>{intl.formatMessage({ id: 'transactions.selectCategory' })}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">
                    {intl.formatMessage({ id: 'transactions.recurring' })}
                  </label>
                </div>

                {formData.is_recurring && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {intl.formatMessage({ id: 'transactions.interval' })}
                      </label>
                      <select
                        name="recurrence_interval"
                        value={formData.recurrence_interval}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="monthly">{intl.formatMessage({ id: 'transactions.monthly' })}</option>
                        <option value="weekly">{intl.formatMessage({ id: 'transactions.weekly' })}</option>
                        <option value="yearly">{intl.formatMessage({ id: 'transactions.yearly' })}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {intl.formatMessage({ id: 'transactions.nextDate' })}
                      </label>
                      <input
                        type="date"
                        name="next_due_date"
                        value={formData.next_due_date}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Goal Allocation Section */}
                {goals.length > 0 && formData.type !== 'goals' && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {formData.type === 'expense' 
                        ? intl.formatMessage({ id: 'goals.trackExpenseForGoal' })
                        : intl.formatMessage({ id: 'goals.allocateToGoal' })}
                    </h3>
                    
                    <div className="space-y-3">
                      <select
                        value={selectedGoal}
                        onChange={(e) => setSelectedGoal(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a goal</option>
                        {goals.map(goal => (
                          <option key={goal.id} value={goal.id}>
                            {goal.title} (€{goal.target_amount - goal.current_amount} remaining)
                          </option>
                        ))}
                      </select>

                      {selectedGoal && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {formData.type === 'expense'
                              ? intl.formatMessage({ id: 'goals.amountToTrack' })
                              : intl.formatMessage({ id: 'goals.amountToAllocate' })}
                          </label>
                          <input
                            type="number"
                            value={allocationAmount}
                            onChange={(e) => setAllocationAmount(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            max={formData.amount}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="mt-6 flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {intl.formatMessage({ id: 'common.cancel' })}
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editTransaction 
                ? intl.formatMessage({ id: 'common.save' })
                : intl.formatMessage({ id: 'transactions.add' })}
            </button>
          </div>
        </form>
      </div>

      {showCategoryForm && (
        <CategoryForm
          onClose={() => setShowCategoryForm(false)}
          type={formData.type}
        />
      )}
    </div>
  );
};

export default TransactionForm;