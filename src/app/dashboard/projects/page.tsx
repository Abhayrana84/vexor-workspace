'use client';

import { useEffect, useState } from 'react';
import { apiRequest, getStoredUser } from '../../../lib/api';
import DeveloperDashboard from '../DeveloperDashboard';
import ClientDashboard from '../ClientDashboard';
import {
  Plus, CheckSquare, MessageSquare, Clock, Calendar, ShieldAlert,
  LayoutDashboard, KanbanSquare, Zap, BarChart2, AlertTriangle,
  DollarSign, Users, GitPullRequest, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Circle, Flag, Target, Activity, FileText, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

const PM_TASK_STATUSES = ['BACKLOG','TODO','IN_PROGRESS','CODE_REVIEW','TESTING','CLIENT_REVIEW','DONE'];

function mapStatus(status: string) {
  const map: Record<string,string> = {
    REVIEW:'CODE_REVIEW', DONE:'DONE', IN_PROGRESS:'IN_PROGRESS', TODO:'TODO',
    BACKLOG:'BACKLOG', CODE_REVIEW:'CODE_REVIEW', TESTING:'TESTING', CLIENT_REVIEW:'CLIENT_REVIEW'
  };
  return map[status] || 'BACKLOG';
}

const STATUS_META: Record<string,{label:string;color:string;bg:string}> = {
  BACKLOG:       {label:'Backlog',       color:'text-slate-400',  bg:'bg-slate-500/10 border-slate-500/20'},
  TODO:          {label:'To Do',         color:'text-blue-400',   bg:'bg-blue-500/10 border-blue-500/20'},
  IN_PROGRESS:   {label:'In Progress',   color:'text-yellow-400', bg:'bg-yellow-500/10 border-yellow-500/20'},
  CODE_REVIEW:   {label:'Code Review',   color:'text-purple-400', bg:'bg-purple-500/10 border-purple-500/20'},
  TESTING:       {label:'Testing',       color:'text-orange-400', bg:'bg-orange-500/10 border-orange-500/20'},
  CLIENT_REVIEW: {label:'Client Review', color:'text-pink-400',   bg:'bg-pink-500/10 border-pink-500/20'},
  DONE:          {label:'Done',          color:'text-green-400',  bg:'bg-green-500/10 border-green-500/20'},
};

const PRIORITY_META: Record<string,{color:string}> = {
  LOW:      {color:'text-slate-400 bg-slate-500/10 border-slate-500/20'},
  MEDIUM:   {color:'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'},
  HIGH:     {color:'text-orange-500 bg-orange-500/10 border-orange-500/20'},
  CRITICAL: {color:'text-red-500 bg-red-500/10 border-red-500/20'},
};

const RISK_LEVELS = ['LOW','MEDIUM','HIGH','CRITICAL'];
const RISK_TYPES  = ['Technical','Budget','Schedule','Resource','Client','Dependency'];

export default function Projects() {
  const [user, setUser]                   = useState<any>(null);
  const [projects, setProjects]           = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('dashboard');

  const [showProjModal, setShowProjModal] = useState(false);
  const [projName,   setProjName]         = useState('');
  const [projDesc,   setProjDesc]         = useState('');
  const [projBudget, setProjBudget]       = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle,    setTaskTitle]      = useState('');
  const [taskDesc,     setTaskDesc]       = useState('');
  const [taskPriority, setTaskPriority]   = useState('MEDIUM');
  const [taskStatus,   setTaskStatus]     = useState('BACKLOG');

  const [activeTask,      setActiveTask]      = useState<any>(null);
  const [logDuration,     setLogDuration]     = useState(60);
  const [logDesc,         setLogDesc]         = useState('');
  const [commentContent,  setCommentContent]  = useState('');

  const [showMilestone, setShowMilestone] = useState(false);
  const [milTitle, setMilTitle]           = useState('');
  const [milDate,  setMilDate]            = useState('');

  const [sprints, setSprints] = useState([
    {id:'s1',name:'Sprint 1 - Foundation',  start:'2026-06-01',end:'2026-06-14',status:'COMPLETED',velocity:34,planned:38},
    {id:'s2',name:'Sprint 2 - Auth & Core', start:'2026-06-15',end:'2026-06-28',status:'COMPLETED',velocity:41,planned:40},
    {id:'s3',name:'Sprint 3 - Dashboard',   start:'2026-06-29',end:'2026-07-12',status:'ACTIVE',   velocity:28,planned:42},
    {id:'s4',name:'Sprint 4 - Beta Release',start:'2026-07-13',end:'2026-07-26',status:'PLANNED',  velocity:0, planned:45},
  ]);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [sprintName,  setSprintName]  = useState('');
  const [sprintStart, setSprintStart] = useState('');
  const [sprintEnd,   setSprintEnd]   = useState('');

  const burndownData = [
    {day:'D1',remaining:42,ideal:42},{day:'D2',remaining:40,ideal:39},{day:'D3',remaining:38,ideal:36},
    {day:'D4',remaining:35,ideal:33},{day:'D5',remaining:32,ideal:30},{day:'D6',remaining:30,ideal:27},
    {day:'D7',remaining:29,ideal:24},{day:'D8',remaining:28,ideal:21},{day:'D9',remaining:28,ideal:18},
    {day:'D10',remaining:27,ideal:15},
  ];

  const [risks, setRisks] = useState([
    {id:'r1',title:'Third-party API SLA delays',     type:'Dependency',level:'HIGH',  owner:'Elena Rostova',mitigation:'Identify backup provider.',status:'OPEN'},
    {id:'r2',title:'Developer unavailability in Q3', type:'Resource',  level:'MEDIUM',owner:'Sarah Jenkins', mitigation:'Pre-hire a contractor.',   status:'MITIGATED'},
    {id:'r3',title:'Budget overrun on cloud hosting',type:'Budget',    level:'LOW',   owner:'Alex Vexor',   mitigation:'Reserve 15% contingency.', status:'MONITORING'},
  ]);
  const [showRiskModal,  setShowRiskModal]  = useState(false);
  const [riskTitle,      setRiskTitle]      = useState('');
  const [riskType,       setRiskType]       = useState('Technical');
  const [riskLevel,      setRiskLevel]      = useState('MEDIUM');
  const [riskOwner,      setRiskOwner]      = useState('');
  const [riskMitigation, setRiskMitigation] = useState('');

  const [changeRequests, setChangeRequests] = useState([
    {id:'cr1',title:'Add Multi-language Support',        requestedBy:'Robert Chen', impact:'High - +3 weeks, +INR 150000', status:'PENDING',     date:'2026-07-01'},
    {id:'cr2',title:'Integrate WhatsApp Notifications',  requestedBy:'Hank Scorpio',impact:'Medium - +1 week, +INR 50000', status:'APPROVED',    date:'2026-06-28'},
    {id:'cr3',title:'Dark Mode for Client Portal',       requestedBy:'Robert Chen', impact:'Low - +2 days, no cost change',status:'IMPLEMENTED', date:'2026-06-20'},
  ]);
  const [showCRModal,   setShowCRModal]   = useState(false);
  const [crTitle,       setCRTitle]       = useState('');
  const [crRequestedBy, setCRRequestedBy] = useState('');
  const [crImpact,      setCRImpact]      = useState('');

  const resources = [
    {name:'Daniel Lee',    role:'Senior Developer',allocation:80,tasks:3,available:20},
    {name:'Elena Rostova', role:'Project Manager', allocation:60,tasks:2,available:40},
    {name:'Aisha Patel',   role:'QA Engineer',     allocation:40,tasks:1,available:60},
    {name:'Kai Tanaka',    role:'UI Designer',     allocation:30,tasks:1,available:70},
  ];

  const loadProjects = async (selectId?: string) => {
    try {
      const data = await apiRequest('/projects');
      setProjects(data);
      if (data.length > 0) {
        const next = selectId
          ? data.find((p:any) => p.id === selectId)
          : selectedProject
          ? data.find((p:any) => p.id === selectedProject.id)
          : data[0];
        setSelectedProject(next || data[0]);
      }
    } catch(e:any) { console.error(e.message); } finally { setLoading(false); }
  };

  useEffect(() => {
    const activeUser = getStoredUser();
    setUser(activeUser);
    if (activeUser && activeUser.role !== 'DEVELOPER' && activeUser.role !== 'CLIENT') {
      loadProjects();
    } else {
      setLoading(false);
    }
  }, []);

  const pm = user && ['PROJECT_MANAGER','FOUNDER','CO_FOUNDER','ADMIN'].includes(user.role);

  if (user && user.role === 'DEVELOPER') {
    return <DeveloperDashboard defaultTab="projects" />;
  }

  if (user && user.role === 'CLIENT') {
    return <ClientDashboard defaultTab="projects" />;
  }

  const handleCreateProject = async (e:React.FormEvent) => {
    e.preventDefault();
    try {
      const p = await apiRequest('/projects',{method:'POST',body:JSON.stringify({name:projName,description:projDesc,budget:parseFloat(projBudget)||null})});
      setShowProjModal(false); setProjName(''); setProjDesc(''); setProjBudget('');
      loadProjects(p.id);
    } catch(err:any) { alert(err.message); }
  };

  const handleCreateTask = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await apiRequest(`/projects/${selectedProject.id}/tasks`,{method:'POST',body:JSON.stringify({title:taskTitle,description:taskDesc,priority:taskPriority})});
      setShowTaskModal(false); setTaskTitle(''); setTaskDesc(''); setTaskPriority('MEDIUM'); setTaskStatus('BACKLOG');
      loadProjects();
    } catch(err:any) { alert(err.message); }
  };

  const handleMoveTask = async (taskId:string, status:string) => {
    try { await apiRequest(`/projects/tasks/${taskId}/status`,{method:'PATCH',body:JSON.stringify({status})}); loadProjects(); }
    catch(err:any) { alert(err.message); }
  };

  const handleLogTime = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;
    try {
      await apiRequest(`/projects/tasks/${activeTask.id}/timelog`,{method:'POST',body:JSON.stringify({durationMin:logDuration,description:logDesc})});
      setLogDuration(60); setLogDesc(''); setActiveTask(null); loadProjects();
    } catch(err:any) { alert(err.message); }
  };

  const handleAddComment = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !commentContent.trim()) return;
    try {
      const c = await apiRequest(`/projects/tasks/${activeTask.id}/comments`,{method:'POST',body:JSON.stringify({content:commentContent})});
      setActiveTask((prev:any) => ({...prev, comments:[...(prev.comments||[]),c]}));
      setCommentContent(''); loadProjects();
    } catch(err:any) { alert(err.message); }
  };

  const handleAddMilestone = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await apiRequest(`/projects/${selectedProject.id}/milestones`,{method:'POST',body:JSON.stringify({title:milTitle,dueDate:milDate})});
      setMilTitle(''); setMilDate(''); setShowMilestone(false); loadProjects();
    } catch(err:any) { alert(err.message); }
  };

  const handleAddRisk = (e:React.FormEvent) => {
    e.preventDefault();
    setRisks(prev => [...prev, {id:`r${Date.now()}`,title:riskTitle,type:riskType,level:riskLevel,owner:riskOwner,mitigation:riskMitigation,status:'OPEN'}]);
    setRiskTitle(''); setRiskType('Technical'); setRiskLevel('MEDIUM'); setRiskOwner(''); setRiskMitigation('');
    setShowRiskModal(false); alert('Risk logged and owner notified.');
  };

  const handleAddCR = (e:React.FormEvent) => {
    e.preventDefault();
    setChangeRequests(prev => [...prev, {id:`cr${Date.now()}`,title:crTitle,requestedBy:crRequestedBy,impact:crImpact,status:'PENDING',date:new Date().toISOString().slice(0,10)}]);
    setCRTitle(''); setCRRequestedBy(''); setCRImpact(''); setShowCRModal(false);
    alert('Change request submitted for approval.');
  };

  const handleAddSprint = (e:React.FormEvent) => {
    e.preventDefault();
    setSprints(prev => [...prev, {id:`s${Date.now()}`,name:sprintName,start:sprintStart,end:sprintEnd,status:'PLANNED',velocity:0,planned:0}]);
    setSprintName(''); setSprintStart(''); setSprintEnd(''); setShowSprintModal(false);
  };

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>;

  const tasks               = selectedProject?.tasks || [];
  const doneTasks           = tasks.filter((t:any) => t.status==='DONE').length;
  const inProgressTasks     = tasks.filter((t:any) => t.status==='IN_PROGRESS').length;
  const overdueTasks        = tasks.filter((t:any) => t.dueDate && new Date(t.dueDate)<new Date() && t.status!=='DONE').length;
  const milestones          = selectedProject?.milestones || [];
  const completedMilestones = milestones.filter((m:any) => m.isCompleted).length;
  const budgetTotal         = selectedProject?.budget || 0;
  const budgetUsed          = Math.round(budgetTotal * 0.48);
  const budgetRemaining     = budgetTotal - budgetUsed;

  const TABS = [
    {id:'dashboard', label:'PM Dashboard',        icon:LayoutDashboard},
    {id:'kanban',    label:'Kanban Board',         icon:KanbanSquare},
    {id:'sprint',    label:'Sprint Manager',       icon:Zap},
    {id:'timeline',  label:'Timeline & Milestones',icon:BarChart2},
    {id:'risks',     label:'Risk Register',        icon:AlertTriangle},
    {id:'budget',    label:'Budget Monitor',       icon:DollarSign},
    {id:'resources', label:'Resource Planner',     icon:Users},
    {id:'changes',   label:'Change Requests',      icon:GitPullRequest},
  ];

  const velocityData = sprints.filter(s => s.status!=='PLANNED').map(s => ({sprint:s.name.split('-')[0].trim(),Velocity:s.velocity,Planned:s.planned}));
  const taskDistData = PM_TASK_STATUSES.map(s => ({name:STATUS_META[s]?.label||s,value:tasks.filter((t:any)=>mapStatus(t.status)===s).length}));
  const PIE_COLORS   = ['#64748b','#3b82f6','#eab308','#a855f7','#f97316','#ec4899','#22c55e'];
  const riskColor:Record<string,string> = {
    LOW:'text-green-400 bg-green-500/10 border-green-500/20',
    MEDIUM:'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    HIGH:'text-orange-400 bg-orange-500/10 border-orange-500/20',
    CRITICAL:'text-red-500 bg-red-500/10 border-red-500/20',
  };
  const crStatusColor:Record<string,string> = {
    PENDING:'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    APPROVED:'text-green-400 bg-green-500/10 border-green-500/20',
    REJECTED:'text-red-400 bg-red-500/10 border-red-500/20',
    IMPLEMENTED:'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">{pm ? 'Project Management Center' : 'Project Board'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{pm ? 'Full lifecycle delivery: sprints, risks, budgets, resources, change requests.' : 'Collaborate on deliverables, checklists, timesheets, and milestones.'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={selectedProject?.id||''} onChange={e=>{const p=projects.find(x=>x.id===e.target.value);setSelectedProject(p);}} className="text-xs px-3 py-2.5 rounded-lg border border-border bg-card font-medium">
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {pm && <button onClick={()=>setShowProjModal(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition"><Plus className="w-4 h-4"/> New Project</button>}
        </div>
      </div>

      {pm && (
        <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
          {TABS.map(tab=>{const Icon=tab.icon;return(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab===tab.id?'bg-primary text-primary-foreground shadow-md':'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
              <Icon className="w-3.5 h-3.5"/>{tab.label}
            </button>
          );})}
        </div>
      )}

      {selectedProject ? (
        <div className="space-y-6">

          {(activeTab==='dashboard'||!pm) && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {label:'Project Health',  value:`${selectedProject.healthScore}%`,          icon:Activity,     color:'text-green-400', sub:'Overall score'},
                  {label:'Tasks Complete',  value:`${doneTasks}/${tasks.length}`,              icon:CheckCircle,  color:'text-blue-400',  sub:`${inProgressTasks} in progress`},
                  {label:'Milestones',      value:`${completedMilestones}/${milestones.length}`,icon:Flag,        color:'text-purple-400',sub:`${milestones.length-completedMilestones} remaining`},
                  {label:'Overdue Tasks',   value:overdueTasks,                                icon:AlertTriangle,color:overdueTasks>0?'text-red-400':'text-green-400',sub:overdueTasks>0?'Needs attention':'All on track'},
                  {label:'Budget Used',     value:`INR ${budgetUsed.toLocaleString()}`,        icon:DollarSign,   color:'text-orange-400',sub:`of INR ${budgetTotal.toLocaleString()}`},
                  {label:'Open Risks',      value:risks.filter(r=>r.status==='OPEN').length,   icon:ShieldAlert,  color:'text-yellow-400',sub:`${risks.filter(r=>r.level==='HIGH'||r.level==='CRITICAL').length} high priority`},
                  {label:'Pending Changes', value:changeRequests.filter(c=>c.status==='PENDING').length,icon:GitPullRequest,color:'text-pink-400',sub:'Awaiting approval'},
                  {label:'Sprint Velocity', value:'28 pts',                                    icon:Zap,          color:'text-cyan-400',  sub:'Current sprint'},
                ].map(kpi=>{const Icon=kpi.icon;return(
                  <div key={kpi.label} className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{kpi.label}</span><Icon className={`w-4 h-4 ${kpi.color}`}/></div>
                    <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-[10px] text-muted-foreground">{kpi.sub}</div>
                  </div>
                );})}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border border-border bg-card">
                  <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-blue-400"/> Task Distribution</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart><Pie data={taskDistData.filter(d=>d.value>0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                      {taskDistData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Pie><Tooltip/></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card">
                  <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400"/> Sprint Velocity</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={velocityData} barSize={14}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/><XAxis dataKey="sprint" tick={{fontSize:9}}/><YAxis tick={{fontSize:9}}/><Tooltip/><Bar dataKey="Planned" fill="#475569" radius={[4,4,0,0]}/><Bar dataKey="Velocity" fill="#3b82f6" radius={[4,4,0,0]}/></BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div><span className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Status</span><span className="font-bold text-blue-400 uppercase">{selectedProject.status}</span></div>
                <div><span className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Start</span><span className="font-semibold">{selectedProject.startDate?new Date(selectedProject.startDate).toLocaleDateString():'N/A'}</span></div>
                <div><span className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">End</span><span className="font-semibold">{selectedProject.endDate?new Date(selectedProject.endDate).toLocaleDateString():'N/A'}</span></div>
                <div><span className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Budget</span><span className="font-semibold">{selectedProject.budget?`INR ${selectedProject.budget.toLocaleString()}`:'Not set'}</span></div>
              </div>
              {pm && (<div className="p-5 rounded-xl border border-border bg-card space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400"/> Today's Action Items</h4>
                {[
                  {icon:CheckSquare,  text:'Review Pull Request: JWT Auth Middleware',   status:'PENDING',  col:'yellow'},
                  {icon:MessageSquare,text:'Send Client Status Update to Acme Corp',    status:'PENDING',  col:'yellow'},
                  {icon:Calendar,     text:'Sprint 3 Retrospective at 3:00 PM',         status:'SCHEDULED',col:'blue'},
                  {icon:ShieldAlert,  text:'Escalate API SLA risk to Co-Founder',       status:'OVERDUE',  col:'red'},
                ].map((item,i)=>{const Icon=item.icon;const bg=item.col==='yellow'?'bg-yellow-500/10 border-yellow-500/20 text-yellow-400':item.col==='blue'?'bg-blue-500/10 border-blue-500/20 text-blue-400':'bg-red-500/10 border-red-500/20 text-red-400';return(
                  <div key={i} className="flex items-center justify-between text-xs border-b border-border/40 pb-2 last:border-0">
                    <div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-muted-foreground"/><span>{item.text}</span></div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${bg}`}>{item.status}</span>
                  </div>
                );})}
              </div>)}
            </div>
          )}

          {activeTab==='kanban' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2"><KanbanSquare className="w-5 h-5 text-blue-400"/> Task Pipeline</h3>
                {pm && <button onClick={()=>setShowTaskModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition"><Plus className="w-3.5 h-3.5"/> Add Task</button>}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {PM_TASK_STATUSES.map(status=>{
                  const meta=STATUS_META[status];
                  const statusTasks=tasks.filter((t:any)=>mapStatus(t.status)===status);
                  return(
                    <div key={status} className="min-w-[190px] max-w-[205px] flex-shrink-0 p-3 rounded-xl border border-border bg-card/40 flex flex-col space-y-3 min-h-[280px]">
                      <div className="flex justify-between items-center border-b border-border/60 pb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${meta.bg} ${meta.color}`}>{statusTasks.length}</span>
                      </div>
                      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[420px]">
                        {statusTasks.map((task:any)=>{const pm2=PRIORITY_META[task.priority]||PRIORITY_META.MEDIUM;return(
                          <div key={task.id} onClick={()=>setActiveTask(task)} className="p-3 rounded-lg border border-border bg-card hover:border-primary/30 shadow-sm cursor-pointer transition space-y-2">
                            <h4 className="font-semibold text-xs leading-snug">{task.title}</h4>
                            <div className="flex justify-between items-center gap-1">
                              <span className={`px-1 py-0.5 rounded text-[8px] font-bold border ${pm2.color}`}>{task.priority}</span>
                              <select value={mapStatus(task.status)} onClick={e=>e.stopPropagation()} onChange={e=>handleMoveTask(task.id,e.target.value)} className="text-[8px] px-1 py-0.5 bg-secondary border border-border rounded">
                                {PM_TASK_STATUSES.map(s=><option key={s} value={s}>{STATUS_META[s].label}</option>)}
                              </select>
                            </div>
                            {task.dueDate&&<div className="text-[9px] text-muted-foreground flex items-center gap-1"><Calendar className="w-2.5 h-2.5"/>{new Date(task.dueDate).toLocaleDateString()}</div>}
                          </div>
                        );})}
                        {statusTasks.length===0&&<p className="text-[10px] text-muted-foreground italic text-center pt-4">No tasks</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab==='sprint' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400"/> Sprint Management</h3>
                {pm && <button onClick={()=>setShowSprintModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition"><Plus className="w-3.5 h-3.5"/> Plan Sprint</button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sprints.map(sprint=>{
                  const sc:Record<string,string>={COMPLETED:'text-green-400 bg-green-500/10 border-green-500/20',ACTIVE:'text-blue-400 bg-blue-500/10 border-blue-500/20',PLANNED:'text-slate-400 bg-slate-500/10 border-slate-500/20'};
                  const pct=sprint.planned>0?Math.round((sprint.velocity/sprint.planned)*100):0;
                  return(
                    <div key={sprint.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <div className="flex justify-between items-start">
                        <div><h4 className="font-bold text-sm">{sprint.name}</h4><p className="text-[10px] text-muted-foreground">{sprint.start} to {sprint.end}</p></div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${sc[sprint.status]}`}>{sprint.status}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Velocity</span><span className="font-bold">{sprint.velocity} / {sprint.planned} pts</span></div>
                        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width:`${Math.min(pct,100)}%`}}/></div>
                        <div className="text-[10px] text-muted-foreground text-right">{pct}% complete</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-5 rounded-xl border border-border bg-card">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-400"/> Sprint 3 Burndown Chart</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={burndownData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/><XAxis dataKey="day" tick={{fontSize:9}}/><YAxis tick={{fontSize:9}}/><Tooltip/><Line type="monotone" dataKey="ideal" stroke="#64748b" strokeDasharray="5 5" dot={false} name="Ideal"/><Line type="monotone" dataKey="remaining" stroke="#3b82f6" strokeWidth={2} dot={{r:3}} name="Remaining"/></LineChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <h4 className="font-bold text-xs text-blue-400 mb-2 flex items-center gap-2"><Target className="w-3.5 h-3.5"/> Sprint 3 Goal</h4>
                <p className="text-xs text-muted-foreground">Complete core dashboard UI, integrate JWT authentication end-to-end, and achieve 80% test coverage on the API layer by July 12.</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                {[{label:'Avg Velocity',value:'34.5 pts',icon:TrendingUp,color:'text-green-400'},{label:'Completion Rate',value:'78%',icon:CheckCircle,color:'text-blue-400'},{label:'Defect Rate',value:'4.2%',icon:XCircle,color:'text-red-400'}].map(m=>{const Icon=m.icon;return(
                  <div key={m.label} className="p-3 rounded-lg border border-border bg-card text-center"><Icon className={`w-5 h-5 mx-auto mb-1 ${m.color}`}/><div className={`text-lg font-black ${m.color}`}>{m.value}</div><div className="text-[10px] text-muted-foreground">{m.label}</div></div>
                );})}
              </div>
            </div>
          )}

          {activeTab==='timeline' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2"><BarChart2 className="w-5 h-5 text-purple-400"/> Timeline and Milestones</h3>
                {pm && <button onClick={()=>setShowMilestone(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition"><Plus className="w-3.5 h-3.5"/> Add Milestone</button>}
              </div>
              <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                <h4 className="font-bold text-sm mb-2">Gantt Overview</h4>
                {[
                  {phase:'Requirements and Kickoff',  start:5, width:12,color:'bg-slate-500'},
                  {phase:'Architecture and Planning',  start:14,width:10,color:'bg-blue-500'},
                  {phase:'Sprint 1 Foundation',         start:22,width:14,color:'bg-purple-500'},
                  {phase:'Sprint 2 Auth and Core',      start:34,width:14,color:'bg-yellow-500'},
                  {phase:'Sprint 3 Dashboard',          start:46,width:14,color:'bg-orange-500'},
                  {phase:'Sprint 4 Beta Release',       start:58,width:14,color:'bg-pink-500'},
                  {phase:'UAT and Client Review',       start:70,width:12,color:'bg-teal-500'},
                  {phase:'Final Delivery',              start:80,width:10,color:'bg-green-500'},
                ].map(row=>(
                  <div key={row.phase} className="flex items-center gap-3 text-xs">
                    <span className="w-44 text-muted-foreground font-medium truncate">{row.phase}</span>
                    <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden relative">
                      <div className={`absolute h-full rounded-full ${row.color} opacity-80`} style={{left:`${row.start}%`,width:`${row.width}%`}}/>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-[9px] text-muted-foreground pt-1">{['Jun 2026','Jul 2026','Aug 2026','Sep 2026','Oct 2026','Nov 2026','Dec 2026'].map(m=><span key={m}>{m}</span>)}</div>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2"><Flag className="w-4 h-4 text-yellow-400"/> Milestone Tracker</h4>
                {milestones.length>0?milestones.map((m:any)=>(
                  <div key={m.id} className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg border border-border/40">
                    <div className="flex items-center gap-2">{m.isCompleted?<CheckCircle className="w-4 h-4 text-green-400"/>:<Circle className="w-4 h-4 text-muted-foreground"/>}<span className={`text-xs font-medium ${m.isCompleted?'line-through text-muted-foreground':''}`}>{m.title}</span></div>
                    <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground">{new Date(m.dueDate).toLocaleDateString()}</span><span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${m.isCompleted?'bg-green-500/10 border-green-500/20 text-green-400':'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>{m.isCompleted?'DONE':'PENDING'}</span></div>
                  </div>
                )):<p className="text-xs text-muted-foreground italic">No milestones yet. Click Add Milestone to define project checkpoints.</p>}
              </div>
              <div className="p-5 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-blue-400"/> Deliverables</h4>
                {[{item:'Project Charter',done:true},{item:'Architecture Blueprint',done:true},{item:'UI/UX Wireframes',done:true},{item:'API Documentation',done:false},{item:'Beta Build v0.9',done:false},{item:'UAT Test Report',done:false},{item:'Deployment Runbook',done:false},{item:'Client Handover Package',done:false}].map((d,i)=>(
                  <div key={i} className="flex items-center gap-2 text-xs">{d.done?<CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0"/>:<Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0"/>}<span className={d.done?'line-through text-muted-foreground':''}>{d.item}</span></div>
                ))}
              </div>
            </div>
          )}

          {activeTab==='risks' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400"/> Risk Register</h3>
                {pm && <button onClick={()=>setShowRiskModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition"><Plus className="w-3.5 h-3.5"/> Log Risk</button>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['OPEN','MITIGATED','MONITORING','CLOSED'].map(s=>(
                  <div key={s} className="p-4 rounded-xl border border-border bg-card text-center">
                    <div className="text-2xl font-black">{risks.filter(r=>r.status===s).length}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase mt-1">{s}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border bg-secondary/30">{['Risk','Type','Level','Owner','Mitigation','Status'].map(h=><th key={h} className="text-left p-3 font-bold text-muted-foreground uppercase text-[10px]">{h}</th>)}</tr></thead>
                  <tbody>{risks.map(r=>(
                    <tr key={r.id} className="border-b border-border/40 hover:bg-secondary/10 transition">
                      <td className="p-3 font-semibold">{r.title}</td>
                      <td className="p-3 text-muted-foreground">{r.type}</td>
                      <td className="p-3"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${riskColor[r.level]}`}>{r.level}</span></td>
                      <td className="p-3 text-muted-foreground">{r.owner}</td>
                      <td className="p-3 text-muted-foreground max-w-[160px] truncate">{r.mitigation}</td>
                      <td className="p-3"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${r.status==='OPEN'?'text-red-400 bg-red-500/10 border-red-500/20':r.status==='MITIGATED'?'text-green-400 bg-green-500/10 border-green-500/20':'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'}`}>{r.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab==='budget' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400"/> Budget Monitor</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[{label:'Total Budget',value:`INR ${budgetTotal.toLocaleString()}`,icon:DollarSign,color:'text-blue-400',sub:'Allocated'},{label:'Amount Utilized',value:`INR ${budgetUsed.toLocaleString()}`,icon:TrendingDown,color:'text-orange-400',sub:'48% consumed'},{label:'Remaining',value:`INR ${budgetRemaining.toLocaleString()}`,icon:TrendingUp,color:'text-green-400',sub:'52% available'}].map(item=>{const Icon=item.icon;return(
                  <div key={item.label} className="p-5 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span><Icon className={`w-5 h-5 ${item.color}`}/></div>
                    <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{item.sub}</div>
                  </div>
                );})}
              </div>
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h4 className="font-bold text-sm">Budget Utilization</h4>
                <div className="w-full h-4 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-orange-400 rounded-full" style={{width:'48%'}}/></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {[{label:'Development',amount:42000,pct:35},{label:'Design',amount:18000,pct:15},{label:'QA Testing',amount:24000,pct:20},{label:'Infrastructure',amount:15000,pct:12.5}].map(item=>(
                    <div key={item.label} className="p-3 bg-secondary/40 rounded-lg border border-border/40">
                      <div className="font-semibold">{item.label}</div><div className="text-muted-foreground">INR {item.amount.toLocaleString()}</div>
                      <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-blue-500" style={{width:`${item.pct}%`}}/></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card">
                <h4 className="font-bold text-sm mb-3">Budget Variance</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[{c:'Dev',p:50000,a:42000},{c:'Design',p:20000,a:18000},{c:'QA',p:30000,a:24000},{c:'Infra',p:20000,a:15000}]} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/><XAxis dataKey="c" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/>
                    <Tooltip formatter={(v:any)=>`INR ${v.toLocaleString()}`}/>
                    <Bar dataKey="p" fill="#475569" radius={[4,4,0,0]} name="Planned"/><Bar dataKey="a" fill="#3b82f6" radius={[4,4,0,0]} name="Actual"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab==='resources' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400"/> Resource Planner</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map(res=>(
                  <div key={res.name} className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex justify-between items-start">
                      <div><h4 className="font-bold text-sm">{res.name}</h4><p className="text-[10px] text-muted-foreground">{res.role}</p></div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">{res.tasks} tasks</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Allocation</span><span className={`font-bold ${res.allocation>75?'text-red-400':res.allocation>50?'text-yellow-400':'text-green-400'}`}>{res.allocation}%</span></div>
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden"><div className={`h-full rounded-full ${res.allocation>75?'bg-red-500':res.allocation>50?'bg-yellow-500':'bg-green-500'}`} style={{width:`${res.allocation}%`}}/></div>
                      <div className="flex justify-between text-[10px] text-muted-foreground"><span>Available: {res.available}%</span>{res.allocation>75&&<span className="text-red-400 font-bold">Overloaded</span>}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 rounded-xl border border-border bg-card">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400"/> Team Availability This Week</h4>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border">{['Member','Mon','Tue','Wed','Thu','Fri'].map(d=><th key={d} className="text-center p-2 text-muted-foreground font-bold text-[10px] uppercase first:text-left">{d}</th>)}</tr></thead>
                  <tbody>{[{name:'Daniel Lee',days:['ok','ok','ok','ok','ok']},{name:'Aisha Patel',days:['ok','ok','off','ok','ok']},{name:'Kai Tanaka',days:['ok','ok','ok','off','ok']},{name:'Elena Rostova',days:['ok','ok','ok','ok','off']}].map(row=>(
                    <tr key={row.name} className="border-b border-border/40">
                      <td className="p-2 font-semibold">{row.name}</td>
                      {row.days.map((d,i)=><td key={i} className={`p-2 text-center text-xs font-bold ${d==='ok'?'text-green-400':'text-red-400'}`}>{d==='ok'?'Available':'Leave'}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[{label:'Team Utilization',value:'72%',color:'text-blue-400'},{label:'Avg Task Time',value:'3.2 days',color:'text-yellow-400'},{label:'Overloaded',value:'1',color:'text-red-400'}].map(m=>(
                  <div key={m.label} className="p-4 rounded-xl border border-border bg-card text-center"><div className={`text-2xl font-black ${m.color}`}>{m.value}</div><div className="text-[10px] text-muted-foreground mt-1">{m.label}</div></div>
                ))}
              </div>
            </div>
          )}

          {activeTab==='changes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2"><GitPullRequest className="w-5 h-5 text-pink-400"/> Change Requests</h3>
                {pm && <button onClick={()=>setShowCRModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition"><Plus className="w-3.5 h-3.5"/> New CR</button>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-4 rounded-xl border border-border bg-card flex-wrap">
                {['Change Requested','Impact Analysis','Cost and Timeline','Approval','Implementation','Delivery'].map((s,i,a)=>(
                  <span key={s} className="flex items-center gap-1"><span className="px-2 py-1 rounded bg-secondary border border-border font-medium text-foreground">{s}</span>{i<a.length-1&&<ArrowRight className="w-3 h-3"/>}</span>
                ))}
              </div>
              <div className="space-y-3">
                {changeRequests.map(cr=>(
                  <div key={cr.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <div><h4 className="font-bold text-sm">{cr.title}</h4><p className="text-[10px] text-muted-foreground">By {cr.requestedBy} on {cr.date}</p></div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${crStatusColor[cr.status]}`}>{cr.status}</span>
                        {cr.status==='PENDING'&&(
                          <div className="flex gap-1">
                            <button onClick={()=>setChangeRequests(p=>p.map(c=>c.id===cr.id?{...c,status:'APPROVED'}:c))} className="text-[9px] px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-bold hover:bg-green-500/20 transition">Approve</button>
                            <button onClick={()=>setChangeRequests(p=>p.map(c=>c.id===cr.id?{...c,status:'REJECTED'}:c))} className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold hover:bg-red-500/20 transition">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><AlertTriangle className="w-3 h-3 text-yellow-400"/><span>Impact: {cr.impact}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">Create your first project above to start collaborating.</p>
        </div>
      )}

      {showProjModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-2xl"><h3 className="text-xl font-bold mb-6">Create New Project</h3><form onSubmit={handleCreateProject} className="space-y-4 text-sm"><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Project Name</label><input type="text" value={projName} onChange={e=>setProjName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" placeholder="e.g. Globex CRM Migration" required/></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label><textarea value={projDesc} onChange={e=>setProjDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background h-20" placeholder="Summarize deliverable scope..."/></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Budget (INR)</label><input type="number" value={projBudget} onChange={e=>setProjBudget(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" placeholder="e.g. 1200000"/></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={()=>setShowProjModal(false)} className="px-4 py-2 border border-border rounded-lg text-xs">Cancel</button><button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg text-xs">Initialize Project</button></div></form></div></div>)}

      {showTaskModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-2xl"><h3 className="text-xl font-bold mb-6">Create Task</h3><form onSubmit={handleCreateTask} className="space-y-4 text-sm"><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Task Title</label><input type="text" value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" placeholder="e.g. Design login screen" required/></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label><textarea value={taskDesc} onChange={e=>setTaskDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background h-20" placeholder="Definition of done..."/></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Priority</label><select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs">{['LOW','MEDIUM','HIGH','CRITICAL'].map(p=><option key={p} value={p}>{p}</option>)}</select></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Status</label><select value={taskStatus} onChange={e=>setTaskStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs">{PM_TASK_STATUSES.map(s=><option key={s} value={s}>{STATUS_META[s].label}</option>)}</select></div></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={()=>setShowTaskModal(false)} className="px-4 py-2 border border-border rounded-lg text-xs">Cancel</button><button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg text-xs">Add Task</button></div></form></div></div>)}

      {showMilestone && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="w-full max-w-sm p-8 rounded-2xl border border-border bg-card shadow-2xl"><h3 className="text-xl font-bold mb-6">Add Milestone</h3><form onSubmit={handleAddMilestone} className="space-y-4 text-sm"><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Milestone Title</label><input type="text" value={milTitle} onChange={e=>setMilTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" placeholder="e.g. Beta Build Complete" required/></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Due Date</label><input type="date" value={milDate} onChange={e=>setMilDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" required/></div><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={()=>setShowMilestone(false)} className="px-4 py-2 border border-border rounded-lg text-xs">Cancel</button><button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg text-xs">Add Milestone</button></div></form></div></div>)}

      {showSprintModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="w-full max-w-sm p-8 rounded-2xl border border-border bg-card shadow-2xl"><h3 className="text-xl font-bold mb-6">Plan New Sprint</h3><form onSubmit={handleAddSprint} className="space-y-4 text-sm"><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Sprint Name</label><input type="text" value={sprintName} onChange={e=>setSprintName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" placeholder="e.g. Sprint 5 Client Review" required/></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Start Date</label><input type="date" value={sprintStart} onChange={e=>setSprintStart(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" required/></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">End Date</label><input type="date" value={sprintEnd} onChange={e=>setSprintEnd(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" required/></div></div><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={()=>setShowSprintModal(false)} className="px-4 py-2 border border-border rounded-lg text-xs">Cancel</button><button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg text-xs">Create Sprint</button></div></form></div></div>)}

      {showRiskModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-2xl"><h3 className="text-xl font-bold mb-6">Log Project Risk</h3><form onSubmit={handleAddRisk} className="space-y-4 text-sm"><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Risk Title</label><input type="text" value={riskTitle} onChange={e=>setRiskTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" placeholder="e.g. API rate limit breach" required/></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Type</label><select value={riskType} onChange={e=>setRiskType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background">{RISK_TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Level</label><select value={riskLevel} onChange={e=>setRiskLevel(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background">{RISK_LEVELS.map(l=><option key={l}>{l}</option>)}</select></div></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Risk Owner</label><input type="text" value={riskOwner} onChange={e=>setRiskOwner(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" placeholder="e.g. Elena Rostova" required/></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mitigation Plan</label><textarea value={riskMitigation} onChange={e=>setRiskMitigation(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background h-20" placeholder="Describe the mitigation strategy..." required/></div><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={()=>setShowRiskModal(false)} className="px-4 py-2 border border-border rounded-lg text-xs">Cancel</button><button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg text-xs">Log Risk</button></div></form></div></div>)}

      {showCRModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-2xl"><h3 className="text-xl font-bold mb-6">New Change Request</h3><form onSubmit={handleAddCR} className="space-y-4 text-sm"><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Change Title</label><input type="text" value={crTitle} onChange={e=>setCRTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" placeholder="e.g. Add export to PDF feature" required/></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Requested By</label><input type="text" value={crRequestedBy} onChange={e=>setCRRequestedBy(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" placeholder="e.g. Robert Chen (Acme Corp)" required/></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">Impact Assessment</label><input type="text" value={crImpact} onChange={e=>setCRImpact(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" placeholder="e.g. Medium 2 weeks INR 80000" required/></div><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={()=>setShowCRModal(false)} className="px-4 py-2 border border-border rounded-lg text-xs">Cancel</button><button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg text-xs">Submit CR</button></div></form></div></div>)}

      {activeTask && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border p-6 shadow-2xl overflow-y-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-lg leading-snug">{activeTask.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${STATUS_META[mapStatus(activeTask.status)]?.bg} ${STATUS_META[mapStatus(activeTask.status)]?.color}`}>{STATUS_META[mapStatus(activeTask.status)]?.label||activeTask.status}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${PRIORITY_META[activeTask.priority]?.color}`}>{activeTask.priority}</span>
                </div>
              </div>
              <button onClick={()=>setActiveTask(null)} className="text-xs border border-border px-2 py-1 rounded hover:bg-secondary transition">Close</button>
            </div>
            {activeTask.description&&<p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border/40 leading-relaxed">{activeTask.description}</p>}
            <form onSubmit={handleLogTime} className="space-y-3 border border-border/80 p-4 rounded-xl">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Log Work Hours</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><label className="block text-[10px] text-muted-foreground mb-1">Duration (min)</label><input type="number" value={logDuration} onChange={e=>setLogDuration(Number(e.target.value))} className="w-full px-2.5 py-1.5 rounded border border-border bg-background" required/></div>
                <div><label className="block text-[10px] text-muted-foreground mb-1">Description</label><input type="text" value={logDesc} onChange={e=>setLogDesc(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-border bg-background" placeholder="What did you work on?"/></div>
              </div>
              <button type="submit" className="w-full py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg">Log Timesheet</button>
            </form>
            {activeTask.timeLogs&&activeTask.timeLogs.length>0&&(
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Time Logs</h5>
                {activeTask.timeLogs.map((tl:any)=>(
                  <div key={tl.id} className="p-2.5 bg-secondary/40 rounded-lg border border-border/40 text-xs flex justify-between"><span className="text-muted-foreground">{tl.description||'Work logged'}</span><span className="font-bold">{tl.durationMin} min</span></div>
                ))}
              </div>
            )}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5"/> Discussion Thread</h5>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {activeTask.comments&&activeTask.comments.length>0?activeTask.comments.map((c:any)=>(
                  <div key={c.id} className="p-3 bg-secondary/50 rounded-lg border border-border/40 text-xs">
                    <div className="flex justify-between items-center mb-1 text-[10px] text-muted-foreground"><span className="font-semibold text-foreground">{c.user?.firstName||'User'}</span><span>{new Date(c.createdAt).toLocaleDateString()}</span></div>
                    <p className="leading-relaxed">{c.content}</p>
                  </div>
                )):<p className="text-[11px] text-muted-foreground italic">No comments yet.</p>}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input type="text" value={commentContent} onChange={e=>setCommentContent(e.target.value)} className="flex-1 text-xs px-2.5 py-2 rounded-lg border border-border bg-background" placeholder="Post a comment..." required/>
                <button type="submit" className="px-3 bg-primary text-primary-foreground text-xs font-medium rounded-lg">Send</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
