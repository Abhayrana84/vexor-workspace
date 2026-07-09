'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Plus, Activity, RefreshCw, ShieldCheck, Database, Calendar } from 'lucide-react';

export default function Monitoring() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add monitor form
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadMonitors = async () => {
    try {
      const data = await apiRequest('/monitoring');
      setMonitors(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitors();
  }, []);

  const handleAddMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/monitoring', {
        method: 'POST',
        body: JSON.stringify({ name, url }),
      });
      setShowModal(false);
      setName('');
      setUrl('');
      loadMonitors();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTriggerPing = async (id: string) => {
    try {
      await apiRequest(`/monitoring/${id}/ping`, { method: 'POST' });
      loadMonitors();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Website Health Monitor</h2>
          <p className="text-sm text-muted-foreground">Monitor client portal landing pages, API response latency, and SSL credentials.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg text-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Add Website
        </button>
      </div>

      {/* Grid of Monitors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {monitors.map((mon) => {
          const isUp = mon.lastPingStatus >= 200 && mon.lastPingStatus < 400;
          return (
            <div key={mon.id} className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-base leading-tight">{mon.name}</h3>
                    <a href={mon.url} target="_blank" className="text-xs text-blue-500 hover:underline truncate mt-1 block max-w-[220px]">
                      {mon.url}
                    </a>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 ${
                    isUp 
                      ? 'bg-green-500/10 text-green-500 border-green-500/10'
                      : 'bg-red-500/10 text-red-500 border-red-500/10'
                  }`}>
                    {isUp ? 'Operational' : 'Downtime Alert'}
                  </span>
                </div>

                {/* KPI stats */}
                <div className="grid grid-cols-2 gap-4 border-y border-border/80 py-4 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Uptime Ratio</span>
                    <span className="font-bold text-sm text-green-500 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" />
                      {mon.uptimeRatio}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Last Checked Code</span>
                    <span className="font-bold text-sm">
                      HTTP {mon.lastPingStatus || 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Expiry alerts */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> SSL Certificate</span>
                    <span className="text-foreground font-medium">
                      {mon.sslExpiry ? `Expires ${new Date(mon.sslExpiry).toLocaleDateString()}` : 'Not Checked'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Domain Registrar</span>
                    <span className="text-foreground font-medium">
                      {mon.domainExpiry ? `Expires ${new Date(mon.domainExpiry).toLocaleDateString()}` : 'Not Checked'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action trigger */}
              <button
                onClick={() => handleTriggerPing(mon.id)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg bg-secondary text-foreground hover:bg-secondary/80 border border-border transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Trigger Health Diagnostics
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Website Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-2xl relative">
            <h3 className="text-xl font-bold mb-6">Register Target Website</h3>
            <form onSubmit={handleAddMonitor} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Website Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. Acme Production Portal"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Target Destination URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. https://myclient.com"
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
                  Add Monitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
