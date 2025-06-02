import React, { useState } from 'react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useIntl } from 'react-intl';
import StatCard from '../components/StatCard';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import TransactionForm from '../components/TransactionForm';
import { ChartData } from '../types';
import { Plus, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const Dashboard: React.FC = () => {
  const { 
    transactions,
    expenseCategories,
    incomeCategories,
    calculateTotal,
    calculateTotalByCategory
  } = useTransactions();
  const intl = useIntl();
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  
  // Get current date and previous month
  const currentDate = new Date();
  const currentMonth = startOfMonth(currentDate);
  const previousMonth = startOfMonth(subMonths(currentDate, 1));
  
  // Filter transactions for current and previous month
  const currentMonthTransactions = transactions.filter(transaction =>
    isWithinInterval(new Date(transaction.date), {
      start: currentMonth,
      end: endOfMonth(currentDate)
    })
  );
  
  const previousMonthTransactions = transactions.filter(transaction =>
    isWithinInterval(new Date(transaction.date), {
      start: previousMonth,
      end: endOfMonth(previousMonth)
    })
  );
  
  // Calculate totals for current month
  const currentIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const currentExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const currentBalance = currentIncome - currentExpense;
  
  // Calculate totals for previous month
  const previousIncome = previousMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const previousExpense = previousMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  // Calculate percentage changes
  const incomeChange = previousIncome ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
  const expenseChange = previousExpense ? ((currentExpense - previousExpense) / previousExpense) * 100 : 0;
  const balanceChange = previousIncome - previousExpense !== 0 
    ? ((currentBalance - (previousIncome - previousExpense)) / (previousIncome - previousExpense)) * 100 
    : 0;
  
  // Prepare data for expense by category pie chart
  const expenseTotalsByCategory = calculateTotalByCategory();
  
  const expenseChartData: ChartData[] = expenseCategories
    .map(category => {
      const value = expenseTotalsByCategory[category.id] || 0;
      // Only show categories with expenses (negative values)
      return value < 0 ? {
        name: category.name,
        value: Math.abs(value),
        color: category.color
      } : null;
    })
    .filter((item): item is ChartData => item !== null);
  
  // Prepare data for income by category pie chart
  const incomeChartData: ChartData[] = incomeCategories
    .map(category => {
      const value = expenseTotalsByCategory[category.id] || 0;
      // Only show categories with income (positive values)
      return value > 0 ? {
        name: category.name,
        value: value,
        color: category.color
      } : null;
    })
    .filter((item): item is ChartData => item !== null);
  
  // Prepare data for monthly comparison bar chart
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(currentDate, 5 - i);
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);
    
    const monthTransactions = transactions.filter(transaction => 
      isWithinInterval(new Date(transaction.date), { start: startDate, end: endDate })
    );
    
    const monthIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const monthExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name: format(month, 'MMM'),
      income: monthIncome,
      expense: monthExpense
    };
  });
  
  return (
    <div className="space-y-6">
      {/* Header with Add Transaction button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-700">
          {intl.formatMessage({ id: 'dashboard.overview' })}
        </h2>
        <button
          onClick={() => setShowTransactionForm(true)}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          {intl.formatMessage({ id: 'transactions.add' })}
        </button>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title={intl.formatMessage({ id: 'dashboard.balance' })}
          value={currentBalance}
          change={balanceChange}
          icon={<Wallet className="w-5 h-5" />}
          type="balance"
        />
        <StatCard 
          title={intl.formatMessage({ id: 'dashboard.income' })}
          value={currentIncome}
          change={incomeChange}
          icon={<TrendingUp className="w-5 h-5" />}
          type="income"
        />
        <StatCard 
          title={intl.formatMessage({ id: 'dashboard.expenses' })}
          value={currentExpense}
          change={expenseChange}
          icon={<TrendingDown className="w-5 h-5" />}
          type="expense"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart 
          data={expenseChartData} 
          title={intl.formatMessage({ id: 'transactions.expenses' })} 
        />
        <BarChart 
          data={last6Months} 
          title={intl.formatMessage({ id: 'dashboard.monthlyComparison' })} 
        />
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {intl.formatMessage({ id: 'dashboard.recentTransactions' })}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {intl.formatMessage({ id: 'transactions.date' })}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {intl.formatMessage({ id: 'transactions.description' })}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {intl.formatMessage({ id: 'transactions.category' })}
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {intl.formatMessage({ id: 'transactions.amount' })}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentMonthTransactions.slice(0, 5).map(transaction => {
                const category = transaction.type === 'expense' 
                  ? expenseCategories.find(c => c.id === transaction.category)
                  : incomeCategories.find(c => c.id === transaction.category);
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{transaction.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {category && (
                        <span 
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {category.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'income' ? '+' : '-'}€{transaction.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              
              {currentMonthTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                    {intl.formatMessage({ id: 'transactions.noData' })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Transaction Modal */}
      {showTransactionForm && (
        <TransactionForm onClose={() => setShowTransactionForm(false)} />
      )}
    </div>
  );
};

export default Dashboard;