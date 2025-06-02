import React, { useState } from 'react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useIntl } from 'react-intl';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import { ChartData } from '../types';
import { Download, FileText } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLanguage } from '../contexts/LanguageContext';

const Reports: React.FC = () => {
  const { transactions, expenseCategories, incomeCategories } = useTransactions();
  const intl = useIntl();
  const { locale } = useLanguage();
  
  const [timePeriod, setTimePeriod] = useState('month');
  
  const getDateRange = () => {
    const currentDate = new Date();
    const endDate = endOfMonth(currentDate);
    let startDate;
    
    switch (timePeriod) {
      case 'month':
        startDate = startOfMonth(currentDate);
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(currentDate, 2));
        break;
      case 'year':
        startDate = startOfMonth(subMonths(currentDate, 11));
        break;
      default:
        startDate = startOfMonth(currentDate);
    }
    
    return { startDate, endDate };
  };
  
  const { startDate, endDate } = getDateRange();
  
  const filteredTransactions = transactions.filter(transaction =>
    isWithinInterval(new Date(transaction.date), {
      start: startDate,
      end: endDate
    })
  );
  
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netBalance = totalIncome - totalExpense;
  
  const expensesByCategory = expenseCategories.map(category => {
    const amount = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === category.id)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name: category.name,
      value: amount,
      color: category.color
    };
  }).filter(c => c.value > 0);
  
  const incomeByCategory = incomeCategories.map(category => {
    const amount = filteredTransactions
      .filter(t => t.type === 'income' && t.category === category.id)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name: category.name,
      value: amount,
      color: category.color
    };
  }).filter(c => c.value > 0);
  
  const getMonthlyData = () => {
    const months = [];
    for (let i = 0; i < (timePeriod === 'year' ? 12 : timePeriod === 'quarter' ? 3 : 1); i++) {
      const month = subMonths(new Date(), i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = transactions.filter(transaction =>
        isWithinInterval(new Date(transaction.date), {
          start: monthStart,
          end: monthEnd
        })
      );
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      months.unshift({
        name: format(month, 'MMM', { locale: locale === 'fr' ? fr : undefined }),
        income,
        expense
      });
    }
    return months;
  };
  
  const monthlyData = getMonthlyData();
  
  const getCategoryTotals = (type: 'expense' | 'income') => {
    const categories = type === 'expense' ? expenseCategories : incomeCategories;
    
    return categories.map(category => {
      const total = filteredTransactions
        .filter(t => t.type === type && t.category === category.id)
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        id: category.id,
        name: category.name,
        color: category.color,
        total
      };
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);
  };
  
  const topExpenseCategories = getCategoryTotals('expense').slice(0, 5);
  const topIncomeCategories = getCategoryTotals('income').slice(0, 5);
  
  const exportCSV = () => {
    const headers = [
      intl.formatMessage({ id: 'transactions.category' }),
      intl.formatMessage({ id: 'transactions.amount' }),
      'Percentage'
    ];
    
    const expenseData = expensesByCategory.map(category => [
      `"${category.name}"`,
      category.value,
      (category.value / totalExpense * 100).toFixed(2) + '%'
    ]);
    
    const incomeData = incomeByCategory.map(category => [
      `"${category.name}"`,
      category.value,
      (category.value / totalIncome * 100).toFixed(2) + '%'
    ]);
    
    const summary = [
      [intl.formatMessage({ id: 'dashboard.income' }), totalIncome, '100%'],
      [intl.formatMessage({ id: 'dashboard.expenses' }), totalExpense, '100%'],
      [intl.formatMessage({ id: 'dashboard.balance' }), netBalance, '']
    ];
    
    const csvContent = [
      '# ' + intl.formatMessage({ id: 'reports.title' }),
      `# ${intl.formatMessage({ id: 'reports.period' })}: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
      '',
      '## ' + intl.formatMessage({ id: 'dashboard.expenses' }),
      headers.join(','),
      ...expenseData.map(row => row.join(',')),
      '',
      '## ' + intl.formatMessage({ id: 'dashboard.income' }),
      headers.join(','),
      ...incomeData.map(row => row.join(',')),
      '',
      '## ' + intl.formatMessage({ id: 'reports.summary' }),
      [intl.formatMessage({ id: 'reports.item' }), intl.formatMessage({ id: 'transactions.amount' }), ''].join(','),
      ...summary.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-700">
          {intl.formatMessage({ id: 'reports.title' })}
        </h2>
        
        <div className="flex items-center space-x-3">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setTimePeriod('month')}
              className={`px-3 py-1.5 ${
                timePeriod === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {intl.formatMessage({ id: 'reports.month' })}
            </button>
            <button
              onClick={() => setTimePeriod('quarter')}
              className={`px-3 py-1.5 ${
                timePeriod === 'quarter' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {intl.formatMessage({ id: 'reports.quarter' })}
            </button>
            <button
              onClick={() => setTimePeriod('year')}
              className={`px-3 py-1.5 ${
                timePeriod === 'year' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {intl.formatMessage({ id: 'reports.year' })}
            </button>
          </div>
          
          <button
            onClick={exportCSV}
            className="flex items-center text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 px-3 py-2 rounded-md transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            {intl.formatMessage({ id: 'transactions.export' })}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-500 text-sm">{intl.formatMessage({ id: 'dashboard.income' })}</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">€{totalIncome.toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-500 text-sm">{intl.formatMessage({ id: 'dashboard.expenses' })}</h3>
          <p className="text-2xl font-bold text-red-600 mt-1">€{totalExpense.toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-500 text-sm">{intl.formatMessage({ id: 'dashboard.balance' })}</h3>
          <p className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            €{netBalance.toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart 
          data={expensesByCategory} 
          title={intl.formatMessage({ id: 'reports.expensesByCategory' })}
        />
        <BarChart 
          data={monthlyData} 
          title={intl.formatMessage({ id: 'dashboard.monthlyComparison' })}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-800">
              {intl.formatMessage({ id: 'reports.topExpenses' })}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {intl.formatMessage({ id: 'transactions.category' })}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {intl.formatMessage({ id: 'transactions.amount' })}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {intl.formatMessage({ id: 'reports.percentageTotal' })}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topExpenseCategories.map(category => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      €{category.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {((category.total / totalExpense) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
                
                {topExpenseCategories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                      {intl.formatMessage({ id: 'transactions.noData' })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-800">
              {intl.formatMessage({ id: 'reports.topIncome' })}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {intl.formatMessage({ id: 'transactions.category' })}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {intl.formatMessage({ id: 'transactions.amount' })}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {intl.formatMessage({ id: 'reports.percentageTotal' })}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topIncomeCategories.map(category => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      €{category.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {((category.total / totalIncome) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
                
                {topIncomeCategories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                      {intl.formatMessage({ id: 'transactions.noData' })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;