import React from 'react';
import { useLocation } from 'react-router-dom';
import { UserCircle, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useIntl } from 'react-intl';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const intl = useIntl();
  
  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return intl.formatMessage({ id: 'nav.dashboard' });
      case '/transactions':
        return intl.formatMessage({ id: 'nav.transactions' });
      case '/reports':
        return intl.formatMessage({ id: 'nav.reports' });
      case '/settings':
        return intl.formatMessage({ id: 'nav.settings' });
      default:
        return 'FinTrack';
    }
  };
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-4 md:px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">{getTitle()}</h1>
        
        <div className="flex items-center space-x-4">
          <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center space-x-2">
            <UserCircle className="w-8 h-8 text-gray-600" />
            <span className="hidden md:inline text-sm font-medium text-gray-700">
              {profile?.full_name || 'Loading...'}
            </span>
          </div>

          <button
            onClick={() => signOut()}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-red-600"
            aria-label="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;