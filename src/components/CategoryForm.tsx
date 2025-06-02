import React, { useState } from 'react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useIntl } from 'react-intl';
import { X } from 'lucide-react';

interface CategoryFormProps {
  onClose: () => void;
  type: 'expense' | 'income';
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onClose, type }) => {
  const { addCategory } = useTransactions();
  const intl = useIntl();
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#000000',
    icon: 'tag'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCategory(formData, type);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            {type === 'expense' 
              ? intl.formatMessage({ id: 'categories.addExpense' })
              : intl.formatMessage({ id: 'categories.addIncome' })}
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
              {intl.formatMessage({ id: 'categories.name' })}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {intl.formatMessage({ id: 'categories.color' })}
            </label>
            <input
              type="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>

          <div className="flex justify-end space-x-3">
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
              {intl.formatMessage({ id: 'common.save' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;