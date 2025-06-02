import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartData } from '../../types';

interface PieChartProps {
  data: ChartData[];
  title: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-blue-600 font-bold">
          €{Math.abs(payload[0].value).toFixed(2)}
        </p>
        <p className="text-gray-500 text-sm">
          {(payload[0].payload.percent * 100).toFixed(0)}% of total
        </p>
      </div>
    );
  }
  return null;
};

const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + Math.abs(item.value), 0);
  
  // Add percentage to the data
  const dataWithPercent = data.map(item => ({
    ...item,
    percent: Math.abs(item.value) / total
  }));
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm h-full">
      <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={dataWithPercent}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {dataWithPercent.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="vertical" align="right" verticalAlign="middle" />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-gray-500 text-sm">Total: <span className="font-bold text-blue-600">€{total.toFixed(2)}</span></p>
      </div>
    </div>
  );
};

export default PieChart;