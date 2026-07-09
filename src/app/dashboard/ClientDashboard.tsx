'use client';

import { useEffect, useState, useRef } from 'react';
import { apiRequest, getStoredUser } from '../../lib/api';
import {
  Briefcase, Calendar, CheckCircle, Clock, DollarSign, MessageSquare, AlertCircle,
  HelpCircle, Shield, FileText, Send, Download, Upload, Plus, Award, Activity,
  Globe, Play, Settings, User, Video, Check, ExternalLink, Zap, Flame, FileCheck,
  LayoutDashboard, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function ClientDashboard({ defaultTab = 'overview' }: { defaultTab?: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const printInvoice = (inv: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${inv.invoiceNumber}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: #4f46e5; }
              .meta { text-align: right; font-size: 12px; line-height: 1.6; }
              .details { margin-bottom: 30px; font-size: 12px; }
              .details table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .details th { background: #f3f4f6; text-align: left; padding: 8px; font-weight: bold; }
              .details td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
              .total { text-align: right; font-size: 16px; font-weight: bold; margin-top: 20px; }
              .footer { margin-top: 50px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">INVOICE</div>
                <div style="font-size: 14px; margin-top: 5px;">Vexor IT Solutions</div>
              </div>
              <div class="meta">
                <strong>Invoice #:</strong> ${inv.invoiceNumber}<br/>
                <strong>Date:</strong> ${new Date(inv.createdAt || Date.now()).toLocaleDateString()}<br/>
                <strong>Due Date:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}<br/>
                <strong>Status:</strong> ${inv.status}
              </div>
            </div>
            <div class="details">
              <p><strong>Billed To:</strong> Acme Corp</p>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${inv.description || 'Milestone payment release'}</td>
                    <td style="text-align: right;">₹${(inv.amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="total">
              Total Due: ₹${(inv.amount || 0).toLocaleString('en-IN')}
            </div>
            <div class="footer">
              Thank you for your business! &bull; Vexor IT Solutions
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

  const printContract = (contract: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Contract - ${contract.name}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              .header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
              .title { font-size: 24px; font-weight: bold; color: #4f46e5; text-transform: uppercase; }
              .details { margin-bottom: 30px; font-size: 12px; }
              .footer { margin-top: 50px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
              .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
              .sig-line { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; font-size: 11px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${contract.name}</div>
              <div style="font-size: 12px; margin-top: 5px; color: #6b7280;">Vexor IT Solutions &bull; Service Agreement</div>
            </div>
            <div class="details">
              <p>This Service Agreement ("Agreement") is made effective as of <strong>${contract.date}</strong> by and between <strong>Vexor IT Solutions</strong> and the undersigned client <strong>Acme Corp</strong>.</p>
              <p><strong>1. Scope of Work:</strong> Vexor IT Solutions agrees to provide custom software development, API routing integration, role authorization configurations, and dashboard deployment services.</p>
              <p><strong>2. Payment:</strong> Client agrees to settle invoices on milestone completion within standard net-30 frames.</p>
              <p><strong>3. Confidentiality:</strong> Both parties agree to protect proprietary source code and database information under standard NDA frameworks.</p>
            </div>
            <div class="signatures">
              <div>
                <br/><br/>
                <div class="sig-line">Authorized Signatory (Vexor IT Solutions)</div>
              </div>
              <div>
                <br/>
                <div style="font-family: 'Courier New', monospace; font-style: italic; font-weight: bold; font-size: 16px; text-align: center;">${contract.status === 'SIGNED' ? '/s/ Robert Chen' : ''}</div>
                <div class="sig-line">Client Representative (Acme Corp)</div>
              </div>
            </div>
            <div class="footer">
              Confidential Service Agreement &bull; Page 1 of 1
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

  const [activeTab, setActiveTab] = useState(defaultTab); // overview, projects, changes, support, invoices, contracts, monitoring, profile
  const [selectedProj, setSelectedProj] = useState<any>(null);
  const [projSubTab, setProjSubTab] = useState('overview'); // overview, timeline, deliverables, files, team

  // Branded welcome customization state
  const [brandColor, setBrandColor] = useState('from-indigo-600 to-blue-500');

  // Change Requests State
  const [changeRequests, setChangeRequests] = useState([
    { id: 'cr1', title: 'Add real-time dashboard analytics export', type: 'Feature Request', priority: 'HIGH', impact: 'Medium — +1 week, +₹80,000', status: 'APPROVED', date: '2026-07-01' },
    { id: 'cr2', title: 'Integrate custom webhook triggers', type: 'Feature Request', priority: 'MEDIUM', impact: 'Pending estimation', status: 'PENDING', date: '2026-07-07' }
  ]);
  const [crTitle, setCrTitle] = useState('');
  const [crType, setCrType] = useState('Feature Request');
  const [crPriority, setCrPriority] = useState('MEDIUM');
  
  // Support Tickets State
  const [tickets, setTickets] = useState([
    { id: 't1', subject: 'Staging environment JWT validation error', priority: 'HIGH', status: 'IN_PROGRESS', date: '2026-07-08' },
    { id: 't2', subject: 'Inquiry about invoice billing details', priority: 'LOW', status: 'RESOLVED', date: '2026-07-04' }
  ]);
  const [newTicketSub, setNewTicketSub] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('MEDIUM');

  // Chat/Messaging State
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'Elena Rostova (PM)', text: 'Hello Robert, we have deployed the JWT Auth layer to staging. Please let us know if you can check it.', time: 'Yesterday' },
    { id: '2', sender: 'Robert Chen (You)', text: 'Thanks Elena, I will verify it right away with the team.', time: 'Yesterday' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Meeting scheduler state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  // Payment simulation state
  const [payingInvoice, setPayingInvoice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Contracts e-sign state
  const [contracts, setContracts] = useState<any[]>([]);

  // AI Client Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiHistory, setAiHistory] = useState<any[]>([
    { sender: 'AI', text: 'Welcome! I am your AI client relationship assistant. You can ask me about project status, milestones, pending invoices, and support tickets.' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  const loadClientData = async () => {
    try {
      const activeUser = getStoredUser();
      setUser(activeUser);

      // Fetch projects
      const projs = await apiRequest('/projects');
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProj(projs[0]);
      }

      // Fetch invoices
      try {
        const invs = await apiRequest('/finance/invoices');
        setInvoices(invs);
      } catch (err) {
        console.warn('Could not load invoices for client:', err);
      }

    } catch (err) {
      console.error('Client dashboard failed to load details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, []);

  // Deliverables handlers
  const handleDeliverableAction = (id: string, actionName: string) => {
    alert(`Deliverable: ${id} status updated to: ${actionName}`);
  };

  // Submit CR
  const handleCreateCR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crTitle.trim()) return;
    setChangeRequests(p => [
      ...p,
      { id: `cr${Date.now()}`, title: crTitle, type: crType, priority: crPriority, impact: 'Pending estimation', status: 'PENDING', date: new Date().toISOString().split('T')[0] }
    ]);
    setCrTitle('');
    alert('Change request registered and dispatched to PM Elena Rostova.');
  };

  // Submit Ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSub.trim()) return;
    setTickets(p => [
      ...p,
      { id: `t${Date.now()}`, subject: newTicketSub, priority: newTicketPriority, status: 'OPEN', date: new Date().toISOString().split('T')[0] }
    ]);
    setNewTicketSub('');
    setNewTicketDesc('');
    alert('Support ticket created successfully.');
  };

  // Submit Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(p => [
      ...p,
      { id: `msg${Date.now()}`, sender: 'Robert Chen (You)', text: chatInput, time: 'Just now' }
    ]);
    setChatInput('');
  };

  // Pay Invoice
  const handlePayInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInvoices(p => p.map(inv => inv.id === payingInvoice.id ? { ...inv, status: 'PAID' } : inv));
    alert(`Payment of ₹${payingInvoice.amount.toLocaleString()} processed via ${paymentMethod.toUpperCase()} successfully.`);
    setPayingInvoice(null);
  };

  // Sign contract
  const handleSignContract = (id: string) => {
    setContracts(p => p.map(c => c.id === id ? { ...c, status: 'SIGNED' } : c));
    alert('Contract signed electronically.');
  };

  // AI assistant handlers
  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userText = aiPrompt;
    setAiHistory(p => [...p, { sender: 'user', text: userText }]);
    setAiPrompt('');
    setAiLoading(true);

    // Simulate AI responses
    setTimeout(() => {
      let reply = "I'm sorry, I could not find that information. Let me ping your Project Manager Elena Rostova.";
      const clean = userText.toLowerCase();

      if (clean.includes('status') || clean.includes('project')) {
        reply = `Your project **${selectedProj?.name || 'Acme Cloud Platform'}** is currently at **75% completion**. The current stage is **Testing** and the next milestone "UAT deployment" is due on July 26.`;
      } else if (clean.includes('invoice') || clean.includes('pending')) {
        const pendingCount = invoices.filter(i => i.status !== 'PAID').length;
        reply = `You have **${pendingCount} pending invoice(s)**. The latest one (#${invoices[0]?.invoiceNumber || 'INV-0912'}) is for **₹${(invoices[0]?.amount || 1200000).toLocaleString()}** due on ${invoices[0]?.dueDate ? new Date(invoices[0].dueDate).toLocaleDateString() : 'July 15'}.`;
      } else if (clean.includes('milestone')) {
        reply = `The next milestone is **Beta Release (UAT Verification)** scheduled for **July 26, 2026**.`;
      } else if (clean.includes('support') || clean.includes('ticket')) {
        reply = `You have **${tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length} active support ticket(s)**. Ticket #t1 "Staging environment JWT validation error" is currently IN_PROGRESS by Daniel Lee.`;
      } else if (clean.includes('deliverable')) {
        reply = `The latest deliverable is **Beta Build v0.9 (JWT Auth layer)** uploaded on July 5. You can download it directly from the Projects > Deliverables tab.`;
      } else if (clean.includes('change') || clean.includes('this week')) {
        reply = `**What changed this week:**\n- Completed backend JWT Authentication flows.\n- Deployed widgets component wireframes to staging.\n- Fixed flex-shrink constraints for mobile dashboard.`;
      } else if (clean.includes('meeting') || clean.includes('schedule')) {
        reply = `I have logged a request to schedule a 30-minute sync call with Elena Rostova. Please check your calendar invites.`;
      }

      setAiHistory(p => [...p, { sender: 'AI', text: reply }]);
      setAiLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Dashboard calculations
  const pendingInvs = invoices.filter(i => i.status !== 'PAID');
  const pendingPaymentsTotal = pendingInvs.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Client Branded Header */}
      <div className={`p-6 rounded-2xl bg-gradient-to-r ${brandColor} text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl`}>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border border-white/20">
              A
            </div>
            <div>
              <h2 className="text-2xl font-black">Acme Corp Client Portal</h2>
              <p className="text-xs text-white/80">Vexor Operating System Client Console</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold bg-white/20 border border-white/10 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            PM: Elena Rostova
          </span>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-white text-blue-600 text-xs font-bold rounded-lg shadow hover:bg-white/95 transition"
          >
            Schedule Sync
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
        {[
          { id: 'overview', name: 'Overview Console', icon: LayoutDashboard },
          { id: 'projects', name: 'Active Projects', icon: Briefcase },
          { id: 'changes', name: 'Change Requests', icon: Zap },
          { id: 'support', name: 'Support Center', icon: HelpCircle },
          { id: 'invoices', name: 'Invoices & Payments', icon: DollarSign },
          { id: 'contracts', name: 'NDA & Agreements', icon: Shield },
          { id: 'monitoring', name: 'Website Monitoring', icon: Globe },
          { id: 'profile', name: 'Settings & Profile', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Health Score and Welcome */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Branded Welcome message */}
              <div className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-base">Welcome Back, Robert</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">We are in Sprint 3 testing. Things are wrapping up for your beta build scheduled for July 26.</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg text-xs flex justify-between">
                  <span className="text-muted-foreground">Pending Approvals</span>
                  <span className="font-bold text-red-400">1 Deliverable</span>
                </div>
              </div>

              {/* Client Health Score */}
              <div className="p-5 rounded-2xl border border-border bg-card flex items-center justify-between gap-4 text-xs">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="#22c55e"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * 96) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black">96</span>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold">Health</span>
                  </div>
                </div>
                <div className="space-y-0.5 text-muted-foreground">
                  <p className="font-bold text-foreground">Health Parameters:</p>
                  <p>• Delivery index: **Optimal**</p>
                  <p>• Payment ledger: **Current**</p>
                  <p>• Communication index: **Excellent**</p>
                </div>
              </div>
            </div>

            {/* Executive Project Summary */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Executive Project Summary</h3>
              <div className="space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>Overall Progress ({selectedProj?.name || 'Acme Cloud Platform'})</span>
                    <span>75%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-secondary/35 rounded-xl space-y-2 border border-border/40">
                    <span className="font-bold text-primary block">Upcoming Milestones</span>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Beta release UAT — July 26, 2026</li>
                      <li>• Final handover release — Dec 31, 2026</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-secondary/35 rounded-xl space-y-2 border border-border/40">
                    <span className="font-bold text-green-500 block">Recent Achievements</span>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>✓ JWT token auth system complete</li>
                      <li>✓ Wireframe mockup reviews accepted</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Recent Workspace Activity</h3>
              <div className="space-y-3 text-xs text-muted-foreground">
                {[
                  { actor: 'Daniel Lee', action: 'completed task "JWT token structure check"', time: '2 hrs ago' },
                  { actor: 'Elena Rostova', action: 'requested approval on deliverable "Beta UI v0.9"', time: 'Yesterday' },
                  { actor: 'Robert Chen', action: 'paid invoice #INV-0911 (₹1,50,000)', time: '3 days ago' }
                ].map((act, i) => (
                  <div key={i} className="flex justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
                    <p className="leading-none"><span className="font-semibold text-foreground">{act.actor}</span> {act.action}</p>
                    <span className="text-[10px] shrink-0">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* AI client assistant panel */}
          <div className="space-y-6">
            
            {/* AI Client assistant box */}
            <div className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-4 h-[350px]">
              <div className="flex justify-between items-center border-b border-border pb-2 shrink-0">
                <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Client Assistant
                </span>
                <span className="text-[8px] px-1 bg-purple-500/10 text-purple-500 rounded border border-purple-500/10 font-bold uppercase">Dynamic Context</span>
              </div>

              {/* Chat pane */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {aiHistory.map((item, i) => (
                  <div key={i} className={`p-2.5 rounded-xl border leading-relaxed ${
                    item.sender === 'AI' 
                      ? 'bg-purple-500/5 border-purple-500/10 text-muted-foreground mr-8' 
                      : 'bg-primary/5 border-primary/10 text-foreground ml-8 text-right'
                  }`}>
                    {item.text}
                  </div>
                ))}
                {aiLoading && (
                  <div className="text-[10px] text-muted-foreground italic animate-pulse">Generating context-aware reply...</div>
                )}
              </div>

              {/* Form Input */}
              <form onSubmit={handleAiAsk} className="flex gap-2 shrink-0">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Ask status, invoices, support tickets..."
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button type="submit" className="p-1.5 bg-primary text-primary-foreground rounded-lg">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Quick suggested client questions */}
            <div className="p-4 rounded-xl bg-secondary/25 border border-border/80 space-y-2 text-xs">
              <span className="font-bold text-muted-foreground uppercase text-[10px]">Suggested Queries</span>
              <div className="flex flex-col gap-1.5 pt-1.5">
                {[
                  'What is the status of my project?',
                  'When is the next milestone?',
                  'Show pending invoices.',
                  'Download the latest deliverable.'
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => {
                      setAiPrompt(q);
                    }}
                    className="text-left text-[10px] p-1.5 rounded bg-background hover:bg-secondary/40 border border-border/40 truncate text-muted-foreground font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ACTIVE PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs">
          {/* Left panel projects selector */}
          <div className="space-y-3">
            <span className="font-bold block text-xs text-muted-foreground uppercase tracking-wider mb-2">My Active Projects</span>
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProj(p);
                  setProjSubTab('overview');
                }}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col space-y-2 ${
                  selectedProj?.id === p.id 
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' 
                    : 'border-border bg-card hover:border-primary/20'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm truncate">{p.name}</h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded uppercase">
                    {p.status}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Tasks: {p.tasks.length}</span>
                  <span>Health: {p.healthScore}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right specific detail tabs */}
          <div className="lg:col-span-3 space-y-6">
            {selectedProj ? (
              <div className="space-y-4">
                <div className="border-b border-border pb-3 flex justify-between items-center">
                  <h3 className="font-bold text-lg">{selectedProj.name}</h3>
                  <span className="text-xs text-muted-foreground">Estimated Delivery: **Dec 31, 2026**</span>
                </div>

                <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
                  {[
                    { id: 'overview', name: 'Overview' },
                    { id: 'timeline', name: 'Timeline Pipeline' },
                    { id: 'deliverables', name: 'Deliverables & Signoffs' },
                    { id: 'files', name: 'Files Uploads' },
                    { id: 'team', name: 'PM & Team Contacts' }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setProjSubTab(subTab.id)}
                      className={`px-3 py-1.5 rounded transition ${
                        projSubTab === subTab.id 
                          ? 'bg-secondary text-foreground font-bold' 
                          : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                      }`}
                    >
                      {subTab.name}
                    </button>
                  ))}
                </div>

                {/* Sub Tab Views */}
                {projSubTab === 'overview' && (
                  <div className="space-y-4 leading-relaxed">
                    <p className="text-muted-foreground text-sm">{selectedProj.description || 'Acme Cloud Platform system integration project.'}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">Project Health</span>
                        <span className="font-bold text-green-500">{selectedProj.healthScore}%</span>
                      </div>
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">Start Date</span>
                        <span className="font-bold">{selectedProj.startDate ? new Date(selectedProj.startDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">End Date</span>
                        <span className="font-bold">{selectedProj.endDate ? new Date(selectedProj.endDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">Assigned PM</span>
                        <span className="font-bold">Elena Rostova</span>
                      </div>
                    </div>
                  </div>
                )}

                {projSubTab === 'timeline' && (
                  <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                    <h4 className="font-bold text-sm">Project Lifecycle Timeline</h4>
                    <div className="flex flex-col gap-3">
                      {[
                        { stage: 'Project Started', pct: 100, status: 'Completed', responsible: 'Marcus Broady (Sales)' },
                        { stage: 'Planning & Discovery', pct: 100, status: 'Completed', responsible: 'Elena Rostova (PM)' },
                        { stage: 'Design Wireframes', pct: 100, status: 'Completed', responsible: 'Kai Tanaka (Designer)' },
                        { stage: 'Core Development', pct: 85, status: 'In Progress', responsible: 'Daniel Lee (Dev)' },
                        { stage: 'UAT & Client Review', pct: 0, status: 'Pending', responsible: 'Robert Chen (Client)' },
                        { stage: 'Final Delivery', pct: 0, status: 'Pending', responsible: 'Elena Rostova (PM)' }
                      ].map((row, i) => (
                        <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-secondary/30 rounded-lg border border-border/40 gap-2">
                          <div className="space-y-0.5">
                            <span className="font-bold text-sm block">{row.stage}</span>
                            <span className="text-[10px] text-muted-foreground">Responsible: {row.responsible}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                              row.status === 'Completed' ? 'text-green-500 bg-green-500/10 border-green-500/20' : row.status === 'In Progress' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse' : 'text-slate-400'
                            }`}>{row.status}</span>
                            <span className="font-bold">{row.pct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {projSubTab === 'deliverables' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm">Deliverables Registry</h4>
                    {[
                      { id: 'del1', version: 'v0.9.0', name: 'Auth Server JWT Middleware setup', desc: 'Secure token verification configuration mapping rules.', notes: 'Successfully deployed to staging environments.', date: '2026-07-05', status: 'PENDING_APPROVAL' },
                      { id: 'del2', version: 'v0.8.0', name: 'Dashboard Layout Widgets Designs', desc: 'UI guidelines and layouts Figma parameters.', notes: 'Approved by Robert on 2026-06-25.', date: '2026-06-20', status: 'APPROVED' }
                    ].map((del) => (
                      <div key={del.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <span className="font-mono text-[9px] bg-secondary px-1.5 py-0.5 rounded mr-2">{del.version}</span>
                            <h5 className="font-bold text-sm inline-block">{del.name}</h5>
                            <p className="text-muted-foreground mt-0.5">{del.desc}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                            del.status === 'APPROVED' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
                          }`}>{del.status}</span>
                        </div>

                        <div className="text-[10px] text-muted-foreground">
                          <p>Release Notes: **{del.notes}**</p>
                          <p className="mt-0.5">Uploaded: {del.date}</p>
                        </div>

                        <div className="flex justify-between items-center gap-2 pt-2 border-t border-border/40">
                          <button
                            onClick={() => alert(`Downloading file deliverable for ${del.name}`)}
                            className="flex items-center gap-1 font-bold text-primary hover:underline"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Deliverable
                          </button>
                          
                          {del.status === 'PENDING_APPROVAL' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeliverableAction(del.id, 'APPROVED')}
                                className="px-3 py-1 bg-green-500 text-white font-bold rounded text-[10px] hover:opacity-90"
                              >
                                Approve Deliverable
                              </button>
                              <button
                                onClick={() => {
                                  const rev = prompt('Enter change/revision requests description:');
                                  if (rev) handleDeliverableAction(del.id, `REVISIONS_REQUESTED: ${rev}`);
                                }}
                                className="px-3 py-1 bg-red-500 text-white font-bold rounded text-[10px] hover:opacity-90"
                              >
                                Request Changes
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {projSubTab === 'files' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm">Upload Project Requirements or Assets</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Upload files */}
                      <div className="p-5 border border-dashed border-border rounded-xl text-center space-y-3 bg-secondary/10">
                        <Upload className="w-7 h-7 text-muted-foreground mx-auto" />
                        <div>
                          <span className="font-bold block">Upload requirement docs / brand assets</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">PDFs, guidelines, videos (max 50MB)</p>
                          <input type="file" id="client-asset" className="hidden" onChange={() => alert('Client asset uploaded')} />
                          <label htmlFor="client-asset" className="text-xs text-blue-400 font-bold hover:underline cursor-pointer block mt-2">Select File</label>
                        </div>
                      </div>

                      {/* Files list */}
                      <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                        <span className="font-bold block text-[10px] uppercase text-muted-foreground mb-2">Company Shared Assets</span>
                        {uploadedFiles.map((f, i) => (
                          <div key={i} className="flex justify-between items-center text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                            <div>
                              <span className="font-bold">{f.name}</span>
                              <p className="text-[9px] text-muted-foreground mt-0.5">Size: {f.size} • Uploaded: {f.date}</p>
                            </div>
                            <button
                              onClick={() => alert(`Downloading client asset ${f.name}`)}
                              className="text-primary hover:underline"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {projSubTab === 'team' && (
                  <div className="p-4 bg-secondary/20 border border-border rounded-xl text-xs space-y-4">
                    <h4 className="font-bold text-sm">Project Delivery Team Contacts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'Elena Rostova', role: 'Project Manager', email: 'pm@vexor.com', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop' },
                        { name: 'Daniel Lee', role: 'Senior Developer', email: 'dev@vexor.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop' }
                      ].map((t, i) => (
                        <div key={i} className="p-3 bg-background border border-border rounded-lg flex items-center gap-3">
                          <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <span className="font-bold block">{t.name}</span>
                            <span className="text-[10px] text-muted-foreground block">{t.role}</span>
                            <a href={`mailto:${t.email}`} className="text-blue-400 text-[10px] hover:underline">{t.email}</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground">Select a project on the left panel to inspect.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHANGE REQUESTS TAB */}
      {activeTab === 'changes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Request New Feature / Scope Change</h3>
              <form onSubmit={handleCreateCR} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Scope Request Title</label>
                  <input
                    type="text"
                    value={crTitle}
                    onChange={e => setCrTitle(e.target.value)}
                    placeholder="e.g. Integrate custom SMS gateway notifications"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Request Type</label>
                    <select
                      value={crType}
                      onChange={e => setCrType(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                    >
                      <option value="Feature Request">Feature Request</option>
                      <option value="Design Change">Design Change</option>
                      <option value="Missing Functionality">Missing Functionality</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Requested Priority</label>
                    <select
                      value={crPriority}
                      onChange={e => setCrPriority(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1.5">Reference Mockup / Upload File</label>
                  <input type="file" className="text-xs" onChange={() => alert('Reference file attached')} />
                </div>
                <button type="submit" className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs">Submit Request</button>
              </form>
            </div>

            {/* Workflow status steps */}
            <div className="p-4 rounded-xl bg-secondary/20 border border-border/80 text-xs text-muted-foreground leading-relaxed">
              <span className="font-bold text-foreground block text-[10px] mb-1">Approval Workflow</span>
              <p>Requested → PM Cost & Timeline impact estimation → Client review & sign-off → Added to sprint backlog.</p>
            </div>
          </div>

          {/* CR List */}
          <div className="lg:col-span-2 space-y-4">
            <span className="font-bold block text-xs text-muted-foreground uppercase tracking-wider mb-2">My Change Requests</span>
            {changeRequests.map(cr => (
              <div key={cr.id} className="p-4 rounded-xl border border-border bg-card text-xs space-y-3">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h5 className="font-bold text-sm">{cr.title}</h5>
                    <p className="text-muted-foreground mt-0.5">Type: {cr.type} • Requested: {cr.date}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                    cr.status === 'APPROVED' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
                  }`}>{cr.status}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground border-t border-border/40 pt-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Impact Details: {cr.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUPPORT CENTER TAB */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Submit Support Ticket</h3>
              <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Ticket Subject</label>
                  <input
                    type="text"
                    value={newTicketSub}
                    onChange={e => setNewTicketSub(e.target.value)}
                    placeholder="e.g. Can't connect checkout component on iOS viewports"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Describe Issue</label>
                  <textarea
                    value={newTicketDesc}
                    onChange={e => setNewTicketDesc(e.target.value)}
                    placeholder="Provide details, screenshots links or error messages..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background h-20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Priority</label>
                  <select
                    value={newTicketPriority}
                    onChange={e => setNewTicketPriority(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs">Raise Ticket</button>
              </form>
            </div>

            {/* Quick chat with PM pane */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-400" /> PM Chat Channel
              </h3>
              
              {/* Chat history */}
              <div className="space-y-2 max-h-[140px] overflow-y-auto text-[11px] leading-relaxed">
                {chatMessages.map(m => (
                  <div key={m.id} className="p-2 bg-secondary/40 border border-border/40 rounded-lg">
                    <span className="font-bold text-[9px] block text-muted-foreground">{m.sender} • {m.time}</span>
                    <p className="mt-0.5 text-muted-foreground">{m.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2 text-xs">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask Elena updates..."
                  className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background"
                />
                <button type="submit" className="px-2 bg-primary text-primary-foreground rounded-lg">Send</button>
              </form>
            </div>
          </div>

          {/* Tickets List */}
          <div className="lg:col-span-2 space-y-4">
            <span className="font-bold block text-xs text-muted-foreground uppercase tracking-wider mb-2">My Support Tickets</span>
            {tickets.map(ticket => (
              <div key={ticket.id} className="p-4 rounded-xl border border-border bg-card text-xs flex justify-between items-center">
                <div>
                  <h5 className="font-bold text-sm">{ticket.subject}</h5>
                  <p className="text-muted-foreground mt-0.5">Created: {ticket.date} • Priority: <span className="font-bold uppercase text-[10px]">{ticket.priority}</span></p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                  ticket.status === 'RESOLVED' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse'
                }`}>{ticket.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INVOICES & PAYMENTS TAB */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs">
            <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Pending Billing Payments</span>
              <h3 className="text-2xl font-black text-red-500">₹{pendingPaymentsTotal.toLocaleString()}</h3>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Paid Invoices</span>
              <h3 className="text-2xl font-black text-green-500">
                ₹{invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Total Disbursed Invoices</span>
              <h3 className="text-2xl font-black">{invoices.length}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card overflow-hidden">
            <h4 className="font-bold text-sm mb-4">Invoices Register</h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase">
                    <th className="py-2.5">Invoice Number</th>
                    <th className="py-2.5">Due Date</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-secondary/15 transition">
                      <td className="py-3 font-bold">{inv.invoiceNumber}</td>
                      <td className="py-3">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 font-semibold">₹{inv.amount.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                          inv.status === 'PAID' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
                        }`}>{inv.status}</span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => printInvoice(inv)}
                          className="px-2 py-1 border border-border rounded text-[10px] hover:bg-secondary transition"
                        >
                          Download
                        </button>
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => setPayingInvoice(inv)}
                            className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded text-[10px] hover:opacity-90"
                          >
                            Pay Online
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-muted-foreground italic">No invoices logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pay Modal */}
          {payingInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm p-6 rounded-2xl border border-border bg-card shadow-2xl space-y-4">
                <h3 className="text-lg font-bold">Online Payment — {payingInvoice.invoiceNumber}</h3>
                <p className="text-xs text-muted-foreground">Amount: <span className="font-bold text-foreground">₹{payingInvoice.amount.toLocaleString()}</span></p>
                
                <form onSubmit={handlePayInvoiceSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] text-muted-foreground uppercase mb-1.5">Select Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                    >
                      <option value="stripe">Stripe Integration</option>
                      <option value="razorpay">Razorpay Gateway</option>
                      <option value="bank">Direct Bank Transfer</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setPayingInvoice(null)} className="px-3.5 py-1.5 border border-border rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg">Complete Payment</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NDA & CONTRACTS TAB */}
      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {contracts.map(contract => (
            <div key={contract.id} className="p-5 rounded-2xl border border-border bg-card space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-1.5"><Shield className="w-4.5 h-4.5 text-purple-400" /> {contract.name}</h4>
                <p className="text-muted-foreground">Signed agreement terms for staging, hosting, design intellectual rights, and project scope.</p>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                  <span>Sign Date: {contract.date}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                    contract.status === 'SIGNED' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
                  }`}>{contract.status}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => printContract(contract)} className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary transition">Download PDF</button>
                {contract.status === 'PENDING_E_SIGN' && (
                  <button
                    onClick={() => handleSignContract(contract.id)}
                    className="flex-1 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-95 transition"
                  >
                    Electronic Sign
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WEBSITE MONITORING TAB */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Website Uptime</span>
              <h3 className="text-xl font-bold mt-1 text-green-500">99.98%</h3>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Lighthouse Speed</span>
              <h3 className="text-xl font-bold mt-1 text-blue-500">92 / 100</h3>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">SEO Index</span>
              <h3 className="text-xl font-bold mt-1">88 / 100</h3>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Security Threats</span>
              <h3 className="text-xl font-bold mt-1 text-green-500">0 Alerts</h3>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <h4 className="font-bold text-sm">Site Parameters Diagnostics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-secondary/35 rounded-lg border border-border/40">
                <span className="text-muted-foreground block text-[10px] uppercase">Domain Expiry</span>
                <span className="font-bold">June 12, 2027</span>
              </div>
              <div className="p-3 bg-secondary/35 rounded-lg border border-border/40">
                <span className="text-muted-foreground block text-[10px] uppercase">SSL Certificate</span>
                <span className="font-bold text-green-500">Valid (240 Days)</span>
              </div>
              <div className="p-3 bg-secondary/35 rounded-lg border border-border/40">
                <span className="text-muted-foreground block text-[10px] uppercase">Hosting Node Status</span>
                <span className="font-bold text-green-500">Active (SGP-1)</span>
              </div>
              <div className="p-3 bg-secondary/35 rounded-lg border border-border/40">
                <span className="text-muted-foreground block text-[10px] uppercase">Backups Ledger</span>
                <span className="font-bold text-green-500">Success (Daily)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS & PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-2xl border border-border bg-card space-y-6 text-xs max-w-xl">
          <div>
            <h4 className="font-bold text-sm">Company Settings & Preferences</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Manage details for billing, authorized users, and GST registrations.</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            alert('Preferences and branding welcome message saved successfully.');
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase mb-1.5">Authorized Contact Person</label>
                <input type="text" defaultValue="Robert Chen" className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase mb-1.5">GST Identification Number</label>
                <input type="text" defaultValue="27AAAAA0000A1Z5" className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-muted-foreground uppercase mb-1.5">Billing Address</label>
              <input type="text" defaultValue="12th Floor, Tower B, Acme Tech Park, Bangalore" className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase mb-1.5">Workspace Welcome Banner Message</label>
                <input type="text" defaultValue="Welcome Back, Robert" className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase mb-1.5">Branded Sidebar colors</label>
                <select
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[11px]"
                >
                  <option value="from-indigo-600 to-blue-500">Indigo Deep-Gradient</option>
                  <option value="from-emerald-600 to-teal-500">Emerald Forest-Gradient</option>
                  <option value="from-rose-600 to-pink-500">Rose Petals-Gradient</option>
                </select>
              </div>
            </div>

            <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs">Save Workspace settings</button>
          </form>
        </div>
      )}

      {/* SCHEDULE SYNC MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl border border-border bg-card shadow-2xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-1.5"><Video className="w-5 h-5 text-blue-400" /> Schedule PM Meeting</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              alert(`Meeting scheduled with Elena Rostova for ${meetingDate} at ${meetingTime}. Meeting link dispatched.`);
              setShowScheduleModal(false);
            }} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1">Meeting Agenda</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Sprint 3 Demo Sign-off"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Select Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Select Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={e => setMeetingTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-3.5 py-1.5 border border-border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg">Schedule Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
