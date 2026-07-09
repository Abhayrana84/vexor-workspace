'use client';

import { useEffect, useState } from 'react';
import { apiRequest, getStoredUser } from '../../../lib/api';
import {
  Plus,
  User,
  Milestone,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Send,
  Calendar,
  Cpu,
  Award,
  TrendingUp,
  Clock,
  Search,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const STATUS_COLUMNS = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'WON', 'LOST'];

export default function CRM() {
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pipeline');

  // Intake Form State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [score, setScore] = useState(50);
  const [autoAssign, setAutoAssign] = useState(true);

  // Active details modal
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Lead Distribution routing config
  const [routingMode, setRoutingMode] = useState('round-robin');

  // Proposals Draft lists
  const [proposals, setProposals] = useState<any[]>([]);
  const [showPropModal, setShowPropModal] = useState(false);
  const [propTitle, setPropTitle] = useState('');
  const [propClient, setPropClient] = useState('');
  const [propAmount, setPropAmount] = useState('');

  // Meetings calendar mock lists
  const [meetings, setMeetings] = useState<any[]>([]);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetClient, setMeetClient] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('');

  const loadLeads = async () => {
    try {
      const activeUser = getStoredUser();
      setUser(activeUser);

      const data = await apiRequest('/crm/leads');
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('No leads available to export.');
      return;
    }
    const headers = ['Title', 'Company Name', 'Contact Name', 'Email', 'Phone', 'Status', 'Score'];
    const csvRows = [
      headers.join(','),
      ...leads.map((l) => [
        `"${(l.title || '').replace(/"/g, '""')}"`,
        `"${(l.companyName || '').replace(/"/g, '""')}"`,
        `"${(l.contactName || '').replace(/"/g, '""')}"`,
        `"${(l.email || '').replace(/"/g, '""')}"`,
        `"${l.phone ? l.phone.replace(/"/g, '""') : ''}"`,
        `"${l.status}"`,
        l.score
      ].join(','))
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vexor_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
      if (lines.length <= 1) {
        alert('CSV file is empty or missing headers.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
      
      let importCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => v.replace(/^["']|["']$/g, '').trim());
        const leadObj: any = {};
        headers.forEach((header, index) => {
          const val = values[index] || '';
          if (header.toLowerCase().includes('title')) leadObj.title = val;
          else if (header.toLowerCase().includes('company')) leadObj.companyName = val;
          else if (header.toLowerCase().includes('contact')) leadObj.contactName = val;
          else if (header.toLowerCase().includes('email')) leadObj.email = val;
          else if (header.toLowerCase().includes('phone')) leadObj.phone = val;
          else if (header.toLowerCase().includes('score')) leadObj.score = parseInt(val) || 50;
        });

        if (leadObj.title && leadObj.companyName && leadObj.contactName && leadObj.email) {
          try {
            await apiRequest('/crm/leads', {
              method: 'POST',
              body: JSON.stringify(leadObj),
            });
            importCount++;
          } catch (err: any) {
            console.error('Failed to import row:', leadObj, err.message);
          }
        }
      }

      alert(`Import complete. Successfully imported ${importCount} leads.`);
      loadLeads();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const printProposal = (prop: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Proposal - ${prop.title}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              .header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: #4f46e5; }
              .client { font-size: 16px; margin-top: 10px; }
              .amount { font-size: 18px; font-weight: bold; margin-top: 20px; color: #111827; }
              .section { margin-top: 30px; }
              .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 10px; }
              .content { font-size: 12px; line-height: 1.6; }
              .footer { margin-top: 50px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${prop.title}</div>
              <div class="client"><strong>Client:</strong> ${prop.client || 'Acme Corp'}</div>
            </div>
            <div class="content">
              <p>We are pleased to submit this proposal for your review. Vexor IT Solutions is committed to delivering state-of-the-art technological systems with a target execution cadence.</p>
              <div class="section">
                <div class="section-title">Project Scope & Deliverables</div>
                <p>Deployment of scalable platform modules, custom database schema designs, role access controls validation layers, and automated cloud triggers.</p>
              </div>
              <div class="section">
                <div class="section-title">Estimation Details</div>
                <div class="amount">Proposed Cost: ₹${(prop.amount || 50000).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div class="footer">
              Vexor IT Solutions &bull; Confidential Proposal Document
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          title,
          companyName,
          contactName,
          email,
          phone,
          score,
          autoAssign,
        }),
      });
      setShowModal(false);
      setTitle('');
      setCompanyName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setScore(50);
      loadLeads();
    } catch (err: any) {
      alert(err.message || 'Error creating lead');
    }
  };

  const handleStatusChange = async (leadId: string, status: string) => {
    try {
      await apiRequest(`/crm/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      loadLeads();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev: any) => ({ ...prev, status }));
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    const newProp = {
      id: Math.random().toString(),
      title: propTitle,
      client: propClient,
      amount: parseInt(propAmount) || 0,
      status: 'DRAFT',
    };
    setProposals((prev) => [...prev, newProp]);
    setPropTitle('');
    setPropClient('');
    setPropAmount('');
    setShowPropModal(false);
    alert('Proposal draft generated successfully.');
  };

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    const newMeet = {
      id: Math.random().toString(),
      title: meetTitle,
      client: meetClient,
      date: meetDate,
      time: meetTime,
    };
    setMeetings((prev) => [...prev, newMeet]);
    setMeetTitle('');
    setMeetClient('');
    setMeetDate('');
    setMeetTime('');
    setShowMeetModal(false);
    alert('Client meeting scheduled. Calendar invite sent.');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSalesManager = user?.role === 'SALES_MANAGER' || user?.role === 'FOUNDER' || user?.role === 'CO_FOUNDER' || user?.role === 'ADMIN';

  const performanceData = [
    { name: 'Globex Inc', Revenue: 850000 },
    { name: 'Acme Corp', Revenue: 350000 },
    { name: 'Initech Inc', Revenue: 250000 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Sales CRM</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isSalesManager 
              ? 'Complete sales lifecycle—manage pipelines, set targets, configure workload distribution, and generate proposals.'
              : 'Interact with organizational pipelines, log outreach, and schedule client follow-up calls.'}
          </p>
        </div>
        
        <div className="flex gap-2 items-center">
          <input
            type="file"
            id="csv-file-input"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById('csv-file-input')?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-foreground border border-border font-semibold rounded-lg text-xs hover:bg-secondary/80 transition"
          >
            Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-foreground border border-border font-semibold rounded-lg text-xs hover:bg-secondary/80 transition"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Create Lead
          </button>
        </div>
      </div>

      {isSalesManager && (
        <div className="flex flex-wrap gap-2 border-b border-border pb-3 shrink-0">
          {[
            { id: 'overview', name: 'Sales KPIs', icon: TrendingUp },
            { id: 'pipeline', name: 'Pipeline Board', icon: Milestone },
            { id: 'routing', name: 'Lead Distribution', icon: Cpu },
            { id: 'proposals', name: 'Proposals Desk', icon: FileText },
            { id: 'meetings', name: 'Meetings & Syncs', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
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
      )}

      {isSalesManager && activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pipeline Total Leads</span>
              <h3 className="text-2xl font-black mt-2">{leads.length} Active</h3>
              <span className="text-[9px] text-muted-foreground block mt-1">2 meetings scheduled today</span>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Conversion Rate</span>
              <h3 className="text-2xl font-black mt-2 text-green-500">24.5%</h3>
              <span className="text-[9px] text-green-500 block mt-1">Average response time: 14 mins</span>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Proposals Sent</span>
              <h3 className="text-2xl font-black mt-2 text-yellow-500">{proposals.length} Drafted</h3>
              <span className="text-[9px] text-muted-foreground block mt-1">1 awaiting review signature</span>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Deals Pipeline Value</span>
              <h3 className="text-2xl font-black mt-2 text-blue-500">₹14,50,000</h3>
              <span className="text-[9px] text-blue-500 block mt-1">SLA target achievement MoM</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card space-y-4">
              <div>
                <h4 className="font-bold text-sm">Leads Conversion Yield by Client</h4>
                <p className="text-xs text-muted-foreground">Historical billing contracts converted in Rupees.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-[10px] fill-muted" stroke="currentColor" />
                    <YAxis className="text-[10px] fill-muted" stroke="currentColor" />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-widest">Active Executive Targets</h4>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <div>
                      <p className="font-bold">Marcus Broady</p>
                      <span className="text-[10px] text-muted-foreground">3 active leads</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-500">₹8,50,000 Closed</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">Sarah Jenkins</p>
                      <span className="text-[10px] text-muted-foreground">2 active leads</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-500">₹3,50,000 Closed</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-secondary/30 border border-border/40 rounded-xl mt-4">
                <p className="text-[10px] leading-tight text-muted-foreground">AI notice: Marcus Broady leads conversion rates this month. Recommend upsell alignment.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'pipeline' || !isSalesManager) && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((col) => {
            const list = leads.filter((l) => l.status === col);
            return (
              <div key={col} className="p-4 rounded-xl border border-border bg-card/60 space-y-3 shrink-0 w-64 md:w-auto">
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <h4 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">{col.replace('_', ' ')}</h4>
                  <span className="text-[10px] px-1.5 py-0.2 bg-secondary rounded-full font-bold">{list.length}</span>
                </div>
                
                <div className="space-y-3">
                  {list.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="p-3.5 rounded-xl border border-border bg-card shadow-sm hover:border-primary/45 transition cursor-pointer space-y-2.5 text-xs"
                    >
                      <div className="font-bold leading-tight">{lead.title}</div>
                      <div className="text-[10px] text-muted-foreground">{lead.companyName}</div>
                      <div className="flex justify-between items-center pt-2 border-t border-border/40 text-[9px] text-muted-foreground">
                        <span>Score: {lead.score}</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold uppercase">{lead.assignee?.firstName || 'Auto'}</span>
                      </div>
                    </div>
                  ))}
                  {list.length === 0 && (
                    <p className="text-center py-6 text-muted-foreground/60 italic text-[10px]">Empty stage</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isSalesManager && activeTab === 'routing' && (
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
          <div>
            <h4 className="font-bold text-sm">Automated Lead Distribution Engine</h4>
            <p className="text-xs text-muted-foreground">Select how newly ingested leads from web hook forms are distributed to sales executives.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'round-robin', name: 'Workload Round-Robin', desc: 'Assigns leads dynamically to the salesperson carrying the lowest pipeline value.' },
              { id: 'skill-based', name: 'Skill-Based Routing', desc: 'Routes leads based on client industry requirements and executive specialization SLA.' },
              { id: 'manual', name: 'Manual Assign Only', desc: 'Holds leads in unassigned intake queue until Sales Manager assigns manually.' },
            ].map((mode) => (
              <div
                key={mode.id}
                onClick={() => {
                  setRoutingMode(mode.id);
                  alert(`Lead distribution algorithm updated to: ${mode.name}.`);
                }}
                className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 ${
                  routingMode === mode.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-card hover:bg-secondary/10'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs">{mode.name}</span>
                  {routingMode === mode.id && <CheckCircle className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSalesManager && activeTab === 'proposals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm">Proposal & Quotes Desk</h4>
              <p className="text-xs text-muted-foreground">Draft and approve client quotation sheets.</p>
            </div>
            <button
              onClick={() => setShowPropModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" /> Draft Proposal
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase">
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Target Client</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {proposals.map((prop) => (
                  <tr key={prop.id} className="hover:bg-secondary/15 transition">
                    <td className="py-3 px-3 font-bold">{prop.title}</td>
                    <td className="py-3 px-3">{prop.client}</td>
                    <td className="py-3 px-3 font-semibold">₹{prop.amount.toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                        prop.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/10' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/10'
                      }`}>
                        {prop.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {prop.status === 'DRAFT' && (
                        <button
                          onClick={() => {
                            setProposals((prev) => prev.map((p) => p.id === prop.id ? { ...p, status: 'APPROVED' } : p));
                            alert('Proposal approved and signed off. Emailed to client.');
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold bg-green-500 text-white rounded hover:opacity-90"
                        >
                          Approve
                        </button>
                      )}
                      {prop.status === 'APPROVED' && (
                        <button
                          onClick={() => printProposal(prop)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-secondary text-foreground rounded hover:bg-secondary/60 border border-border"
                        >
                          Export PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isSalesManager && activeTab === 'meetings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm">Scheduled Client Calls</h4>
              <p className="text-xs text-muted-foreground">Track call sync schedules, set reminders, and log outcomes.</p>
            </div>
            <button
              onClick={() => setShowMeetModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" /> Book Meeting
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meetings.map((meet) => (
              <div key={meet.id} className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-sm">{meet.title}</h5>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Client: {meet.client}</span>
                  </div>
                  <span className="p-1 px-2.5 bg-blue-500/10 text-blue-500 border border-blue-500/10 rounded-full font-bold text-[9px] uppercase">
                    CONFIRMED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/40 pt-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Call Date</span>
                    <span className="font-bold">{meet.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Sync Time</span>
                    <span className="font-bold">{meet.time}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => alert(`Client invitation link: https://meet.google.com/vexor-sales-sync`)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-secondary text-foreground rounded hover:bg-secondary/60 border border-border"
                  >
                    Join Meet
                  </button>
                  <button
                    onClick={() => alert('Client outreach follow-up logged to history.')}
                    className="px-2.5 py-1 text-[10px] font-bold bg-blue-500 text-white rounded hover:opacity-90"
                  >
                    Log Outreach
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-2xl relative">
            <h3 className="text-xl font-bold mb-6">Create Sales Lead</h3>
            <form onSubmit={handleCreateLead} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Project / Lead Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. Enterprise CRM Migration"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g. Globex Corp"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Contact Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g. Marcus Broady"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g. marcus@globex.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Lead Score (0-100)</label>
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value) || 50)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoAssign"
                  checked={autoAssign}
                  onChange={(e) => setAutoAssign(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="autoAssign" className="text-xs font-semibold text-muted-foreground cursor-pointer select-none">
                  Assign automatically via Workload Round-Robin Engine
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-2xl relative">
            <h3 className="text-xl font-bold mb-6">Create Proposal Draft</h3>
            <form onSubmit={handleCreateProposal} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Proposal Title</label>
                <input
                  type="text"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. Globex CRM Migration"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Client Company Name</label>
                <input
                  type="text"
                  value={propClient}
                  onChange={(e) => setPropClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. Globex Corporation"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Project Value Amount (₹)</label>
                <input
                  type="number"
                  value={propAmount}
                  onChange={(e) => setPropAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. 850000"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPropModal(false)}
                  className="px-4 py-2 border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg">
                  Draft Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMeetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-2xl relative">
            <h3 className="text-xl font-bold mb-6">Schedule Call Sync</h3>
            <form onSubmit={handleScheduleMeeting} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Meeting Title</label>
                <input
                  type="text"
                  value={meetTitle}
                  onChange={(e) => setMeetTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. Globex Architecture Review"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Client Company Name</label>
                <input
                  type="text"
                  value={meetClient}
                  onChange={(e) => setMeetClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. Globex Corporation"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Meeting Date</label>
                  <input
                    type="date"
                    value={meetDate}
                    onChange={(e) => setMeetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Sync Time</label>
                  <input
                    type="text"
                    value={meetTime}
                    onChange={(e) => setMeetTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g. 11:00 AM"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMeetModal(false)}
                  className="px-4 py-2 border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg">
                  Schedule Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border p-6 shadow-2xl space-y-6 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-lg leading-snug">{selectedLead.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{selectedLead.companyName}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-xs border border-border px-2.5 py-1 rounded hover:bg-secondary transition">
                Close
              </button>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 text-xs bg-secondary/50 p-4 rounded-xl border border-border/60">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                <span className="font-semibold text-foreground">{selectedLead.contactName}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                <a href={`mailto:${selectedLead.email}`} className="hover:underline">{selectedLead.email}</a>
              </div>
              {selectedLead.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedLead.phone}</span>
                </div>
              )}
            </div>

            {/* Pipeline Stage Control */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Pipeline Stage</label>
              <select
                value={selectedLead.status}
                onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background font-medium"
              >
                {STATUS_COLUMNS.map((col) => (
                  <option key={col} value={col}>
                    {col.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* History logs */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Milestone className="w-3.5 h-3.5" />
                History Timeline
              </h5>
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
                  <p className="text-muted-foreground text-xs">No logs recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
