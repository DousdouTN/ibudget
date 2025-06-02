import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListPlus, PieChart, Settings, BarChart3, Wallet, Target } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useIntl } from 'react-intl';

const Sidebar: React.FC = () => {
  const { calculateTotal } = useTransactions();
  const currentBalance = calculateTotal();
  const intl = useIntl();

  return (
    <aside className="w-16 md:w-64 h-screen bg-blue-800 text-white flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
      <div className="p-4 flex items-center justify-center md:justify-start">
        <Wallet className="h-8 w-8 text-white" />
        <span className="ml-2 text-xl font-bold hidden md:inline">FinTrack</span>
      </div>
      
      <nav className="flex-1 mt-8">
        <ul className="space-y-2 px-2">
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`
              }
            >
              <Home className="w-5 h-5" />
              <span className="ml-3 hidden md:inline">
                {intl.formatMessage({ id: 'nav.dashboard' })}
              </span>
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/transactions" 
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`
              }
            >
              <ListPlus className="w-5 h-5" />
              <span className="ml-3 hidden md:inline">
                {intl.formatMessage({ id: 'nav.transactions' })}
              </span>
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/reports" 
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`
              }
            >
              <BarChart3 className="w-5 h-5" />
              <span className="ml-3 hidden md:inline">
                {intl.formatMessage({ id: 'nav.reports' })}
              </span>
            </NavLink>
          </li>

          <li>
            <NavLink 
              to="/goals" 
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`
              }
            >
              <Target className="w-5 h-5" />
              <span className="ml-3 hidden md:inline">
                {intl.formatMessage({ id: 'nav.goals' })}
              </span>
            </NavLink>
          </li>
          
          <li className="mt-auto">
            <NavLink 
              to="/settings" 
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`
              }
            >
              <Settings className="w-5 h-5" />
              <span className="ml-3 hidden md:inline">
                {intl.formatMessage({ id: 'nav.settings' })}
              </span>
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 md:block hidden">
        <div className="bg-blue-900 rounded-md p-3">
          <p className="text-xs text-blue-200 mb-1">
            {intl.formatMessage({ id: 'dashboard.balance' })}
          </p>
          <p className="text-xl font-bold">€{currentBalance.toFixed(2)}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;