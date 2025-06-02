import React, { useState, useEffect } from 'react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useProfile } from '../contexts/ProfileContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useIntl } from 'react-intl';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Bell, Download, Upload, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { transactions } = useTransactions();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { locale, setLocale } = useLanguage();
  const intl = useIntl();
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'month' | 'all' | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    currency: 'EUR',
    language: locale,
    theme: profile?.theme || 'light'
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        theme: profile.theme || 'light'
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.theme) {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(profile.theme);
    }
  }, [profile?.theme]);
  
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'theme') {
      try {
        await updateProfile({ theme: value });
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(value);
      } catch (error) {
        console.error('Error updating theme:', error);
      }
    }

    if (name === 'language') {
      setLocale(value);
    }
  };
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        full_name: formData.full_name,
        theme: formData.theme
      });
      alert('Profile settings saved successfully!');
    } catch (error) {
      alert('Error saving profile settings');
    }
  };
  
  const exportData = () => {
    const data = {
      profile: profile,
      transactions: transactions
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fintrack_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteConfirm = async () => {
    if (!user) return;

    try {
      if (deleteType === 'month') {
        const startDate = startOfMonth(new Date(selectedMonth));
        const endDate = endOfMonth(new Date(selectedMonth));

        const { error: transactionError } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id)
          .gte('date', startDate.toISOString())
          .lte('date', endDate.toISOString());

        if (transactionError) throw transactionError;

        alert(`Data for ${format(startDate, 'MMMM yyyy')} has been deleted successfully!`);
      } else if (deleteType === 'all') {
        const { error: transactionError } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id);

        if (transactionError) throw transactionError;

        const { error: goalsError } = await supabase
          .from('goals')
          .delete()
          .eq('user_id', user.id);

        if (goalsError) throw goalsError;

        alert('All data has been deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Failed to delete data. Please try again.');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteType(null);
    }
  };

  const DeleteConfirmationDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4 text-orange-600">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-medium">Warning</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          {deleteType === 'month' 
            ? `Are you sure you want to delete all data for ${format(new Date(selectedMonth), 'MMMM yyyy')}?`
            : 'Are you sure you want to delete ALL your data?'}
        </p>
        
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
          <p className="text-sm text-orange-700">
            This action cannot be undone. The only way to recover deleted data is by importing a previously exported backup file.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Yes, Delete Data
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-gray-700 mb-6">
        {intl.formatMessage({ id: 'nav.settings' })}
      </h2>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 font-medium text-sm flex items-center ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            {intl.formatMessage({ id: 'settings.profile' })}
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 font-medium text-sm flex items-center ${
              activeTab === 'notifications'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bell className="w-4 h-4 mr-2" />
            {intl.formatMessage({ id: 'settings.notifications' })}
          </button>
          
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-3 font-medium text-sm flex items-center ${
              activeTab === 'data'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            {intl.formatMessage({ id: 'settings.data' })}
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile}>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="sm:w-1/3">
                    <label className="block text-sm font-medium text-gray-700">
                      {intl.formatMessage({ id: 'settings.fullName' })}
                    </label>
                  </div>
                  <div className="sm:w-2/3 mt-1 sm:mt-0">
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="sm:w-1/3">
                    <label className="block text-sm font-medium text-gray-700">
                      {intl.formatMessage({ id: 'settings.language' })}
                    </label>
                  </div>
                  <div className="sm:w-2/3 mt-1 sm:mt-0">
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="sm:w-1/3">
                    <label className="block text-sm font-medium text-gray-700">
                      {intl.formatMessage({ id: 'settings.currency' })}
                    </label>
                  </div>
                  <div className="sm:w-2/3 mt-1 sm:mt-0">
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EUR">Euro (€)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="GBP">British Pound (£)</option>
                      <option value="JPY">Japanese Yen (¥)</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="sm:w-1/3">
                    <label className="block text-sm font-medium text-gray-700">
                      {intl.formatMessage({ id: 'settings.theme' })}
                    </label>
                  </div>
                  <div className="sm:w-2/3 mt-1 sm:mt-0">
                    <select
                      name="theme"
                      value={formData.theme}
                      onChange={handleChange}
                      className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">{intl.formatMessage({ id: 'theme.light' })}</option>
                      <option value="dark">{intl.formatMessage({ id: 'theme.dark' })}</option>
                    </select>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-5">
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {intl.formatMessage({ id: 'settings.saveChanges' })}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email_alerts"
                      name="email_alerts"
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email_alerts" className="font-medium text-gray-700">Email Alerts</label>
                    <p className="text-gray-500">Receive email notifications for important account updates</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="monthly_summary"
                      name="monthly_summary"
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="monthly_summary" className="font-medium text-gray-700">Monthly Summary</label>
                    <p className="text-gray-500">Receive a monthly financial summary report</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="budget_alerts"
                      name="budget_alerts"
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="budget_alerts" className="font-medium text-gray-700">Budget Alerts</label>
                    <p className="text-gray-500">Get notified when you're approaching your budget limits</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="tips"
                      name="tips"
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="tips" className="font-medium text-gray-700">Financial Tips</label>
                    <p className="text-gray-500">Receive personalized financial tips and advice</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'data' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Manage Your Data</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Export Data</h4>
                    <p className="text-sm text-gray-500">Download all your financial data as a JSON file</p>
                  </div>
                  <button
                    onClick={exportData}
                    className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Import Data</h4>
                    <p className="text-sm text-gray-500">Upload a JSON file to import your data</p>
                  </div>
                  <label className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-orange-100 rounded-md">
                  <div>
                    <h4 className="text-base font-medium text-orange-600">Delete Monthly Data</h4>
                    <p className="text-sm text-orange-500">Delete all transactions for a specific month</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      onClick={() => {
                        setDeleteType('month');
                        setShowDeleteConfirm(true);
                      }}
                      className="flex items-center bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 transition-colors"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Delete Month
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-red-100 rounded-md">
                  <div>
                    <h4 className="text-base font-medium text-red-600">Delete All Data</h4>
                    <p className="text-sm text-red-500">Delete all your transactions and goals. This action cannot be undone.</p>
                  </div>
                  <button
                    onClick={() => {
                      setDeleteType('all');
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && <DeleteConfirmationDialog />}
    </div>
  );
};

export default Settings;