'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import {
  Users2,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  User,
  Clock,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  MapPin,
  ClipboardList
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function SalesExecutiveDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  // Local states for mock schedules
  const [meetings, setMeetings] = useState([
    { id: '1', title: 'Globex Inc CRM Migration Review', client: 'Globex Inc', date: 'Today', time: '11:00 AM', link: 'https://meet.google.com/vexor-sales' },
    { id: '2', title: 'Acme Corp Contract Pitch', client: 'Acme Corp', date: 'Tomorrow', time: '2:30 PM', link: 'https://meet.google.com/vexor-sales' },
  ]);

  const loadLeadsData = async () => {
    try {
      const data = await apiRequest('/crm/leads');
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assigned leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeadsData();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await apiRequest(`/crm/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadLeadsData();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Dashboard Stats Calculations
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === 'WON').length;
  const activeLeads = leads.filter(l => !['WON', 'LOST'].includes(l.status)).length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';
  
  // Historical chart mock-up data for the executive
  const historyData = [
    { month: 'Mar', Assigned: 5, Converted: 1 },
    { month: 'Apr', Assigned: 12, Converted: 3 },
    { month: 'May', Assigned: 8, Converted: 2 },
    { month: 'Jun', Assigned: 15, Converted: 5 },
    { month: 'Jul', Assigned: totalLeads, Converted: wonLeads }
  ];

  // Filtering Logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = selectedStageFilter === 'ALL' || lead.status === selectedStageFilter;
    
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 md:p-8 rounded-3xl border border-border/80 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent backdrop-blur-md relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative space-y-2">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Sales Executive Dashboard</h2>
          <p className="text-xs md:text-sm text-muted-foreground max-w-xl leading-relaxed">
            Welcome back! Manage your assigned pipeline stages, track communication touchpoints, and sync meetings with prospects.
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 md:p-5 rounded-2xl border border-border bg-card">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider block">Assigned Leads</span>
          <h3 className="text-xl md:text-2xl font-black mt-1.5">{totalLeads}</h3>
          <span className="text-[9px] text-muted-foreground mt-1 block">Active: {activeLeads} leads</span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-border bg-card">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider block">Closed Deals</span>
          <h3 className="text-xl md:text-2xl font-black mt-1.5 text-green-500">{wonLeads}</h3>
          <span className="text-[9px] text-green-500 mt-1 block">Yielding conversions</span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-border bg-card">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider block">Conversion Rate</span>
          <h3 className="text-xl md:text-2xl font-black mt-1.5 text-blue-500">{conversionRate}%</h3>
          <span className="text-[9px] text-blue-500 mt-1 block">Deals won vs total</span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-border bg-card">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider block">Syncs Scheduled</span>
          <h3 className="text-xl md:text-2xl font-black mt-1.5 text-yellow-500">{meetings.length} Calls</h3>
          <span className="text-[9px] text-yellow-500 mt-1 block">Awaiting outcomes</span>
        </div>
      </div>

      {/* Visual Analytics Curve & Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Curves */}
        <div className="lg:col-span-2 p-5 md:p-6 rounded-2xl border border-border bg-card space-y-4">
          <div>
            <h4 className="font-bold text-sm md:text-base">My Pipeline Trends</h4>
            <p className="text-xs text-muted-foreground">Historical overview of assigned leads vs converted status.</p>
          </div>
          <div className="h-52 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-[10px] fill-muted" stroke="currentColor" />
                <YAxis className="text-[10px] fill-muted" stroke="currentColor" />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="Assigned" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAssigned)" strokeWidth={2} name="Assigned" />
                <Area type="monotone" dataKey="Converted" stroke="#10b981" fill="none" strokeWidth={2} name="Converted" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Syncs Schedule */}
        <div className="p-5 md:p-6 rounded-2xl border border-border bg-card space-y-4">
          <h4 className="font-bold text-sm md:text-base flex items-center gap-1.5">
            <Calendar className="w-4.5 h-4.5 text-yellow-500" />
            Scheduled Meetings
          </h4>
          <div className="space-y-3">
            {meetings.map((meet) => (
              <div key={meet.id} className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2.5 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-foreground truncate max-w-[150px]">{meet.title}</h5>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">{meet.client}</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/25 text-yellow-500 font-bold rounded-full">{meet.date}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {meet.time}
                  </span>
                  <a
                    href={meet.link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-blue-500 text-white rounded font-semibold hover:opacity-90 transition text-[9px]"
                  >
                    Join Meet
                  </a>
                </div>
              </div>
            ))}
            {meetings.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-6">No calls scheduled for today.</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Leads Board / Filter List */}
      <div className="p-5 md:p-6 rounded-2xl border border-border bg-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h4 className="font-bold text-sm md:text-base">My Assigned Leads Pipeline</h4>
            <p className="text-xs text-muted-foreground">Search and update pipeline status in real-time.</p>
          </div>
          
          {/* Quick Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 pl-8.5 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs"
              />
            </div>
            
            <select
              value={selectedStageFilter}
              onChange={e => setSelectedStageFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background"
            >
              <option value="ALL">All Stages</option>
              {['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'WON', 'LOST'].map(st => (
                <option key={st} value={st}>{st.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Leads Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className="p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                    lead.score >= 70 ? 'bg-green-500/10 text-green-500 border-green-500/25' : lead.score >= 40 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/25' : 'bg-red-500/10 text-red-400 border-red-500/25'
                  }`}>
                    Score: {lead.score}
                  </span>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${
                    lead.status === 'WON' ? 'bg-green-500/15 text-green-500' : lead.status === 'LOST' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/10 text-blue-400 border border-blue-500/15'
                  }`}>
                    {lead.status.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="font-bold text-sm leading-snug text-foreground">{lead.title}</h4>
                <p className="text-[10px] text-muted-foreground leading-tight">{lead.companyName}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1 font-medium">
                  <User className="w-3 h-3" /> {lead.contactName}
                </span>
                <span className="text-[9px] hover:underline flex items-center gap-0.5 text-blue-400">
                  Open details <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          ))}
          {filteredLeads.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-muted-foreground italic border border-dashed border-border rounded-xl">
              No assigned leads found matching the filters.
            </div>
          )}
        </div>
      </div>

      {/* Details Side-Drawer Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md h-full bg-card border-l border-border p-6 shadow-2xl space-y-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-250">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div>
                  <h3 className="font-bold text-base leading-snug">{selectedLead.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{selectedLead.companyName}</p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-xs border border-border px-2.5 py-1.5 rounded hover:bg-secondary transition"
                >
                  Close
                </button>
              </div>

              {/* Contact Details Card */}
              <div className="space-y-3.5 text-xs bg-secondary/30 p-4 rounded-xl border border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-semibold text-foreground">{selectedLead.contactName}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <a href={`mailto:${selectedLead.email}`} className="hover:underline text-blue-400">{selectedLead.email}</a>
                </div>
                {selectedLead.phone && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedLead.phone}</span>
                  </div>
                )}
              </div>

              {/* Pipeline Stage Updates */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Update Pipeline Stage</label>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background font-medium focus:outline-none focus:border-primary transition"
                >
                  {['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'WON', 'LOST'].map((col) => (
                    <option key={col} value={col}>
                      {col.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* timeline history */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Timeline logs</h5>
                <div className="space-y-4 border-l border-border/80 pl-4 py-1 text-xs">
                  {selectedLead.history && selectedLead.history.length > 0 ? (
                    selectedLead.history.map((h: any) => (
                      <div key={h.id} className="relative space-y-1">
                        <span className="absolute left-[-21.5px] top-1 w-2.5 h-2.5 rounded-full bg-border border-2 border-card" />
                        <div className="font-semibold">{h.action}</div>
                        {h.detail && <p className="text-[10px] text-muted-foreground leading-relaxed">{h.detail}</p>}
                        <span className="text-[9px] text-muted-foreground/80 block">{new Date(h.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-[11px] italic">No logs recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
