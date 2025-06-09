import React, { useState } from 'react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useIntl } from 'react-intl';
import { Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { Category } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CategoryManagerProps {
  onClose: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
  const { expenseCategories, incomeCategories, refreshCategories, transactions } = useTransactions();
  const intl = useIntl();
  const { user } = useAuth();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    color: '#3B82F6',
    icon: 'tag'
  });

  const allCategories = [...expenseCategories, ...incomeCategories];

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      color: category.color,
      icon: category.icon
    });
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
    
    // Find transactions using this category
    const transactionsUsingCategory = transactions.filter(t => t.category === category.id);
    if (transactionsUsingCategory.length > 0) {
      // Set default target category (first category of same type, excluding the one being deleted)
      const sameTypeCategories = category.type === 'expense' 
        ? expenseCategories.filter(c => c.id !== category.id)
        : incomeCategories.filter(c => c.id !== category.id);
      
      if (sameTypeCategories.length > 0) {
        setTargetCategoryId(sameTypeCategories[0].id);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editForm.name,
          color: editForm.color,
          icon: editForm.icon
        })
        .eq('id', editingCategory.id)
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshCategories();
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // First, update transactions to use the target category if specified
      const transactionsUsingCategory = transactions.filter(t => t.category === categoryToDelete.id);
      
      if (transactionsUsingCategory.length > 0 && targetCategoryId) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ category: targetCategoryId })
          .eq('category', categoryToDelete.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      // Then delete the category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await refreshCategories();
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      setTargetCategoryId('');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransactionCount = (categoryId: string) => {
    return transactions.filter(t => t.category === categoryId).length;
  };

  const DeleteConfirmDialog = () => {
    if (!categoryToDelete) return null;

    const transactionCount = getTransactionCount(categoryToDelete.id);
    const sameTypeCategories = categoryToDelete.type === 'expense' 
      ? expenseCategories.filter(c => c.id !== categoryToDelete.id)
      : incomeCategories.filter(c => c.id !== categoryToDelete.id);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center mb-4 text-red-600">
            <AlertTriangle className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-medium">Delete Category</h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete the category "{categoryToDelete.name}"?
          </p>

          {transactionCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-sm text-yellow-700 mb-3">
                This category is used by {transactionCount} transaction(s). 
                {sameTypeCategories.length > 0 
                  ? ' Please select a category to move these transactions to:'
                  : ' These transactions will lose their category assignment.'}
              </p>
              
              {sameTypeCategories.length > 0 && (
                <select
                  value={targetCategoryId}
                  onChange={(e) => setTargetCategoryId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select target category</option>
                  {sameTypeCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setCategoryToDelete(null);
                setTargetCategoryId('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              disabled={isSubmitting || (transactionCount > 0 && sameTypeCategories.length > 0 && !targetCategoryId)}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Category'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Manage Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Categories */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {intl.formatMessage({ id: 'transactions.expenses' })} Categories
            </h3>
            <div className="space-y-3">
              {expenseCategories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <span className="font-medium text-gray-800">{category.name}</span>
                      <p className="text-xs text-gray-500">
                        {getTransactionCount(category.id)} transactions
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Income Categories */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {intl.formatMessage({ id: 'transactions.income' })} Categories
            </h3>
            <div className="space-y-3">
              {incomeCategories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <span className="font-medium text-gray-800">{category.name}</span>
                      <p className="text-xs text-gray-500">
                        {getTransactionCount(category.id)} transactions
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Category Form */}
        {editingCategory && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Edit Category: {editingCategory.name}
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={editForm.color}
                    onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showDeleteConfirm && <DeleteConfirmDialog />}
      </div>
    </div>
  );
};

export default CategoryManager;