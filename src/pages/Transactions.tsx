import React, { useState } from 'react';
import { useTransactions } from '../contexts/TransactionsContext';
import TransactionList from '../components/TransactionList';
import TransactionForm from '../components/TransactionForm';
import { Transaction, FilterOptions } from '../types';
import { Plus, Filter, Download, Search } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const Transactions: React.FC = () => {
  const { 
    transactions, 
    deleteTransaction, 
    expenseCategories, 
    incomeCategories 
  } = useTransactions();
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    type: 'all',
    categories: []
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id);
    }
  };
  
  const closeForm = () => {
    setShowTransactionForm(false);
    setEditingTransaction(undefined);
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCategoryToggle = (categoryId: string) => {
    setFilters(prev => {
      const newCategories = prev.categories?.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...(prev.categories || []), categoryId];
      
      return {
        ...prev,
        categories: newCategories
      };
    });
  };
  
  const resetFilters = () => {
    setFilters({
      startDate: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      type: 'all',
      categories: []
    });
    setSearchTerm('');
    setShowFilters(false);
  };
  
  // Apply filters
  const filteredTransactions = transactions.filter(transaction => {
    // Date filter
    const transactionDate = new Date(transaction.date);
    const isDateInRange = (!filters.startDate || transactionDate >= new Date(filters.startDate)) &&
                         (!filters.endDate || transactionDate <= new Date(filters.endDate));
    
    // Type filter
    const matchesType = filters.type === 'all' || transaction.type === filters.type;
    
    // Category filter
    const matchesCategory = !filters.categories?.length || filters.categories.includes(transaction.category);
    
    // Search term
    const matchesSearch = !searchTerm || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return isDateInRange && matchesType && matchesCategory && matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Export transactions as CSV
  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
    
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.category}"`,
        t.amount,
        t.type
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-700">Transactions</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 px-3 py-2 rounded-md transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          
          <button
            onClick={exportCSV}
            className="flex items-center text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 px-3 py-2 rounded-md transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={() => setShowTransactionForm(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Filter Transactions</h3>
              <button 
                onClick={resetFilters}
                className="text-blue-600 text-sm hover:text-blue-800"
              >
                Reset Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="flex items-center text-gray-500">to</span>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Transactions</option>
                  <option value="expense">Expenses Only</option>
                  <option value="income">Income Only</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              <div className="flex flex-wrap gap-2">
                {[...expenseCategories, ...incomeCategories].map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      filters.categories?.includes(category.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Transactions List */}
      <TransactionList 
        transactions={filteredTransactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        categories={[...expenseCategories, ...incomeCategories]}
      />
      
      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <nav className="flex items-center space-x-2">
          <button className="px-3 py-1 rounded border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button className="px-3 py-1 rounded bg-blue-600 text-white">1</button>
          <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">2</button>
          <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">3</button>
          <button className="px-3 py-1 rounded border border-gray-300 text-gray-500 hover:bg-gray-50">
            Next
          </button>
        </nav>
      </div>
      
      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm 
          onClose={closeForm} 
          editTransaction={editingTransaction}
        />
      )}
    </div>
  );
};

export default Transactions;