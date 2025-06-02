import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useTransactions } from '../contexts/TransactionsContext';
import { Goal } from '../types';
import { Plus, Target, TrendingDown, CheckCircle, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { format, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/StatCard';
import BarChart from '../components/charts/BarChart';
import GoalForm from '../components/GoalForm';

const Goals: React.FC = () => {
  const intl = useIntl();
  const { transactions, calculateTotal } = useTransactions();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  // Calculate current month's savings
  const currentDate = new Date();
  const currentMonth = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);
  
  const currentMonthTransactions = transactions.filter(transaction =>
    isWithinInterval(new Date(transaction.date), {
      start: currentMonth,
      end: currentMonthEnd
    })
  );

  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthSavings = currentMonthIncome - currentMonthExpenses;

  // Calculate previous month's data for comparison
  const previousMonth = startOfMonth(subMonths(currentDate, 1));
  const previousMonthEnd = endOfMonth(subMonths(currentDate, 1));

  const previousMonthTransactions = transactions.filter(transaction =>
    isWithinInterval(new Date(transaction.date), {
      start: previousMonth,
      end: previousMonthEnd
    })
  );

  const previousMonthExpenses = previousMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseChange = previousMonthExpenses 
    ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 
    : 0;

  // Prepare data for expense comparison chart
  const expenseComparisonData = [
    {
      name: format(previousMonth, 'MMM yyyy'),
      expenses: previousMonthExpenses
    },
    {
      name: format(currentMonth, 'MMM yyyy'),
      expenses: currentMonthExpenses
    }
  ];

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete || !user) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchGoals();
      setShowDeleteConfirm(false);
      setGoalToDelete(null);
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert(intl.formatMessage({ id: 'common.error' }));
    }
  };

  const DeleteConfirmationDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4 text-red-600">
          <AlertCircle className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-medium">{intl.formatMessage({ id: 'goals.deleteConfirmTitle' })}</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          {intl.formatMessage(
            { id: 'goals.deleteConfirmMessage' },
            { title: goalToDelete?.title }
          )}
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {intl.formatMessage({ id: 'common.cancel' })}
          </button>
          <button
            onClick={confirmDeleteGoal}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            {intl.formatMessage({ id: 'common.delete' })}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-700">
          {intl.formatMessage({ id: 'goals.title' })}
        </h2>
        <button
          onClick={() => {
            setEditingGoal(null);
            setShowGoalForm(true);
          }}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          {intl.formatMessage({ id: 'goals.setNew' })}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={intl.formatMessage({ id: 'goals.currentSavings' })}
          value={currentMonthSavings}
          icon={<Target className="w-5 h-5" />}
          type={currentMonthSavings >= 0 ? 'income' : 'expense'}
        />
        <StatCard
          title={intl.formatMessage({ id: 'goals.monthlyExpenses' })}
          value={currentMonthExpenses}
          change={expenseChange}
          icon={<TrendingDown className="w-5 h-5" />}
          type="expense"
        />
        <StatCard
          title={intl.formatMessage({ id: 'goals.totalBalance' })}
          value={calculateTotal()}
          icon={<CheckCircle className="w-5 h-5" />}
          type="balance"
        />
      </div>

      {/* Goals Progress */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {intl.formatMessage({ id: 'goals.activeGoals' })}
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{intl.formatMessage({ id: 'goals.loading' })}</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">{intl.formatMessage({ id: 'goals.noGoals' })}</p>
            <button
              onClick={() => setShowGoalForm(true)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              {intl.formatMessage({ id: 'goals.setFirst' })}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => (
              <div
                key={goal.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-800">{goal.title}</h4>
                    <p className="text-sm text-gray-500">{goal.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round((goal.current_amount / goal.target_amount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (goal.current_amount / goal.target_amount) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Target Amount</p>
                    <p className="font-medium text-gray-800">
                      {intl.formatNumber(goal.target_amount, {
                        style: 'currency',
                        currency: 'USD'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Amount</p>
                    <p className="font-medium text-gray-800">
                      {intl.formatNumber(goal.current_amount, {
                        style: 'currency',
                        currency: 'USD'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showGoalForm && (
        <GoalForm
          onClose={() => {
            setShowGoalForm(false);
            setEditingGoal(null);
          }}
          onGoalAdded={fetchGoals}
          editingGoal={editingGoal}
        />
      )}

      {showDeleteConfirm && <DeleteConfirmationDialog />}
    </div>
  );
};

export default Goals;