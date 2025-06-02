import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Category } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/sampleData';
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
  addCategory: (category: Omit<Category, 'id'>, type: 'expense' | 'income') => void;
  calculateTotal: (type?: 'expense' | 'income') => number;
  calculateTotalByCategory: () => Record<string, number>;
  filterTransactions: (filters: Partial<Transaction>) => Transaction[];
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

  // Update categories when language changes
  useEffect(() => {
    const { expense, income } = locale === 'fr' 
      ? {
          expense: EXPENSE_CATEGORIES.map(cat => ({
            ...cat,
            name: cat.name // French names are now default in sampleData
          })),
          income: INCOME_CATEGORIES.map(cat => ({
            ...cat,
            name: cat.name // French names are now default in sampleData
          }))
        }
      : {
          expense: EXPENSE_CATEGORIES.map(cat => ({
            ...cat,
            name: getEnglishName(cat.id, 'expense')
          })),
          income: INCOME_CATEGORIES.map(cat => ({
            ...cat,
            name: getEnglishName(cat.id, 'income')
          }))
        };

    setExpenseCategories(expense);
    setIncomeCategories(income);
  }, [locale]);

  const getEnglishName = (id: string, type: 'expense' | 'income') => {
    const englishNames: Record<string, string> = {
      // Expense categories
      daily: 'Daily Expenses',
      transport: 'Transportation',
      leisure: 'Leisure & Entertainment',
      groceries: 'Groceries',
      home: 'Home & Utilities',
      health: 'Health & Wellness',
      travel: 'Travel & Vacation',
      education: 'Education',
      other: 'Other Expenses',
      // Income categories
      salary: 'Salary & Wages',
      freelance: 'Freelance',
      investments: 'Investments',
      gifts: 'Gifts',
      refunds: 'Refunds',
      other_income: 'Other Income'
    };

    return englishNames[id] || id;
  };

  useEffect(() => {
    if (user) {
      ensureUserProfile();
      fetchTransactions();
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

  const addCategory = (category: Omit<Category, 'id'>, type: 'expense' | 'income') => {
    const newCategory: Category = {
      ...category,
      id: category.name.toLowerCase().replace(/\s+/g, '_'),
    };

    if (type === 'expense') {
      setExpenseCategories(prev => [...prev, newCategory]);
    } else {
      setIncomeCategories(prev => [...prev, newCategory]);
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
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};