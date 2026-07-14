'use client';

import { useEffect, useState, useRef } from 'react';
import { apiRequest, getStoredUser } from '../../lib/api';
import AntigravityIDE from '../../components/AntigravityIDE';
import {
  Play, Square, CheckCircle, Clock, Bug, FolderGit, BookOpen, Award,
  AlertCircle, Calendar, Sparkles, Plus, MessageSquare, Send, Github,
  GitBranch, GitPullRequest, Check, RotateCcw, FileText, Layout, User,
  Video, Upload, LogIn, LogOut, Code, AlertTriangle, ArrowRight, CheckSquare,
  Mail
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function DeveloperDashboard({ defaultTab = 'workspace' }: { defaultTab?: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(defaultTab); // workspace, projects, repo, bugs, docs, learning, performance
  
  // Timer State
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const timerRef = useRef<any>(null);
  
  // Attendance State
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Standup State
  const [blockers, setBlockers] = useState<string[]>([]);
  const [newBlocker, setNewBlocker] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);

  // Project details selected
  const [selectedProj, setSelectedProj] = useState<any>(null);
  const [projSubTab, setProjSubTab] = useState('overview'); // overview, req, figma, api, schema, git, tasks, members

  // Task details selected
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [logHoursMin, setLogHoursMin] = useState(60);
  const [logHoursDesc, setLogHoursDesc] = useState('');

  // Bugs State
  const [bugs, setBugs] = useState<any[]>([]);
  const [selectedBug, setSelectedBug] = useState<any>(null);
  const [bugEstFix, setBugEstFix] = useState('');
  const [bugRootCause, setBugRootCause] = useState('');
  const [bugCommits, setBugCommits] = useState('');

  // Pull Requests State
  const [gitProvider, setGitProvider] = useState('github'); // github, gitlab, bitbucket
  const [pullRequests, setPullRequests] = useState<any[]>([]);
  const [newPrTitle, setNewPrTitle] = useState('');
  const [newPrBranch, setNewPrBranch] = useState('feature/');

  // Workload analyzer recommendation
  const [showWorkloadAlert, setShowWorkloadAlert] = useState(false);

  const loadDashboardData = async () => {
    try {
      const activeUser = getStoredUser();
      setUser(activeUser);

      // Fetch projects
      const data = await apiRequest('/projects');
      setProjects(data);

      // Filter projects and tasks assigned to the current user
      const filteredProjs = data.filter((p: any) => 
        p.tasks.some((t: any) => t.assigneeId === activeUser.id)
      );
      setAssignedProjects(filteredProjs);
      if (filteredProjs.length > 0) {
        setSelectedProj(filteredProjs[0]);
      }

      const tasks = data.flatMap((p: any) => 
        p.tasks.filter((t: any) => t.assigneeId === activeUser.id).map((t: any) => ({ ...t, projectName: p.name }))
      );
      setAssignedTasks(tasks);

      // Load attendance logs
      try {
        const profile = await apiRequest('/hrms/profile');
        setAttendanceLogs(profile.attendance || []);
        const activeCheckIn = profile.attendance.find((a: any) => !a.checkOut);
        if (activeCheckIn) {
          setIsClockedIn(true);
        }
      } catch (err) {
        console.warn('Could not load attendance logs:', err);
      }

      // Fetch assigned leads
      try {
        const leadsData = await apiRequest('/crm/leads');
        setLeads(leadsData || []);
      } catch (e) {
        console.warn('Could not load assigned leads:', e);
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Timer Hook
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Clock in/out handlers
  const handleClockToggle = async () => {
    setAttendanceLoading(true);
    try {
      if (isClockedIn) {
        await apiRequest('/hrms/attendance/check-out', { method: 'POST' });
        setIsClockedIn(false);
        alert('Clocked out successfully.');
      } else {
        await apiRequest('/hrms/attendance/check-in', { method: 'POST' });
        setIsClockedIn(true);
        alert('Clocked in successfully.');
      }
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Error checking in/out');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Tasks actions
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await apiRequest(`/projects/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      alert(`Status updated to ${newStatus}`);
      loadDashboardData();
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const c = await apiRequest(`/projects/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText })
      });
      setSelectedTask((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), c]
      }));
      setCommentText('');
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    }
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/projects/tasks/${selectedTask.id}/timelog`, {
        method: 'POST',
        body: JSON.stringify({ durationMin: logHoursMin, description: logHoursDesc })
      });
      alert('Time logged successfully!');
      setLogHoursDesc('');
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to log time');
    }
  };

  const handleWorkloadAnalyzer = () => {
    setShowWorkloadAlert(true);
  };

  const triggerRedistribution = () => {
    alert('Task redistribution requested has been submitted to PM Elena Rostova.');
    setShowWorkloadAlert(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Dashboard calculations
  const totalCompletedTasks = assignedTasks.filter((t: any) => t.status === 'DONE' || t.status === 'COMPLETED').length;
  const inDevelopmentTasks = assignedTasks.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'IN_DEVELOPMENT').length;

  return (
    <div className="space-y-6">
      {/* Dev Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Developer workspace</h2>
          <p className="text-xs text-muted-foreground mt-1">Focus Mode & Execution Board — Daniel Lee (Senior Developer)</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Clock in/out widget */}
          <button
            onClick={handleClockToggle}
            disabled={attendanceLoading}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition ${
              isClockedIn 
                ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' 
                : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
            }`}
          >
            {isClockedIn ? <LogOut className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
            {isClockedIn ? 'Clock Out' : 'Clock In'}
          </button>

          {/* Personal Workload Analyzer */}
          <button
            onClick={handleWorkloadAnalyzer}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyze Workload
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
        {[
          { id: 'workspace', name: 'My Workspace', icon: Layout },
          { id: 'projects', name: 'My Projects', icon: Code },
          { id: 'leads', name: 'My Leads', icon: User },
          { id: 'bugs', name: 'Bugs Management', icon: Bug },
          { id: 'repo', name: 'Git & Code Reviews', icon: FolderGit },
          { id: 'ide', name: '✦ Antigravity IDE', icon: Code },
          { id: 'docs', name: 'Docs & Guidelines', icon: FileText },
          { id: 'learning', name: 'Learning Center', icon: BookOpen },
          { id: 'performance', name: 'Performance Reports', icon: Award }
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

      {/* Workload Modal Alert */}
      {showWorkloadAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl border border-border bg-card shadow-2xl">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
              <Sparkles className="text-yellow-500 w-5 h-5" />
              AI Workload Diagnostics
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Based on active sprints, task estimates, and code reviews, the AI estimates your current capacity utilization is **84%** (Optimal capacity is 70-80%).
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-500 space-y-1 mb-4">
              <span className="font-bold block">Status: Overloaded Risk</span>
              <p>You have 3 high priority tasks due within 48 hours. Velocity prediction indicates potential delays in "Implement Payment gateway integration".</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowWorkloadAlert(false)}
                className="px-3.5 py-1.5 border border-border rounded-lg text-xs"
              >
                Dismiss
              </button>
              <button
                onClick={triggerRedistribution}
                className="px-4 py-1.5 bg-yellow-500 text-black font-semibold rounded-lg text-xs hover:opacity-95"
              >
                Request Task Redistribution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE TAB */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tasks and time tracker */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Standup Widget */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3 relative overflow-hidden">
              <div className="absolute top-3 right-3 py-0.5 px-2 text-[9px] font-bold text-accent border border-accent/20 bg-blue-500/5 rounded uppercase">
                Daily Stand-up Checklist
              </div>
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">Smart Standup Agenda</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold block text-[10px] text-muted-foreground uppercase mb-1">Yesterday Completed</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Fixed CSS alignment on navigation headers</li>
                    <li>Wrote Prisma schema migrations for Auth service</li>
                  </ul>
                </div>
                <div>
                  <span className="font-semibold block text-[10px] text-muted-foreground uppercase mb-1">Today Priorities</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Connect checkout widget to Stripe backend</li>
                    <li>Submit pull request for review of login UI</li>
                  </ul>
                </div>
              </div>

              {/* Blockers Section */}
              <div className="border-t border-border/40 pt-3">
                <span className="font-semibold block text-[10px] text-muted-foreground uppercase mb-1.5">Blockers Report</span>
                <div className="space-y-2">
                  {blockers.map((bl, i) => (
                    <div key={i} className="flex gap-2 items-start text-red-500/80">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{bl}</span>
                    </div>
                  ))}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (newBlocker.trim()) {
                      setBlockers(p => [...p, newBlocker.trim()]);
                      setNewBlocker('');
                    }
                  }} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add active blocker..."
                      value={newBlocker}
                      onChange={e => setNewBlocker(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background"
                    />
                    <button type="submit" className="px-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-lg">Raise Block&apos;d</button>
                  </form>
                </div>
              </div>
            </div>

            {/* My Tasks Section */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">My Assigned Tasks</h3>
                <span className="text-xs font-bold text-blue-500 bg-blue-500/10 border border-blue-500/10 px-2 py-0.5 rounded-full">
                  {assignedTasks.length} total
                </span>
              </div>
              <div className="space-y-3">
                {assignedTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="p-4 rounded-xl border border-border bg-background hover:border-primary/20 transition cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-primary">{t.projectName}</span>
                        <span className="text-[10px] text-muted-foreground">• Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'}</span>
                      </div>
                      <h4 className="font-bold text-sm">{t.title}</h4>
                      <p className="text-xs text-muted-foreground truncate max-w-lg">{t.description || 'No description provided.'}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 border rounded uppercase ${
                        t.priority === 'CRITICAL' || t.priority === 'HIGH' ? 'text-red-500 border-red-500/25 bg-red-500/5' : 'text-slate-400 border-slate-500/25'
                      }`}>
                        {t.priority}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded uppercase">
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
                {assignedTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-6">No tasks assigned to you right now.</p>
                )}
              </div>
            </div>

            {/* Time Tracker Widget */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Time Tracker</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Active Session timer */}
                <div className="bg-secondary/40 border border-border p-4 rounded-xl flex flex-col justify-between items-center text-center space-y-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Active Task Timer</span>
                  <div className="text-3xl font-black font-mono tracking-wider">{formatTime(elapsedTime)}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsTimerActive(!isTimerActive)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
                        isTimerActive 
                          ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20' 
                          : 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20'
                      }`}
                    >
                      {isTimerActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isTimerActive ? 'Pause' : 'Start'}
                    </button>
                    <button
                      onClick={() => {
                        setIsTimerActive(false);
                        setElapsedTime(0);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-secondary transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  </div>
                </div>

                {/* Manual Time Entry */}
                <div className="space-y-3">
                  <span className="font-semibold block text-[10px] text-muted-foreground uppercase">Manual Time Entry</span>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    alert('Time logged and added to timesheet successfully.');
                  }} className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-muted-foreground mb-1">Select Task</label>
                      <select className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background">
                        {assignedTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-1">Duration (mins)</label>
                        <input type="number" defaultValue="60" className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-1">Work Date</label>
                        <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs">Log Entry</button>
                  </form>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: AI widget, Notifications, Performance score */}
          <div className="space-y-6">
            
            {/* Quick Performance gauge */}
            <div className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between items-center text-center space-y-4">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-widest">My Performance Index</h3>
              <div className="relative w-28 h-28 shrink-0">
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
                    strokeDashoffset={264 - (264 * 94) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black">94</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">Excellent</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                <p>Story points completed: **42 pts**</p>
                <p>Estimation Accuracy: **91%**</p>
                <p>Bug Resolution Rate: **1.2 days**</p>
              </div>
            </div>

            {/* Notifications Feed */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-widest">Inbox Notifications</h3>
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="text-xs flex gap-2.5 items-start p-2.5 rounded-lg bg-secondary/35 border border-border/40">
                    {n.type === 'bug' ? (
                      <Bug className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : n.type === 'meeting' ? (
                      <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <p className="font-medium leading-tight">{n.text}</p>
                      <span className="text-[9px] text-muted-foreground block">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meetings list */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-widest">Today Meetings</h3>
              <div className="space-y-2 text-xs">
                {[
                  { time: '10:00 AM', title: 'Daily Dev Stand-up', duration: '15m', link: '#' },
                  { time: '3:00 PM', title: 'Sprint 3 Grooming Meeting', duration: '45m', link: '#' }
                ].map((meet, i) => (
                  <div key={i} className="flex justify-between items-center p-2 border-b border-border/40 last:border-0 pb-2 last:pb-0">
                    <div>
                      <span className="font-bold text-primary">{meet.time}</span>
                      <p className="font-medium text-muted-foreground leading-none mt-0.5">{meet.title}</p>
                    </div>
                    <a href={meet.link} className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline">
                      Join <Video className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MY PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left panel: assigned projects list */}
          <div className="space-y-3">
            <span className="font-bold block text-xs text-muted-foreground uppercase tracking-wider mb-2">My Assigned Projects</span>
            {assignedProjects.map((p) => (
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
            {assignedProjects.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No assigned projects found.</p>
            )}
          </div>

          {/* Right panel: project specifics tabs */}
          <div className="lg:col-span-3 space-y-6">
            {selectedProj ? (
              <div className="space-y-4">
                <div className="border-b border-border pb-3 flex justify-between items-center">
                  <h3 className="font-bold text-lg">{selectedProj.name}</h3>
                  <span className="text-xs text-muted-foreground">Health Index: **{selectedProj.healthScore}%**</span>
                </div>

                {/* Sub-tabs */}
                <div className="flex flex-wrap gap-1 border-b border-border pb-2">
                  {[
                    { id: 'overview', name: 'Overview' },
                    { id: 'req', name: 'Requirements' },
                    { id: 'figma', name: 'Designs' },
                    { id: 'api', name: 'API Docs' },
                    { id: 'schema', name: 'Database Schema' },
                    { id: 'git', name: 'Git Repo' },
                    { id: 'tasks', name: 'Tasks Board' }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setProjSubTab(subTab.id)}
                      className={`text-xs px-3 py-1.5 rounded transition ${
                        projSubTab === subTab.id 
                          ? 'bg-secondary text-foreground font-bold' 
                          : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                      }`}
                    >
                      {subTab.name}
                    </button>
                  ))}
                </div>

                {/* Sub-tab view */}
                {projSubTab === 'overview' && (
                  <div className="space-y-4 text-xs leading-relaxed">
                    <p className="text-muted-foreground text-sm">{selectedProj.description || 'No description added yet.'}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">Start Date</span>
                        <span className="font-bold">{selectedProj.startDate ? new Date(selectedProj.startDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">Target Date</span>
                        <span className="font-bold">{selectedProj.endDate ? new Date(selectedProj.endDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">Manager</span>
                        <span className="font-bold">{selectedProj.manager ? `${selectedProj.manager.firstName} ${selectedProj.manager.lastName}` : 'Elena Rostova'}</span>
                      </div>
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <span className="text-muted-foreground block text-[10px]">Milestones</span>
                        <span className="font-bold">{selectedProj.milestones.length} active</span>
                      </div>
                    </div>
                  </div>
                )}

                {projSubTab === 'req' && (
                  <div className="p-4 rounded-xl bg-secondary/20 border border-border text-xs space-y-3">
                    <h4 className="font-bold text-sm flex items-center gap-1.5"><FileText className="w-4 h-4" /> Requirement Specifications</h4>
                    <p className="text-muted-foreground">Detailed user stories, functional scopes, and release acceptance guidelines for the project.</p>
                    <div className="space-y-2 pt-2">
                      <div className="border-l-2 border-primary pl-3 py-1 bg-background/50">
                        <span className="font-bold block text-[10px] uppercase text-primary">US-102: JWT Auth Layer Validation</span>
                        <p className="text-muted-foreground">Standard token format verification via header parsing on all dynamic controller endpoints.</p>
                      </div>
                      <div className="border-l-2 border-primary pl-3 py-1 bg-background/50">
                        <span className="font-bold block text-[10px] uppercase text-primary">US-103: Multi-role routing guards</span>
                        <p className="text-muted-foreground">Restrict client access only to their specific invoices page; restrict developers from finance stats views.</p>
                      </div>
                    </div>
                  </div>
                )}

                {projSubTab === 'figma' && (
                  <div className="p-5 rounded-xl border border-dashed border-border text-center space-y-4">
                    <Layout className="w-8 h-8 text-muted-foreground mx-auto" />
                    <div>
                      <h4 className="font-bold text-sm">Figma Workspace Assets</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Mockups, wireframes, and design guidelines for desktop/mobile views.</p>
                    </div>
                    <a href="https://figma.com/file/mock" target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold px-4 py-2 border border-border bg-secondary hover:bg-secondary/70 rounded-lg">
                      Open Figma File Link
                    </a>
                  </div>
                )}

                {projSubTab === 'api' && (
                  <div className="p-4 rounded-xl bg-secondary/20 border border-border text-xs space-y-4">
                    <h4 className="font-bold text-sm">Interactive Swagger API Documentation</h4>
                    <div className="space-y-3">
                      {[
                        { method: 'GET', path: '/api/projects', desc: 'Fetch projects list mapped by organization ID' },
                        { method: 'POST', path: '/api/projects/:id/tasks', desc: 'Create a task under project parent scope' },
                        { method: 'PATCH', path: '/api/projects/tasks/:id/status', desc: 'Move task state along pipelines' }
                      ].map((endpoint, i) => (
                        <div key={i} className="p-3 bg-background rounded-lg border border-border/80 flex justify-between items-center gap-3">
                          <div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              endpoint.method === 'GET' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                            }`}>{endpoint.method}</span>
                            <span className="font-mono text-xs ml-2">{endpoint.path}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{endpoint.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {projSubTab === 'schema' && (
                  <div className="p-4 bg-secondary/20 border border-border rounded-xl text-xs space-y-4">
                    <h4 className="font-bold text-sm">Prisma Schema Diagram</h4>
                    <pre className="p-3 bg-background border border-border rounded-lg font-mono text-[10px] overflow-x-auto text-muted-foreground leading-relaxed">
{`model Project {
  id             String    @id @default(uuid())
  name           String
  description    String?
  healthScore    Int       @default(100)
  tasks          Task[]
  milestones     Milestone[]
  createdAt      DateTime  @default(now())
}

model Task {
  id          String   @id @default(uuid())
  title       String
  status      String   @default("TODO")
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
}`}
                    </pre>
                  </div>
                )}

                {projSubTab === 'git' && (
                  <div className="p-4 bg-secondary/20 border border-border rounded-xl text-xs space-y-3">
                    <h4 className="font-bold text-sm flex items-center gap-1.5"><Github className="w-4 h-4" /> Git Integration Repository</h4>
                    <div className="p-3 bg-background border border-border rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold">Repository:</span>
                        <a href="https://github.com/vexor-os/workspace" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          github.com/vexor-os/workspace
                        </a>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold">Active Branch:</span>
                        <span className="font-mono bg-secondary px-1.5 py-0.5 rounded">feature/auth-jwt</span>
                      </div>
                    </div>
                  </div>
                )}

                {projSubTab === 'tasks' && (
                  <div className="space-y-3 text-xs">
                    {selectedProj.tasks.map((task: any) => (
                      <div key={task.id} className="p-3 bg-background border border-border rounded-lg flex justify-between items-center">
                        <div>
                          <h5 className="font-bold">{task.title}</h5>
                          <span className="text-[10px] text-muted-foreground">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary border border-border rounded uppercase">
                          {task.status}
                        </span>
                      </div>
                    ))}
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

      {/* MY LEADS TAB */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl border border-border/80 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent backdrop-blur-md relative overflow-hidden">
            <h2 className="text-xl md:text-2xl font-black">My Assigned Leads</h2>
            <p className="text-xs text-muted-foreground mt-1">Track requirements and outreach timeline for prospects assigned to you.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <div key={lead.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                      lead.score >= 70 ? 'bg-green-500/10 text-green-500 border-green-500/25' : lead.score >= 40 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/25' : 'bg-red-500/10 text-red-400 border-red-500/25'
                    }`}>
                      Score: {lead.score}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded uppercase">
                      {lead.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{lead.title}</h4>
                  <p className="text-xs text-muted-foreground">{lead.companyName}</p>
                  
                  {/* Contact Info */}
                  <div className="pt-2.5 border-t border-border/40 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-3 h-3 text-primary" />
                      <span className="font-semibold text-foreground">{lead.contactName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="w-3 h-3 text-primary" />
                      <a href={`mailto:${lead.email}`} className="hover:underline truncate">{lead.email}</a>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={lead.status}
                    onChange={async (e) => {
                      try {
                        await apiRequest(`/crm/leads/${lead.id}/status`, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: e.target.value }),
                        });
                        const leadsData = await apiRequest('/crm/leads');
                        setLeads(leadsData || []);
                      } catch (err: any) {
                        alert(err.message || 'Error updating status');
                      }
                    }}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-border bg-background"
                  >
                    {['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'WON', 'LOST'].map(st => (
                      <option key={st} value={st}>{st.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {leads.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground italic border border-dashed border-border rounded-xl">
                No assigned leads found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* BUGS MANAGEMENT TAB */}
      {activeTab === 'bugs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel list */}
          <div className="lg:col-span-1 space-y-3">
            <span className="font-bold block text-xs text-muted-foreground uppercase tracking-wider mb-2">Assigned Bug Backlog</span>
            {bugs.map(bug => (
              <div
                key={bug.id}
                onClick={() => {
                  setSelectedBug(bug);
                  setBugEstFix(bug.estFix);
                  setBugRootCause(bug.rootCause);
                  setBugCommits(bug.commits);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col space-y-2 ${
                  selectedBug?.id === bug.id
                    ? 'border-red-500 bg-red-500/5 shadow-md shadow-red-500/5'
                    : 'border-border bg-card hover:border-red-500/25'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm truncate">{bug.title}</h4>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                    bug.priority === 'HIGH' ? 'text-red-500 border-red-500/25 bg-red-500/5' : 'text-slate-400 border-slate-500/25'
                  }`}>{bug.priority}</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Project: {bug.project}</span>
                  <span className="text-red-400 font-bold">{bug.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right details edit pane */}
          <div className="lg:col-span-2 space-y-6">
            {selectedBug ? (
              <div className="p-5 rounded-2xl border border-border bg-card space-y-5">
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div>
                    <h3 className="font-bold text-base text-red-500">{selectedBug.title}</h3>
                    <span className="text-xs text-muted-foreground">Project: {selectedBug.project}</span>
                  </div>
                  <select
                    value={selectedBug.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setBugs(p => p.map(b => b.id === selectedBug.id ? { ...b, status: newStatus } : b));
                      setSelectedBug((prev: any) => ({ ...prev, status: newStatus }));
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-secondary border border-border"
                  >
                    {['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'TESTING', 'RESOLVED', 'CLOSED'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Bug Details Form */}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setBugs(p => p.map(b => b.id === selectedBug.id ? {
                    ...b,
                    estFix: bugEstFix,
                    rootCause: bugRootCause,
                    commits: bugCommits
                  } : b));
                  alert('Bug details saved successfully.');
                }} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-muted-foreground uppercase mb-1.5">Estimated Fix Time</label>
                      <input
                        type="text"
                        value={bugEstFix}
                        onChange={e => setBugEstFix(e.target.value)}
                        placeholder="e.g. 2 hrs"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted-foreground uppercase mb-1.5">Link Commits</label>
                      <input
                        type="text"
                        value={bugCommits}
                        onChange={e => setBugCommits(e.target.value)}
                        placeholder="e.g. fix: patch JWT payload check"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-muted-foreground uppercase mb-1.5">Root Cause Analysis</label>
                    <textarea
                      value={bugRootCause}
                      onChange={e => setBugRootCause(e.target.value)}
                      placeholder="Identify why the bug occurred..."
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background h-16"
                    />
                  </div>

                  {/* Screenshots/Video uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-dashed border-border rounded-xl text-center space-y-2 bg-secondary/10">
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
                      <div>
                        <span className="font-bold block text-[10px]">Upload Screenshot</span>
                        <input type="file" className="hidden" id="bug-screenshot" onChange={() => alert('Screenshot attached')} />
                        <label htmlFor="bug-screenshot" className="text-[10px] text-blue-400 hover:underline cursor-pointer block mt-1">Select File</label>
                      </div>
                    </div>

                    <div className="p-4 border border-dashed border-border rounded-xl text-center space-y-2 bg-secondary/10">
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
                      <div>
                        <span className="font-bold block text-[10px]">Upload Video</span>
                        <input type="file" className="hidden" id="bug-video" onChange={() => alert('Video attached')} />
                        <label htmlFor="bug-video" className="text-[10px] text-blue-400 hover:underline cursor-pointer block mt-1">Select File</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button type="submit" className="px-5 py-2 bg-red-500 text-white font-semibold rounded-lg">Save Diagnostics</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card">
                <p className="text-sm text-muted-foreground">Select an active bug on the left panel to edit.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GIT AND CODE REVIEWS TAB */}
      {activeTab === 'repo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Provider selector and PR form */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">Connected Integration</h3>
              <div className="flex gap-2">
                {['github', 'gitlab', 'bitbucket'].map(prov => (
                  <button
                    key={prov}
                    onClick={() => setGitProvider(prov)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold border capitalize transition ${
                      gitProvider === prov 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background hover:bg-secondary text-muted-foreground'
                    }`}
                  >
                    {prov}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">Integrate Vexor OS with repo hooks for automatic CI/CD status matching.</p>
            </div>

            {/* Create PR Form */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Create Pull Request</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newPrTitle.trim()) return;
                setPullRequests(p => [
                  ...p,
                  { id: `pr${Date.now()}`, title: newPrTitle, branch: newPrBranch, status: 'READY_FOR_REVIEW', reviews: 0, commits: 3 }
                ]);
                setNewPrTitle('');
                setNewPrBranch('feature/');
                alert('Pull request raised and review notifications dispatched to PM.');
              }} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">PR Title</label>
                  <input
                    type="text"
                    value={newPrTitle}
                    onChange={e => setNewPrTitle(e.target.value)}
                    placeholder="e.g. feat: connect checkout widget to stripe"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Source Branch</label>
                  <input
                    type="text"
                    value={newPrBranch}
                    onChange={e => setNewPrBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg">Raise PR & Request Review</button>
              </form>
            </div>
          </div>

          {/* Active Pull Requests */}
          <div className="lg:col-span-2 space-y-4">
            <span className="font-bold block text-xs text-muted-foreground uppercase tracking-wider mb-2">Active Pull Requests</span>
            {pullRequests.map(pr => (
              <div key={pr.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-purple-400" />
                    <h4 className="font-bold text-sm">{pr.title}</h4>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground block">Branch: {pr.branch}</span>
                  <div className="flex gap-4 text-[10px] text-muted-foreground pt-1">
                    <span>Commits: {pr.commits}</span>
                    <span>Reviews: {pr.reviews} approved</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 border rounded ${
                    pr.status === 'MERGED' ? 'bg-green-500/10 text-green-500 border-green-500/25' : 'bg-purple-500/10 text-purple-500 border-purple-500/25'
                  }`}>{pr.status}</span>
                  {pr.status !== 'MERGED' && (
                    <button
                      onClick={() => {
                        setPullRequests(p => p.map(x => x.id === pr.id ? { ...x, status: 'MERGED' } : x));
                        alert('PR merged successfully into main branch.');
                      }}
                      className="px-2.5 py-1 bg-green-500 text-white text-[10px] font-bold rounded hover:opacity-90 transition"
                    >
                      Merge PR
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOCUMENTATION & GUIDELINES TAB */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'API Guidelines & Specifications', desc: 'Standard schema models, JWT token verification procedures, and payload validation requirements.', file: 'api-specs.pdf' },
            { title: 'Database & Prisma ORM Schema', desc: 'Standard data relationship structure, tables definitions, and index keys optimization strategies.', file: 'db-schema.md' },
            { title: 'UI & Figma Design Standards', desc: 'Common button layouts, color parameters, and viewport responsive grids for dashboards.', file: 'ui-design-guide.fig' },
            { title: 'Coding Standards & Linters', desc: 'Eslint configuration parameters, TypeScript type safety rules, and early return structure SOPs.', file: 'eslint.config.js' },
            { title: 'Project SOPs & Handover Docs', desc: 'Deployment procedures, staging checklist routines, and final release delivery timelines.', file: 'handover-sop.md' }
          ].map((doc, i) => (
            <div key={i} className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-4">
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-sm flex items-center gap-1.5"><FileText className="w-4 h-4 text-purple-400" /> {doc.title}</h4>
                <p className="text-muted-foreground leading-relaxed pt-1">{doc.desc}</p>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{doc.file}</span>
                <button
                  onClick={() => alert(`Opening document file: ${doc.file}. Developers cannot delete company documents.`)}
                  className="text-blue-400 font-bold hover:underline"
                >
                  Open File
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LEARNING CENTER TAB */}
      {activeTab === 'learning' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {[
            { title: 'TypeScript Advanced Best Practices', duration: '45 mins', author: 'Daniel Lee', video: 'ts-adv.mp4' },
            { title: 'NestJS Dependency Injection & Architecture', duration: '30 mins', author: 'Sarah Jenkins', video: 'nest-di.mp4' },
            { title: 'Prisma Relations & Indexes Optimization', duration: '50 mins', author: 'Elena Rostova', video: 'prisma-perf.mp4' }
          ].map((course, i) => (
            <div key={i} className="p-5 rounded-2xl border border-border bg-card space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center relative group cursor-pointer" onClick={() => alert(`Starting video course: ${course.video}`)}>
                  <Play className="w-8 h-8 text-white opacity-80 group-hover:opacity-100 transition" />
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[9px] bg-black/60 text-white rounded">{course.duration}</span>
                </div>
                <h4 className="font-bold text-sm pt-1">{course.title}</h4>
                <p className="text-[10px] text-muted-foreground">Instructor: {course.author}</p>
              </div>
              <button
                onClick={() => alert(`Course: ${course.title} marked in progress.`)}
                className="w-full py-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-lg text-xs"
              >
                Mark as Completed
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PERFORMANCE REPORTS TAB */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center text-xs">
            {[
              { label: 'Tasks Completed', value: '28', color: 'text-green-500' },
              { label: 'Bugs Fixed', value: '14', color: 'text-blue-500' },
              { label: 'Story Points Deliveries', value: '42 pts', color: 'text-purple-500' },
              { label: 'Code Review Score', value: '98%', color: 'text-yellow-500' }
            ].map((perf, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">{perf.label}</span>
                <h3 className={`text-2xl font-black ${perf.color}`}>{perf.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Efficiency metrics */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-4">
              <h4 className="font-bold text-sm">Velocity & Accuracy Metrics</h4>
              <div className="space-y-3.5 text-xs">
                {[
                  { label: 'Time Estimation Accuracy', value: 91 },
                  { label: 'Rework Percentage', value: 8 },
                  { label: 'On-time Delivery Rate', value: 95 }
                ].map((metric, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>{metric.label}</span>
                      <span className="font-bold">{metric.value}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${metric.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance view */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-4">
              <h4 className="font-bold text-sm">Clock-in History (Last 5 days)</h4>
              <div className="space-y-2 text-xs">
                {attendanceLogs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="flex justify-between items-center border-b border-border/40 pb-2 last:border-0 last:pb-0">
                    <div>
                      <span className="font-bold">{new Date(log.checkIn).toLocaleDateString()}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">In: {new Date(log.checkIn).toLocaleTimeString()}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                      log.status === 'LATE' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/25' : 'text-green-500 bg-green-500/10 border-green-500/25'
                    }`}>{log.status}</span>
                  </div>
                ))}
                {attendanceLogs.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No attendance check-ins recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TASK DRAWER/MODAL DETAIL */}
      {selectedTask && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-card border-l border-border p-6 shadow-2xl overflow-y-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold text-primary block mb-0.5">{selectedTask.projectName}</span>
                <h3 className="font-bold text-lg leading-snug">{selectedTask.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border font-bold bg-blue-500/10 border-blue-500/20 text-blue-400 uppercase">
                    {selectedTask.status}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${
                    selectedTask.priority === 'CRITICAL' || selectedTask.priority === 'HIGH' ? 'text-red-500 border-red-500/25 bg-red-500/5' : 'text-slate-400 border-slate-500/25'
                  }`}>
                    {selectedTask.priority}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-xs border border-border px-2 py-1 rounded hover:bg-secondary transition">
                Close
              </button>
            </div>

            {selectedTask.description && (
              <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border/40 leading-relaxed">
                {selectedTask.description}
              </p>
            )}

            {/* Workflow state buttons */}
            <div className="space-y-2 border border-border/80 p-4 rounded-xl">
              <span className="font-semibold block text-[10px] text-muted-foreground uppercase mb-1.5">Task Workflow State</span>
              <div className="flex flex-wrap gap-1.5">
                {['ASSIGNED', 'ACCEPTED', 'IN_DEVELOPMENT', 'READY_FOR_REVIEW', 'CHANGES_REQUESTED', 'TESTING', 'COMPLETED'].map(state => (
                  <button
                    key={state}
                    onClick={() => handleTaskStatusChange(selectedTask.id, state)}
                    className={`px-2 py-1 rounded text-[9px] font-bold border transition ${
                      selectedTask.status === state 
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                        : 'bg-background hover:bg-secondary text-muted-foreground'
                    }`}
                  >
                    {state.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload attachments */}
            <div className="space-y-2 border border-border/80 p-4 rounded-xl text-xs">
              <span className="font-semibold block text-[10px] text-muted-foreground uppercase mb-1.5">Attachments / Files</span>
              <div className="flex gap-2">
                <input type="file" id="task-attachment" className="hidden" onChange={() => alert('File attached to task')} />
                <label htmlFor="task-attachment" className="flex-1 py-2 border border-dashed border-border rounded-lg text-center cursor-pointer hover:bg-secondary/40">
                  Select file to upload
                </label>
                <button onClick={() => alert('Clarification requested from PM Elena Rostova.')} className="px-3 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-[10px] font-semibold">
                  Request Clarification
                </button>
              </div>
            </div>

            {/* Log Hours form */}
            <form onSubmit={handleLogTime} className="space-y-3 border border-border/80 p-4 rounded-xl">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Log Work Hours
              </h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={logHoursMin}
                    onChange={e => setLogHoursMin(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-border bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Description</label>
                  <input
                    type="text"
                    value={logHoursDesc}
                    onChange={e => setLogHoursDesc(e.target.value)}
                    placeholder="Work description"
                    className="w-full px-2.5 py-1.5 rounded border border-border bg-background"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg">
                Log Timesheet
              </button>
            </form>

            {/* Time logs */}
            {selectedTask.timeLogs && selectedTask.timeLogs.length > 0 && (
              <div className="space-y-2 text-xs">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Time Logs</h5>
                {selectedTask.timeLogs.map((tl: any) => (
                  <div key={tl.id} className="p-2.5 bg-secondary/40 rounded-lg border border-border/40 flex justify-between">
                    <span className="text-muted-foreground">{tl.description || 'Work logged'}</span>
                    <span className="font-bold">{tl.durationMin} mins</span>
                  </div>
                ))}
              </div>
            )}

            {/* Discussion Thread */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Discussion Thread
              </h5>
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {selectedTask.comments && selectedTask.comments.length > 0 ? (
                  selectedTask.comments.map((c: any) => (
                    <div key={c.id} className="p-3 bg-secondary/50 rounded-lg border border-border/40 text-xs">
                      <div className="flex justify-between items-center mb-1 text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{c.user?.firstName || 'User'}</span>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="leading-relaxed text-muted-foreground">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">No comments yet.</p>
                )}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="flex-1 text-xs px-2.5 py-2 rounded-lg border border-border bg-background"
                  placeholder="Post comments to workflow..."
                  required
                />
                <button type="submit" className="px-3 bg-primary text-primary-foreground text-xs font-medium rounded-lg">
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ✦ Antigravity IDE Tab */}
      {activeTab === 'ide' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span className="text-violet-400">✦</span> Antigravity IDE
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user?.role === 'DEVELOPER'
                  ? 'Full-stack code editor — edit files, run commands, resolve code reviews.'
                  : 'Review Mode — inspect source code, leave line-level comments, track review status.'}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold ${user?.role === 'DEVELOPER' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
              {user?.role === 'DEVELOPER' ? '✎ Edit Mode' : '👁 Review Mode'}
            </div>
          </div>
          <AntigravityIDE userRole={user?.role || 'DEVELOPER'} />
        </div>
      )}
    </div>
  );
}
