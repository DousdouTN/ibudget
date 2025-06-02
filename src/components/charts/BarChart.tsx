import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BarChartData {
  name: string;
  income: number;
  expense: number;
}

interface BarChartProps {
  data: BarChartData[];
  title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm h-full">
      <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis 
              tickFormatter={(value) => `€${value}`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [`€${value}`, '']}
              labelFormatter={(label) => `Period: ${label}`}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #f0f0f0',
                borderRadius: '4px',
                padding: '10px'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => <span style={{ color: value === 'income' ? '#10B981' : '#EF4444' }}>{value === 'income' ? 'Income' : 'Expenses'}</span>}
            />
            <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChart;