import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileCheck, 
  Copy, 
  MapPinOff,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const stats = [
  { label: 'Total Imported', value: '12,450', change: '+12%', trend: 'up', icon: Users, color: 'bg-blue-500' },
  { label: 'Pending Review', value: '1,205', change: '-5%', trend: 'down', icon: Clock, color: 'bg-amber-500' },
  { label: 'Needs Cleaning', value: '842', change: '+2%', trend: 'up', icon: AlertTriangle, color: 'bg-orange-500' },
  { label: 'Verified', value: '8,920', change: '+18%', trend: 'up', icon: CheckCircle2, color: 'bg-emerald-500' },
  { label: 'Rejected', value: '1,483', change: '+1%', trend: 'up', icon: XCircle, color: 'bg-red-500' },
  { label: 'Export Ready', value: '6,420', change: '+22%', trend: 'up', icon: FileCheck, color: 'bg-indigo-500' },
  { label: 'Duplicate Suspects', value: '342', change: '-12%', trend: 'down', icon: Copy, color: 'bg-zinc-500' },
  { label: 'Outside Central', value: '1,120', change: '+4%', trend: 'up', icon: MapPinOff, color: 'bg-rose-500' },
];

const chartData = [
  { name: 'Baghdad', verified: 4500, pending: 600, rejected: 300 },
  { name: 'Erbil', verified: 2100, pending: 300, rejected: 150 },
  { name: 'Basra', verified: 1200, pending: 200, rejected: 100 },
  { name: 'Suly', verified: 1120, pending: 105, rejected: 80 },
];

const statusData = [
  { name: 'Verified', value: 8920, color: '#10b981' },
  { name: 'Pending', value: 1205, color: '#f59e0b' },
  { name: 'Rejected', value: 1483, color: '#ef4444' },
  { name: 'Cleaning', value: 842, color: '#f97316' },
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Operations Overview</h2>
          <p className="text-zinc-500 text-sm">Real-time data quality and verification metrics.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
            Last 30 Days
          </button>
          <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
            Download Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {stat.change}
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold">Verification by City</h3>
            <div className="flex gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Verified
              </div>
              <div className="flex items-center gap-1.5 text-amber-600">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> Pending
              </div>
              <div className="flex items-center gap-1.5 text-red-600">
                <div className="w-2 h-2 rounded-full bg-red-500" /> Rejected
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="verified" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold mb-8">Status Distribution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-zinc-600">{item.name}</span>
                </div>
                <span className="font-bold">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-bold">Recent Import Activity</h3>
          <button className="text-sm font-bold text-orange-600 hover:text-orange-700">View All</button>
        </div>
        <div className="divide-y divide-zinc-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-zinc-100 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">Batch_Import_Baghdad_Central_{2024 + i}.csv</p>
                  <p className="text-xs text-zinc-500">Imported by Admin • 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-xs font-bold text-emerald-600">450</p>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold">Success</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-red-600">12</p>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold">Rejected</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-amber-600">45</p>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold">Flagged</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
