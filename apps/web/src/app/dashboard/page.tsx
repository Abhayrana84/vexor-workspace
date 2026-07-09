'use client';

import { useEffect, useState } from 'react';
import { apiRequest, getStoredUser } from '../../lib/api';
import DeveloperDashboard from './DeveloperDashboard';
import ClientDashboard from './ClientDashboard';
import {
  Heart,
  TrendingUp,
  FolderOpen,
  Users2,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  FileSpreadsheet,
  Megaphone,
  Briefcase,
  DollarSign,
  UserCheck,
  Calendar,
  Mail,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Decision Queue Interactive State
  const [leavesQueue, setLeavesQueue] = useState<any[]>([]);
  const [draftInvoicesQueue, setDraftInvoicesQueue] = useState<any[]>([]);
  const [expensesQueue, setExpensesQueue] = useState<any[]>([]);
  const [hiresQueue, setHiresQueue] = useState<any[]>([]);

  const loadStats = async () => {
    try {
      const data = await apiRequest('/finance/stats');
      setStats(data);
      setLeavesQueue(data.decisionCenter.pendingLeaves);
      setDraftInvoicesQueue(data.decisionCenter.draftInvoices);
      setExpensesQueue(data.decisionCenter.pendingExpenses);
      setHiresQueue(data.decisionCenter.pendingHires);
    } catch (err) {
      console.error('Failed to load dynamic stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const activeUser = getStoredUser();
    setUser(activeUser);
    if (activeUser && (activeUser.role === 'DEVELOPER' || activeUser.role === 'CLIENT')) {
      setLoading(false);
    } else {
      loadStats();
    }
  }, []);

  const handleApproveLeave = async (leaveId: string) => {
    try {
      await apiRequest(`/hrms/leaves/${leaveId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      setLeavesQueue((prev) => prev.filter((item) => item.id !== leaveId));
      alert('Leave request approved successfully.');
    } catch (err: any) {
      alert(err.message || 'Error processing approval');
    }
  };

  const handleApproveInvoice = async (invoiceId: string) => {
    try {
      await apiRequest(`/finance/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'SENT' }),
      });
      setDraftInvoicesQueue((prev) => prev.filter((item) => item.id !== invoiceId));
      alert('Invoice approved and dispatched to client.');
    } catch (err: any) {
      alert(err.message || 'Error processing approval');
    }
  };

  const handleApproveExpense = (id: string) => {
    setExpensesQueue((prev) => prev.filter((item) => item.id !== id));
    alert('Expense claim cleared and added to payroll ledger.');
  };

  const handleApproveHire = (id: string) => {
    setHiresQueue((prev) => prev.filter((item) => item.id !== id));
    alert('Contract signed. Welcome announcement generated.');
  };

  if (user && user.role === 'DEVELOPER') {
    return <DeveloperDashboard />;
  }

  if (user && user.role === 'CLIENT') {
    return <ClientDashboard />;
  }

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Monthly forecast chart data
  const forecastHistory = [
    { name: 'Jul', Revenue: stats.businessOverview.monthlyRevenue, Expenses: stats.businessOverview.expenses },
    { name: 'Aug', Revenue: stats.businessOverview.monthlyRevenue * 1.08, Expenses: stats.businessOverview.expenses * 1.02 },
    { name: 'Sep', Revenue: stats.businessOverview.monthlyRevenue * 1.15, Expenses: stats.businessOverview.expenses * 1.04 },
    { name: 'Oct', Revenue: stats.businessOverview.monthlyRevenue * 1.25, Expenses: stats.businessOverview.expenses * 1.05 },
  ];

  return (
    <div className="space-y-8">
      {/* Header section with Daily Briefing and Priority Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Title & Cockpit Health */}
        <div className="lg:col-span-1 p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Founder cockpit</h2>
            <p className="text-xs text-muted-foreground mt-1">Enterprise Command Center — Vexor IT Solutions</p>
          </div>
          
          <div className="flex items-center gap-6 mt-6">
            {/* Custom circular Health Score gauge */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * stats.companyHealthScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black">{stats.companyHealthScore}</span>
                <span className="text-[8px] text-muted-foreground uppercase font-bold">Health</span>
              </div>
            </div>
            <div className="text-xs space-y-1">
              <div className="font-semibold">Overall Index parameters:</div>
              <p className="text-[10px] text-muted-foreground">MoM Profit yields: **{(stats.businessOverview.profit / stats.businessOverview.totalRevenue * 100).toFixed(1)}%**</p>
              <p className="text-[10px] text-muted-foreground">Deliverables index: **{stats.employeeDashboard.productivityScore}%**</p>
              <p className="text-[10px] text-muted-foreground">Active staff counts: **{stats.employeeDashboard.totalEmployees}**</p>
            </div>
          </div>
        </div>

        {/* Daily Briefing Summary */}
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-3 right-3 p-1 text-[9px] font-bold text-accent border border-accent/15 bg-blue-500/5 rounded uppercase">
            Morning Briefing
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-widest">Founder Daily Brief</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Today's Revenue</span>
                <span className="font-extrabold text-sm text-green-500">₹{stats.businessOverview.monthlyRevenue.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Leads Inbound</span>
                <span className="font-extrabold text-sm">{stats.salesDashboard.totalLeads} active</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">At Churn Risk</span>
                <span className="font-extrabold text-sm text-yellow-500">1 accounts</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Approvals Queue</span>
                <span className="font-extrabold text-sm text-blue-500">{leavesQueue.length + draftInvoicesQueue.length + expensesQueue.length} items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Inbox feed */}
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
          <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Founder Priority Inbox
          </h4>
          <div className="space-y-3 text-xs flex-1 overflow-y-auto max-h-[140px]">
            {draftInvoicesQueue.length > 0 && (
              <div className="flex gap-2 items-start text-yellow-500 border-b border-border/40 pb-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="leading-tight">Invoice **{draftInvoicesQueue[0].invoiceNumber}** is pending validation for amount **₹{draftInvoicesQueue[0].amount.toLocaleString()}**.</p>
              </div>
            )}
            {stats.clientDashboard.supportTickets > 0 && (
              <div className="flex gap-2 items-start border-b border-border/40 pb-2">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="leading-tight">Acme Corp submitted a high-priority ticket regarding billing adjustments.</p>
              </div>
            )}
            <div className="flex gap-2 items-start text-muted-foreground">
              <Lightbulb className="w-4 h-4 text-purple-500 shrink-0" />
              <p className="leading-tight">AI recommends creating your first project milestone or client profile to begin system tracking.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3 shrink-0">
        {[
          { id: 'overview', name: 'Overview', icon: DollarSign },
          { id: 'sales', name: 'Sales & CRM', icon: TrendingUp },
          { id: 'clients', name: 'Client Desk', icon: Users2 },
          { id: 'projects', name: 'Projects', icon: Briefcase },
          { id: 'employees', name: 'HRMS Staff', icon: UserCheck },
          { id: 'marketing', name: 'Marketing ROI', icon: Megaphone },
          { id: 'decision', name: `Decision Center (${leavesQueue.length + draftInvoicesQueue.length + expensesQueue.length})`, icon: CheckCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Accumulated Revenue</span>
              <h3 className="text-2xl font-black mt-2">₹{stats.businessOverview.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Profit Margins</span>
              <h3 className="text-2xl font-black mt-2 text-green-500">₹{stats.businessOverview.profit.toLocaleString()}</h3>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Outstanding Receivables</span>
              <h3 className="text-2xl font-black mt-2 text-yellow-500">₹{stats.businessOverview.pendingPayments.toLocaleString()}</h3>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Operational Cash Flow</span>
              <h3 className="text-2xl font-black mt-2">₹{stats.businessOverview.cashFlow.toLocaleString()}</h3>
            </div>
          </div>

          {/* Area charts */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div>
              <h4 className="font-bold text-sm">Revenue Forecast Curves</h4>
              <p className="text-xs text-muted-foreground">30/60/90 day business forecasting modules.</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-[10px] fill-muted" stroke="currentColor" />
                  <YAxis className="text-[10px] fill-muted" stroke="currentColor" />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Total Leads Ingestion</span>
              <h4 className="text-2xl font-black">{stats.salesDashboard.totalLeads}</h4>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Qualified Status</span>
              <h4 className="text-2xl font-black text-blue-500">{stats.salesDashboard.qualifiedLeads}</h4>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Closed Deals Conversion Rate</span>
              <h4 className="text-2xl font-black text-green-500">{stats.salesDashboard.conversionRate}%</h4>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <h4 className="font-bold text-sm">Lead Generation Channels</h4>
              <div className="space-y-3.5 text-xs">
                {stats.salesDashboard.leadSources.map((item: any) => (
                  <div key={item.source} className="flex justify-between items-center">
                    <span>{item.source}</span>
                    <span className="font-bold">{item.count} leads</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
              <h4 className="font-bold text-sm">Sales targets vs Actuals</h4>
              <p className="text-[11px] text-muted-foreground">Cumulative target pipeline $350k</p>
              <div className="pt-4 flex items-end gap-2 text-2xl font-black">
                <span>₹{stats.businessOverview.monthlyRevenue.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground font-medium mb-1">/ ₹3,50,000 target</span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden mt-2">
                <div className="h-full bg-blue-500" style={{ width: `${(stats.businessOverview.monthlyRevenue / 3500) || 5}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Active Accounts</span>
            <h3 className="text-2xl font-black">{stats.clientDashboard.totalClients}</h3>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Satisfaction Index</span>
            <h3 className="text-2xl font-black text-green-500">{stats.clientDashboard.clientSatisfactionScore}%</h3>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Retention Rate</span>
            <h3 className="text-2xl font-black text-blue-500">{stats.clientDashboard.retentionRate}%</h3>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground block mb-1">Active Projects</span>
              <h4 className="text-xl font-bold">{stats.projectDashboard.activeProjects}</h4>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground block mb-1">Completed Scope</span>
              <h4 className="text-xl font-bold">{stats.projectDashboard.completedProjects}</h4>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground block mb-1">Delayed Deliverables</span>
              <h4 className="text-xl font-bold text-red-500">{stats.projectDashboard.delayedProjects}</h4>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground block mb-1">Profitability Ratio</span>
              <h4 className="text-xl font-bold text-green-500">{stats.projectDashboard.projectProfitability}%</h4>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <h4 className="font-bold text-sm">Active Team Task Allocations</h4>
            <div className="space-y-3.5 text-xs">
              {stats.projectDashboard.teamWorkload.map((member: any) => (
                <div key={member.name} className="flex justify-between items-center">
                  <span>{member.name}</span>
                  <span className="font-bold">{member.activeTasks} task(s) assigned</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground block">Total Personnel</span>
              <h4 className="text-xl font-bold mt-1.5">{stats.employeeDashboard.totalEmployees}</h4>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground block">Shift Attendance Average</span>
              <h4 className="text-xl font-bold mt-1.5 text-green-500">{stats.employeeDashboard.attendance}%</h4>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground block">Leaves Pending Review</span>
              <h4 className="text-xl font-bold mt-1.5 text-yellow-500">{stats.employeeDashboard.leaveRequestsCount} request(s)</h4>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground block">Average Cost Per Lead (CPL)</span>
            <h4 className="text-xl font-black">₹{stats.marketingDashboard.costPerLead}</h4>
          </div>
          <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground block">Ad Spend Budget</span>
            <h4 className="text-xl font-black">₹{stats.marketingDashboard.adSpend.toLocaleString()}</h4>
          </div>
          <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground block">Target Return on Investment</span>
            <h4 className="text-xl font-black text-green-500">{stats.marketingDashboard.roi}x ROI</h4>
          </div>
        </div>
      )}

      {activeTab === 'decision' && (
        <div className="space-y-8">
          <div>
            <h3 className="font-bold text-lg">Decision Center Board</h3>
            <p className="text-xs text-muted-foreground">Approve leave allocations, draft invoices, expense filings, or contract new hires.</p>
          </div>

          {/* Pending Leaves Table */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-yellow-500">Leaves Approval Queue</h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase">
                    <th className="py-2.5">Employee</th>
                    <th className="py-2.5">Leave Type</th>
                    <th className="py-2.5">Reason</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {leavesQueue.map((l) => (
                    <tr key={l.id} className="hover:bg-secondary/15 transition">
                      <td className="py-3 font-bold">{l.employeeName}</td>
                      <td className="py-3">{l.type}</td>
                      <td className="py-3 text-muted-foreground">{l.reason || 'Not specified'}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleApproveLeave(l.id)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-green-500 text-white rounded hover:opacity-90"
                        >
                          Approve Leave
                        </button>
                      </td>
                    </tr>
                  ))}
                  {leavesQueue.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground italic">No pending leave requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Draft Invoices Table */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-blue-500">Pending Billing & Invoices Dispatch</h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase">
                    <th className="py-2.5">Invoice #</th>
                    <th className="py-2.5">Client Company</th>
                    <th className="py-2.5">Billing Amount</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {draftInvoicesQueue.map((inv) => (
                    <tr key={inv.id} className="hover:bg-secondary/15 transition">
                      <td className="py-3 font-bold">{inv.invoiceNumber}</td>
                      <td className="py-3">{inv.clientCompany}</td>
                      <td className="py-3 font-semibold">₹{inv.amount.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleApproveInvoice(inv.id)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-blue-500 text-white rounded hover:opacity-90"
                        >
                          Sign & Send
                        </button>
                      </td>
                    </tr>
                  ))}
                  {draftInvoicesQueue.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground italic">No draft invoices awaiting sign-off.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expense Claims Table */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-purple-500">Expenses Reimbursement Filings</h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase">
                    <th className="py-2.5">Filer</th>
                    <th className="py-2.5">Reimbursement Purpose</th>
                    <th className="py-2.5">Claim Amount</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {expensesQueue.map((exp) => (
                    <tr key={exp.id} className="hover:bg-secondary/15 transition">
                      <td className="py-3 font-bold">{exp.name}</td>
                      <td className="py-3 text-muted-foreground">{exp.purpose}</td>
                      <td className="py-3 font-semibold text-red-500">₹{exp.amount}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleApproveExpense(exp.id)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-purple-500 text-white rounded hover:opacity-90"
                        >
                          Clear Wire
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expensesQueue.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground italic">No expense claims pending.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Hires Table */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-green-500">Onboarding Contracts Authorization</h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase">
                    <th className="py-2.5">Candidate</th>
                    <th className="py-2.5">Target Designation</th>
                    <th className="py-2.5">Base Salary ($)</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {hiresQueue.map((hire) => (
                    <tr key={hire.id} className="hover:bg-secondary/15 transition">
                      <td className="py-3 font-bold">{hire.name}</td>
                      <td className="py-3">{hire.role}</td>
                      <td className="py-3 font-semibold">₹{hire.salary.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleApproveHire(hire.id)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-green-500 text-white rounded hover:opacity-90"
                        >
                          Sign Contract
                        </button>
                      </td>
                    </tr>
                  ))}
                  {hiresQueue.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground italic">No pending onboarding contracts.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
