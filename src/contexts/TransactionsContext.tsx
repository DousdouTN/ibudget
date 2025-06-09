import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Category } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  expenseCategories: Category[];
  incomeCategories: Category[];
  addCategory: (category: Omit<Category, 'id'>, type: 'expense' | 'income') => Promise<void>;
  calculateTotal: (type?: 'expense' | 'income') => number;
  calculateTotalByCategory: () => Record<string, number>;
  filterTransactions: (filters: Partial<Transaction>) => Transaction[];
  refreshCategories: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};

export const TransactionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const { user } = useAuth();
  const { locale } = useLanguage();

  useEffect(() => {
    if (user) {
      ensureUserProfile();
      fetchTransactions();
      fetchCategories();
    }
  }, [user]);

  const ensureUserProfile = async () => {
    if (!user) return;

    try {
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id);

      if (fetchError) throw fetchError;

      if (!profiles || profiles.length === 0) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: user.id }]);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const fetchCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      const expenses = data?.filter(cat => cat.type === 'expense') || [];
      const incomes = data?.filter(cat => cat.type === 'income') || [];

      // Apply language-specific names if needed
      const processedExpenses = expenses.map(cat => ({
        ...cat,
        name: getLocalizedCategoryName(cat.name, 'expense')
      }));

      const processedIncomes = incomes.map(cat => ({
        ...cat,
        name: getLocalizedCategoryName(cat.name, 'income')
      }));

      setExpenseCategories(processedExpenses);
      setIncomeCategories(processedIncomes);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getLocalizedCategoryName = (originalName: string, type: 'expense' | 'income') => {
    if (locale === 'en') {
      const englishNames: Record<string, string> = {
        // Expense categories
        'Dépenses Quotidiennes': 'Daily Expenses',
        'Transport': 'Transportation',
        'Loisirs & Divertissement': 'Leisure & Entertainment',
        'Courses': 'Groceries',
        'Maison & Services': 'Home & Utilities',
        'Santé & Bien-être': 'Health & Wellness',
        'Voyages & Vacances': 'Travel & Vacation',
        'Éducation': 'Education',
        'Épargne': 'Savings',
        'Autres Dépenses': 'Other Expenses',
        // Income categories
        'Salaire': 'Salary & Wages',
        'Freelance': 'Freelance',
        'Investissements': 'Investments',
        'Cadeaux': 'Gifts',
        'Remboursements': 'Refunds',
        'Autres Revenus': 'Other Income'
      };

      return englishNames[originalName] || originalName;
    }

    return originalName; // Return original French name
  };

  const refreshCategories = async () => {
    await fetchCategories();
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      await ensureUserProfile();

      const { error } = await supabase
        .from('transactions')
        .insert([{ ...transaction, user_id: user.id }]);

      if (error) throw error;
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const updateTransaction = async (id: string, updatedFields: Partial<Transaction>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update(updatedFields)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>, type: 'expense' | 'income') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          ...category,
          type,
          user_id: user.id
        }]);

      if (error) throw error;
      
      // Refresh categories after adding
      await fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const calculateTotal = (type?: 'expense' | 'income') => {
    if (!type) {
      const incomeTotal = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenseTotal = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return incomeTotal - expenseTotal;
    }
    
    return transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateTotalByCategory = () => {
    return transactions.reduce((acc, transaction) => {
      const { category, amount, type } = transaction;
      const key = category;
      const value = type === 'expense' ? -amount : amount;
      
      return {
        ...acc,
        [key]: (acc[key] || 0) + value
      };
    }, {} as Record<string, number>);
  };

  const filterTransactions = (filters: Partial<Transaction>) => {
    return transactions.filter(transaction => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined) return true;
        return transaction[key as keyof Transaction] === value;
      });
    });
  };

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        expenseCategories,
        incomeCategories,
        addCategory,
        calculateTotal,
        calculateTotalByCategory,
        filterTransactions,
        refreshCategories,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};