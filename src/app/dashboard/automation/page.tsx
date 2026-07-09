'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Play, Plus, Zap, ArrowDown, Settings, ServerCrash, Terminal } from 'lucide-react';

export default function Automation() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkflow, setActiveWorkflow] = useState<any>(null);
  
  // Simulation logs state
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simulating, setSimulating] = useState(false);

  const loadAutomations = async () => {
    try {
      const data = await apiRequest('/automations');
      setAutomations(data);
      if (data.length > 0) {
        setActiveWorkflow(data[0]);
      }
    } catch (err: any) {
      console.error(err.message);
      // Fail-safe mocks for visual demo
      const mockAuto = {
        id: 'mock-auto-id',
        name: 'Lead Intake Pipeline',
        trigger: JSON.stringify({ event: 'LeadCreated' }),
        actions: JSON.stringify([
          { type: 'assignRoundRobin', params: { role: 'SALES_EXECUTIVE' } },
          { type: 'sendEmail', params: { template: 'welcome_lead' } },
          { type: 'createTask', params: { title: 'First outreach call' } },
        ]),
      };
      setAutomations([mockAuto]);
      setActiveWorkflow(mockAuto);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAutomations();
  }, []);

  const handleSimulate = async () => {
    if (!activeWorkflow) return;
    setSimulating(true);
    setSimLogs(['Initializing local runner execution pipeline...']);
    try {
      const res = await apiRequest(`/automations/${activeWorkflow.id}/simulate`, {
        method: 'POST',
      });
      
      // Print logs with typing delays to simulate real execution
      let currentLogIdx = 0;
      const interval = setInterval(() => {
        if (currentLogIdx < res.logs.length) {
          setSimLogs((prev) => [...prev, res.logs[currentLogIdx]]);
          currentLogIdx++;
        } else {
          clearInterval(interval);
          setSimulating(false);
        }
      }, 500);
    } catch (err: any) {
      setSimLogs((prev) => [...prev, `[Error] Simulation execution crashed: ${err.message}`]);
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const triggerNode = activeWorkflow ? JSON.parse(activeWorkflow.trigger) : null;
  const actionNodes = activeWorkflow ? JSON.parse(activeWorkflow.actions) : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automation Engine</h2>
          <p className="text-sm text-muted-foreground">Draft visual workflow automation graphs with triggers and sequential action nodes.</p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={simulating || !activeWorkflow}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:opacity-90 transition disabled:opacity-55"
        >
          <Play className="w-4 h-4 fill-current" />
          Test Workflow
        </button>
      </div>

      {activeWorkflow ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visual Workspace Canvas */}
          <div className="lg:col-span-2 p-8 rounded-2xl border border-border bg-card/40 flex flex-col items-center justify-center space-y-6 relative overflow-hidden min-h-[500px]">
            {/* Grid pattern background */}
            <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            {/* Visual trigger Node */}
            <div className="z-10 w-64 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-md text-xs text-center space-y-1 shadow-sm">
              <span className="inline-flex p-1.5 rounded-lg bg-blue-500/10 text-blue-500 mb-2">
                <Zap className="w-4 h-4 fill-current" />
              </span>
              <div className="font-extrabold text-[10px] text-blue-500 uppercase tracking-widest">Trigger Node</div>
              <h4 className="font-bold text-foreground">Event: {triggerNode?.event || 'Lead Created'}</h4>
            </div>

            <ArrowDown className="w-5 h-5 text-muted-foreground shrink-0" />

            {/* Action nodes loop */}
            {actionNodes.map((act: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center justify-center space-y-6 w-full shrink-0">
                <div className="z-10 w-64 p-4 rounded-xl border border-border bg-card shadow-lg text-xs text-center space-y-1 relative">
                  <span className="absolute top-2.5 right-2.5 p-1 text-muted-foreground hover:text-foreground cursor-pointer">
                    <Settings className="w-3.5 h-3.5" />
                  </span>
                  <div className="font-bold text-[9px] text-muted-foreground uppercase tracking-widest">Action Step {idx + 1}</div>
                  <h4 className="font-bold text-foreground capitalize mt-1">{act.type.replace(/([A-Z])/g, ' $1')}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">{JSON.stringify(act.params)}</p>
                </div>
                {idx < actionNodes.length - 1 && <ArrowDown className="w-5 h-5 text-muted-foreground shrink-0" />}
              </div>
            ))}

            {/* Add Node placeholder */}
            <ArrowDown className="w-5 h-5 text-muted-foreground shrink-0" />
            <button className="z-10 flex items-center gap-1.5 px-3 py-2 border border-dashed border-border hover:border-accent bg-card/60 text-xs font-semibold rounded-lg transition text-muted-foreground hover:text-accent">
              <Plus className="w-3.5 h-3.5" /> Insert Action
            </button>
          </div>

          {/* Running Console logs */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col h-[500px] justify-between">
            <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-green-500" />
                Execution Log Trace
              </h3>
              
              <div className="flex-1 bg-black text-green-500 rounded-xl p-4 font-mono text-[10px] space-y-2 overflow-y-auto leading-relaxed border border-border">
                {simLogs.map((log, idx) => (
                  <p key={idx} className={log.startsWith('[Error]') ? 'text-red-500' : log.startsWith('[Success]') ? 'text-blue-400' : ''}>
                    {log}
                  </p>
                ))}
                {simLogs.length === 0 && (
                  <span className="text-muted-foreground/60 italic">Console idle. Press "Test Workflow" to run trace diagnostics.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">Setup automations list on backend database.</p>
        </div>
      )}
    </div>
  );
}
