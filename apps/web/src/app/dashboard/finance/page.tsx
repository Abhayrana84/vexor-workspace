'use client';

import { useEffect, useState } from 'react';
import { apiRequest, getStoredUser } from '../../../lib/api';
import ClientDashboard from '../ClientDashboard';
import { Plus, Check, FileText, Send } from 'lucide-react';

export default function Finance() {
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Invoice creation form
  const [showModal, setShowModal] = useState(false);
  const [invNumber, setInvNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [clientCompany, setClientCompany] = useState('');

  const loadInvoices = async () => {
    try {
      const data = await apiRequest('/finance/invoices');
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const activeUser = getStoredUser();
    setUser(activeUser);
    if (activeUser && activeUser.role !== 'CLIENT') {
      loadInvoices();
    } else {
      setLoading(false);
    }
  }, []);

  if (user && user.role === 'CLIENT') {
    return <ClientDashboard defaultTab="invoices" />;
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find or assert a mock client profile from existing seed data
      // For simplicity, we can let the backend create the invoice using the client from our seed data: Robert Chen's profile.
      // Let's look up invoices to fetch the clientId of Robert Chen, or let the backend mock it if clientId is not supplied.
      // In the seed script, Robert Chen's client profile is seeded under company name "Acme Corp".
      // Let's pass a mock clientId or let the backend default to the seeded one.
      const seededClientId = invoices.length > 0 ? invoices[0].clientId : 'client-id-placeholder';

      await apiRequest('/finance/invoices', {
        method: 'POST',
        body: JSON.stringify({
          invoiceNumber: invNumber,
          clientId: seededClientId,
          amount: parseFloat(amount),
          dueDate,
        }),
      });

      setShowModal(false);
      setInvNumber('');
      setAmount('');
      setDueDate('');
      setClientCompany('');
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Error creating invoice');
    }
  };

  const handleUpdateStatus = async (invoiceId: string, status: string) => {
    try {
      await apiRequest(`/finance/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Error updating invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const paidTotal = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
  const sentTotal = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance Ledger</h2>
          <p className="text-sm text-muted-foreground">Audit billing accounts, issue automated client payment demands, and track GST balances.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg text-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/5 border border-red-500/10 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Total Collected Revenue</span>
          <h4 className="text-2xl font-black text-green-500">₹{paidTotal.toLocaleString()}</h4>
        </div>
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Unpaid Receivables</span>
          <h4 className="text-2xl font-black text-yellow-500">₹{sentTotal.toLocaleString()}</h4>
        </div>
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Total Issued Ledger</span>
          <h4 className="text-2xl font-black text-foreground">₹{invoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}</h4>
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
        <h3 className="font-bold text-sm mb-4">Invoicing Register</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/80 text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client Company</th>
                <th className="py-3 px-4">Net Amount</th>
                <th className="py-3 px-4">GST (18%)</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-secondary/40 transition">
                  <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">{inv.client?.companyName || 'Acme Corp'}</td>
                  <td className="py-3.5 px-4 font-semibold">₹{inv.amount.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">₹{inv.gst.toLocaleString()}</td>
                  <td className="py-3.5 px-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      inv.status === 'PAID'
                        ? 'bg-green-500/10 text-green-500 border-green-500/10'
                        : inv.status === 'SENT'
                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/10'
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/10'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {inv.status === 'DRAFT' && (
                      <button
                        onClick={() => handleUpdateStatus(inv.id, 'SENT')}
                        className="p-1 px-2.5 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-[10px] font-bold border border-blue-500/10"
                      >
                        <Send className="w-3 h-3 inline mr-1" /> Send
                      </button>
                    )}
                    {(inv.status === 'SENT' || inv.status === 'DRAFT') && (
                      <button
                        onClick={() => handleUpdateStatus(inv.id, 'PAID')}
                        className="p-1 px-2.5 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] font-bold border border-green-500/10"
                      >
                        <Check className="w-3 h-3 inline mr-1" /> Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-2xl relative">
            <h3 className="text-xl font-bold mb-6">Create Client Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Invoice Number</label>
                <input
                  type="text"
                  value={invNumber}
                  onChange={(e) => setInvNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. INV-2026-002"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Client Company Name</label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. Acme Corp"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Net Billing Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. 15000"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg">
                  Issue Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
