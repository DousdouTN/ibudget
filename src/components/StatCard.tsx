import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  change?: number;
  icon?: React.ReactNode;
  type?: 'income' | 'expense' | 'balance';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change = 0, 
  icon,
  type = 'balance'
}) => {
  const getColorClass = () => {
    switch (type) {
      case 'income':
        return 'text-green-600 bg-green-100';
      case 'expense':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 h-full transition-all duration-200 hover:shadow-md">
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${type === 'expense' ? 'text-red-600' : type === 'income' ? 'text-green-600' : 'text-blue-600'}`}>
            €{Math.abs(value).toFixed(2)}
          </p>
        </div>
        
        <div className={`rounded-full p-3 h-fit ${getColorClass()}`}>
          {icon || <DollarSign className="w-5 h-5" />}
        </div>
      </div>
      
      {change !== undefined && (
        <div className="mt-4 flex items-center">
          {change >= 0 ? (
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500 ml-1">from last period</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;