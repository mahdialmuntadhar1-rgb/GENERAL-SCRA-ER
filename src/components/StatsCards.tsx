import React from 'react';
import { 
  Database, 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  MapPinOff, 
  Copy, 
  FileUp, 
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface StatCardProps {
  key?: any;
  label: string;
  value: string | number;
  icon: any;
  trend?: { value: string; positive: boolean };
  color: string;
  description?: string;
}

function StatCard({ label, value, icon: Icon, trend, color, description }: StatCardProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
            trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</h3>
        <p className="text-3xl font-black tracking-tight text-zinc-900">{value}</p>
        {description && <p className="text-zinc-400 text-[10px] font-medium mt-2 uppercase tracking-wider">{description}</p>}
      </div>
    </div>
  );
}

export function StatsCards() {
  const stats = [
    { label: 'Total Records', value: '124,502', icon: Database, color: 'bg-blue-600', trend: { value: '+12%', positive: true }, description: 'All sources combined' },
    { label: 'Pending Review', value: '8,240', icon: ClipboardCheck, color: 'bg-amber-600', trend: { value: '-5%', positive: true }, description: 'Requires manual verification' },
    { label: 'Verified', value: '98,120', icon: CheckCircle2, color: 'bg-emerald-600', trend: { value: '+8%', positive: true }, description: 'Central zone approved' },
    { label: 'Rejected', value: '12,450', icon: XCircle, color: 'bg-rose-600', trend: { value: '+2%', positive: false }, description: 'Invalid or incorrect data' },
    { label: 'Outside Coverage', value: '5,692', icon: MapPinOff, color: 'bg-zinc-600', description: 'Suburbs & Outskirts flagged' },
    { label: 'Duplicates', value: '1,240', icon: Copy, color: 'bg-indigo-600', description: 'Suspected multi-source overlap' },
    { label: 'Imported Files', value: '45,200', icon: FileUp, color: 'bg-orange-600', description: 'CSV/XLSX/JSON sources' },
    { label: 'Provider Success', value: '94.2%', icon: Zap, color: 'bg-cyan-600', trend: { value: '+1.2%', positive: true }, description: 'API uptime & yield' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard 
          key={index} 
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          trend={stat.trend}
          description={stat.description}
        />
      ))}
    </div>
  );
}
