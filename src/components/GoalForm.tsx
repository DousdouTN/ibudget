import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTransactions } from '../contexts/TransactionsContext';
import { Goal } from '../types';

interface GoalFormProps {
  onClose: () => void;
  onGoalAdded: () => void;
  editingGoal?: Goal;
}

const GoalForm: React.FC<GoalFormProps> = ({ onClose, onGoalAdded, editingGoal }) => {
  const intl = useIntl();
  const { user } = useAuth();
  const { expenseCategories } = useTransactions();
  
  const [formData, setFormData] = useState({
    type: 'savings',
    target_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    category: '',
    title: '',
    description: ''
  });

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        type: editingGoal.type,
        target_amount: editingGoal.target_amount.toString(),
        start_date: editingGoal.start_date,
        end_date: editingGoal.end_date,
        category: editingGoal.category || '',
        title: editingGoal.title,
        description: editingGoal.description || ''
      });
    }
  }, [editingGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update({
            ...formData,
            target_amount: parseFloat(formData.target_amount),
          })
          .eq('id', editingGoal.id)
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('goals')
          .insert([{
            ...formData,
            target_amount: parseFloat(formData.target_amount),
            user_id: user?.id,
            current_amount: 0
          }]);

        if (error) throw error;
      }
      
      onGoalAdded();
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert(intl.formatMessage({ id: 'common.error' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {editingGoal 
              ? intl.formatMessage({ id: 'goals.edit' })
              : intl.formatMessage({ id: 'goals.setNew' })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {intl.formatMessage({ id: 'goals.titleLabel' })}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder={intl.formatMessage({ id: 'goals.titlePlaceholder' })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {intl.formatMessage({ id: 'goals.targetAmount' })}
            </label>
            <input
              type="number"
              name="target_amount"
              value={formData.target_amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder={intl.formatMessage({ id: 'goals.amountPlaceholder' })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {intl.formatMessage({ id: 'goals.startDate' })}
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {intl.formatMessage({ id: 'goals.endDate' })}
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {intl.formatMessage({ id: 'goals.description' })}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={intl.formatMessage({ id: 'goals.descriptionPlaceholder' })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {intl.formatMessage({ id: 'common.cancel' })}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingGoal
                ? intl.formatMessage({ id: 'common.save' })
                : intl.formatMessage({ id: 'goals.create' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalForm;