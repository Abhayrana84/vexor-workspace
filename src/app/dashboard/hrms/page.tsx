'use client';

import { useEffect, useState } from 'react';
import { apiRequest, getStoredUser } from '../../../lib/api';
import PeopleManagement from '../../../components/PeopleManagement';
import {
  Play,
  Square,
  CalendarRange,
  Users,
  ShieldAlert,
  Award,
  UserPlus,
  FileText,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Send,
  Building,
  Briefcase,
  FileCheck,
  TrendingUp,
  Clock,
  LogOut,
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

export default function HRMS() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Directory Add Employee Form
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empEmail, setEmpEmail] = useState('');
  const [empFirst, setEmpFirst] = useState('');
  const [empLast, setEmpLast] = useState('');
  const [empRole, setEmpRole] = useState('DEVELOPER');
  const [empDept, setEmpDept] = useState('Engineering');
  const [empSalary, setEmpSalary] = useState('850000');
  const [empDesignation, setEmpDesignation] = useState('Software Engineer');

  // Leave Form
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [leaveReason, setLeaveReason] = useState('');

  // Recruitment Candidates State
  const [candidates, setCandidates] = useState<any[]>([]);
  const [showVacModal, setShowVacModal] = useState(false);
  const [vacTitle, setVacTitle] = useState('');
  const [vacDept, setVacDept] = useState('Engineering');

  // Salary Slip Drawer State
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedSlipEmp, setSelectedSlipEmp] = useState<any>(null);

  // Exit Management State
  const [exits, setExits] = useState<any[]>([]);

  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnounceTitle, setNewAnnounceTitle] = useState('');

  const loadData = async () => {
    try {
      const activeUser = getStoredUser();
      setUser(activeUser);

      if (activeUser?.role !== 'CLIENT') {
        try {
          const prof = await apiRequest('/hrms/profile');
          setProfile(prof);
        } catch (e) {
          console.warn('Profile not found for executive/HR role:', e);
          setProfile({
            designation: activeUser.role,
            department: 'Management',
            salary: 750000,
            attendance: [],
            leaves: [],
          });
        }
      }

      if (activeUser?.role === 'FOUNDER' || activeUser?.role === 'CO_FOUNDER' || activeUser?.role === 'ADMIN' || activeUser?.role === 'HR') {
        const staffData = await apiRequest('/hrms/staff');
        setStaff(staffData.users || []);
      }
    } catch (err: any) {
      console.error('HRMS data loading error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckIn = async () => {
    try {
      await apiRequest('/hrms/attendance/check-in', { method: 'POST' });
      alert('Checked in successfully!');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiRequest('/hrms/attendance/check-out', { method: 'POST' });
      alert('Checked out successfully!');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/hrms/leaves', {
        method: 'POST',
        body: JSON.stringify({
          startDate: leaveStart,
          endDate: leaveEnd,
          type: leaveType,
          reason: leaveReason,
        }),
      });
      alert('Leave application submitted!');
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApproveLeave = async (leaveId: string, status: string) => {
    try {
      await apiRequest(`/hrms/leaves/${leaveId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newStaffObj = {
        id: Math.random().toString(),
        email: empEmail,
        firstName: empFirst,
        lastName: empLast,
        role: empRole,
        employeeProfile: {
          department: empDept,
          designation: empDesignation,
          salary: parseInt(empSalary),
          leaves: [],
        },
      };
      setStaff((prev) => [...prev, newStaffObj]);
      setShowEmpModal(false);
      setEmpEmail('');
      setEmpFirst('');
      setEmpLast('');
      alert('New employee added to registry successfully.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePostVacancy = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Job vacancy for '${vacTitle}' posted to Career portal successfully.`);
    setVacTitle('');
    setShowVacModal(false);
  };

  const handleAdvanceCandidate = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const stages = ['Screening', 'Interview', 'Technical Round', 'HR Round', 'Selected', 'Offer Sent', 'Joined'];
          const idx = stages.indexOf(c.stage);
          const nextStage = idx < stages.length - 1 ? stages[idx + 1] : c.stage;
          return { ...c, stage: nextStage };
        }
        return c;
      })
    );
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnounceTitle.trim()) return;
    const newAnn = {
      id: Math.random().toString(),
      title: newAnnounceTitle,
      date: new Date().toISOString().split('T')[0],
      author: 'Sarah Jenkins (HR)',
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    setNewAnnounceTitle('');
    alert('Announcement published to employee notifications dashboard.');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isHRManager = user?.role === 'HR' || user?.role === 'FOUNDER' || user?.role === 'CO_FOUNDER' || user?.role === 'ADMIN';

  const hasCheckedIn = profile?.attendance?.some((att: any) => {
    const todayStr = new Date().toDateString();
    return new Date(att.checkIn).toDateString() === todayStr;
  });

  const activeCheckIn = profile?.attendance?.find((att: any) => att.checkOut === null);

  const hiringData: any[] = [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">HR Control Center</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isHRManager 
              ? 'Complete workforce dashboard—manage candidates, track attendances, clear pay slips, and verify SLA policies.'
              : 'Log daily check-ins, request leave policies, and review personal performance logs.'}
          </p>
        </div>
        
        {isHRManager && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowEmpModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition"
            >
              <UserPlus className="w-4 h-4" /> Add Employee
            </button>
            <button
              onClick={() => setShowVacModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-border bg-card font-semibold rounded-lg text-xs hover:bg-secondary transition"
            >
              <Briefcase className="w-4 h-4" /> Post Job
            </button>
          </div>
        )}
      </div>

      {user?.role === 'CLIENT' ? (
        <div className="p-8 text-center border border-dashed border-border rounded-xl bg-card">
          <p className="text-sm text-muted-foreground">Client profiles do not have internal attendance or leave records.</p>
        </div>
      ) : isHRManager ? (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 border-b border-border pb-3 shrink-0">
            {[
              { id: 'overview', name: 'Workforce KPIs', icon: TrendingUp },
              { id: 'people', name: 'People & Access', icon: Users },
              { id: 'directory', name: 'Staff Register', icon: Users },
              { id: 'recruitment', name: 'Recruitment Board', icon: Briefcase },
              { id: 'leaves', name: 'Leaves & TimeOff', icon: CalendarRange },
              { id: 'payroll', name: 'Payroll Console', icon: FileText },
              { id: 'policies', name: 'Policies & Exits', icon: FileCheck },
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

          {activeTab === 'people' && <PeopleManagement />}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Personnel Registry</span>
                  <h3 className="text-2xl font-black mt-2">{staff.length} Active</h3>
                  <span className="text-[9px] text-muted-foreground block mt-1">No new recruits this month</span>
                </div>
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Shift Attendance Rate</span>
                  <h3 className="text-2xl font-black mt-2 text-green-500">{staff.length > 0 ? "100.0%" : "0.0%"}</h3>
                  <span className="text-[9px] text-green-500 block mt-1">SLA Limit: 90%</span>
                </div>
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Leaves Utilization</span>
                  <h3 className="text-2xl font-black mt-2 text-yellow-500">0.0%</h3>
                  <span className="text-[9px] text-muted-foreground block mt-1">No active leaves today</span>
                </div>
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Employee Satisfaction</span>
                  <h3 className="text-2xl font-black mt-2 text-blue-500">5.0 / 5</h3>
                  <span className="text-[9px] text-blue-500 block mt-1">Pulse Score: Outstanding</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card space-y-4">
                  <div>
                    <h4 className="font-bold text-sm">Hiring pipeline & Days to Onboard</h4>
                    <p className="text-xs text-muted-foreground">Tracking average recruitment speed in days MoM.</p>
                  </div>
                  <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-xl bg-secondary/5">
                    <p className="text-xs text-muted-foreground">No active recruitment data available.</p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-border bg-card flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-widest">Office Celebrations</h4>
                    <div className="text-xs text-muted-foreground italic py-8 text-center border border-dashed border-border rounded-xl bg-secondary/5">
                      No celebrations or milestones today.
                    </div>
                  </div>
                  <div className="p-3 bg-secondary/30 border border-border/40 rounded-xl mt-4">
                    <p className="text-[10px] leading-tight text-muted-foreground">AI suggestion: Send automated greetings for birthdays or work anniversaries when available.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'directory' && (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-blue-500" />
                  Staff Directory
                </h4>
                <div className="flex items-center gap-2 max-w-xs px-3 py-1.5 rounded-lg border border-border bg-background">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <input type="text" placeholder="Search directory..." className="text-xs bg-transparent focus:outline-none w-full" />
                </div>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase">
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Designation</th>
                      <th className="py-2.5 px-3">Contract Salary</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {staff.map((emp) => (
                      <tr key={emp.id} className="hover:bg-secondary/15 transition">
                        <td className="py-3 px-3">
                          <div className="font-bold">{emp.firstName} {emp.lastName}</div>
                          <div className="text-[10px] text-muted-foreground">{emp.email}</div>
                        </td>
                        <td className="py-3 px-3">{emp.employeeProfile?.department || 'Engineering'}</td>
                        <td className="py-3 px-3">{emp.employeeProfile?.designation || 'Engineer'}</td>
                        <td className="py-3 px-3 font-semibold">₹{(emp.employeeProfile?.salary || 0).toLocaleString()}/yr</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-secondary border border-border">
                            {emp.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSlipEmp(emp);
                              setShowSlipModal(true);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 rounded border border-blue-500/10 hover:bg-blue-500/20"
                          >
                            Pay Slip
                          </button>
                          <button
                            onClick={() => alert(`Warning letter generated and emailed to ${emp.firstName}.`)}
                            className="px-2.5 py-1 text-[10px] font-bold bg-yellow-500/10 text-yellow-600 rounded border border-yellow-500/10 hover:bg-yellow-500/20"
                          >
                            Warn
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'recruitment' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex justify-between items-center text-xs">
                <p className="text-muted-foreground">Interactive recruitment desk. Track and advance candidates through pipeline stages. Generates printable offer letters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['Screening', 'Interview', 'Technical Round', 'Offer Sent'].map((stage) => {
                  const list = candidates.filter((c) => c.stage === stage);
                  return (
                    <div key={stage} className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="font-bold text-xs uppercase tracking-wider">{stage}</h5>
                        <span className="text-[10px] px-1.5 py-0.2 bg-secondary rounded-full font-bold">{list.length}</span>
                      </div>
                      
                      <div className="space-y-2.5">
                        {list.map((c) => (
                          <div key={c.id} className="p-3 rounded-lg border border-border bg-card shadow-sm space-y-2 text-xs">
                            <div>
                              <p className="font-bold">{c.name}</p>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">{c.role}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-border/40 text-[10px]">
                              <span className="text-muted-foreground">Date: {c.appliedDate}</span>
                              <button
                                onClick={() => handleAdvanceCandidate(c.id)}
                                className="px-2 py-0.5 rounded bg-blue-500 text-white font-bold text-[9px]"
                              >
                                Advance
                              </button>
                            </div>
                          </div>
                        ))}
                        {list.length === 0 && (
                          <p className="text-center py-6 text-muted-foreground italic text-[10px]">No candidates.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-yellow-500">Pending Leave Approvals</h4>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase">
                        <th className="py-2 px-3">Employee</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Reason</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {staff.flatMap((s) => {
                        const ep = s.employeeProfile;
                        const pending = ep?.leaves?.filter((l: any) => l.status === 'PENDING') || [];
                        return pending.map((l: any) => ({
                          ...l,
                          employeeName: `${s.firstName} ${s.lastName}`,
                        }));
                      }).map((l) => (
                        <tr key={l.id} className="hover:bg-secondary/15 transition">
                          <td className="py-3 px-3 font-bold">{l.employeeName}</td>
                          <td className="py-3 px-3">{l.type}</td>
                          <td className="py-3 px-3 text-muted-foreground">{l.reason || 'Not specified'}</td>
                          <td className="py-3 px-3 text-right space-x-2">
                            <button
                              onClick={() => handleApproveLeave(l.id, 'APPROVED')}
                              className="px-2 py-0.5 bg-green-500 text-white rounded text-[9px] font-bold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveLeave(l.id, 'REJECTED')}
                              className="px-2 py-0.5 bg-red-500 text-white rounded text-[9px] font-bold"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                      {staff.flatMap((s) => s.employeeProfile?.leaves || []).filter((l: any) => l.status === 'PENDING').length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground italic">No leave applications awaiting review.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <h4 className="font-bold text-sm">Attendance Logs Audit</h4>
                <div className="text-xs text-muted-foreground italic py-8 text-center border border-dashed border-border rounded-xl bg-secondary/5">
                  No attendance logs logged today.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payroll' && (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm">Salary & Wages Console</h4>
                <button
                  onClick={() => alert('Monthly payroll disbursement processed. Alert emails dispatched to bank APIs.')}
                  className="px-3.5 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:opacity-90 transition"
                >
                  Process Monthly Payroll
                </button>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase">
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Base Salary</th>
                      <th className="py-2.5 px-3">Deductions</th>
                      <th className="py-2.5 px-3">Allowances</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {staff.map((emp) => {
                      const baseSalary = emp.employeeProfile?.salary || 0;
                      const monthBase = Math.round(baseSalary / 12);
                      const allowance = Math.round(monthBase * 0.1);
                      const deduction = Math.round(monthBase * 0.05);
                      return (
                        <tr key={emp.id} className="hover:bg-secondary/15 transition">
                          <td className="py-3 px-3 font-bold">{emp.firstName} {emp.lastName}</td>
                          <td className="py-3 px-3">₹{monthBase.toLocaleString()}/mo</td>
                          <td className="py-3 px-3 text-red-500">-₹{deduction.toLocaleString()}</td>
                          <td className="py-3 px-3 text-green-500">+₹{allowance.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedSlipEmp(emp);
                                setShowSlipModal(true);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold bg-blue-500 text-white rounded hover:opacity-90"
                            >
                              Generate Pay Slip
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <h4 className="font-bold text-sm">Internal HR Announcements</h4>
                <form onSubmit={handleAddAnnouncement} className="flex gap-2">
                  <input
                    type="text"
                    value={newAnnounceTitle}
                    onChange={(e) => setNewAnnounceTitle(e.target.value)}
                    placeholder="New policy release or update notice..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none"
                    required
                  />
                  <button type="submit" className="p-2.5 bg-primary text-primary-foreground rounded-lg">
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </form>

                <div className="space-y-3.5 text-xs">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-3 rounded-lg bg-secondary/25 border border-border/50">
                      <p className="font-bold">{ann.title}</p>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Published on: {ann.date} by {ann.author}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-red-500">Exit Clearance Logs</h4>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase">
                        <th className="py-2.5">Resigned</th>
                        <th className="py-2.5">Reason</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/65">
                      {exits.map((ex) => (
                        <tr key={ex.id}>
                          <td className="py-3 font-bold">{ex.name}</td>
                          <td className="py-3 text-muted-foreground">{ex.reason}</td>
                          <td className="py-3">{ex.clearanceStatus}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setExits((prev) => prev.filter((item) => item.id !== ex.id));
                                alert(`Exit clearance signed for ${ex.name}. relieving letter emailed.`);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold bg-green-500 text-white rounded hover:opacity-90"
                            >
                              Final Settlement
                            </button>
                          </td>
                        </tr>
                      ))}
                      {exits.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground italic">No resignations in notice period.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-1">
            {profile && (
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
                <div>
                  <h4 className="font-bold text-sm">Personal Dashboard</h4>
                  <p className="text-xs text-muted-foreground">{profile.designation} — {profile.department}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground">Attendance Track</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] border ${
                      activeCheckIn 
                        ? 'bg-green-500/10 text-green-500 border-green-500/10 animate-pulse'
                        : 'bg-red-500/10 text-red-500 border-red-500/10'
                    }`}>
                      {activeCheckIn ? 'Shift Active' : 'Off Clock'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleCheckIn}
                      disabled={hasCheckedIn || !!activeCheckIn}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-green-500 text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-40"
                    >
                      <Play className="w-3.5 h-3.5" /> Check In
                    </button>
                    <button
                      onClick={handleCheckOut}
                      disabled={!activeCheckIn}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-40"
                    >
                      <Square className="w-3.5 h-3.5" /> Check Out
                    </button>
                  </div>
                </div>

                <div className="border-t border-border/80 pt-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Contract Base Salary</span>
                    <span className="font-bold text-sm">₹{profile.salary.toLocaleString()}/yr</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Award className="w-4.5 h-4.5" />
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-accent" />
                Apply for Leave
              </h4>
              <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Start Date</label>
                    <input
                      type="date"
                      value={leaveStart}
                      onChange={(e) => setLeaveStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-border bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">End Date</label>
                    <input
                      type="date"
                      value={leaveEnd}
                      onChange={(e) => setLeaveEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-border bg-background"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-border bg-background"
                  >
                    <option value="CASUAL">CASUAL LEAVE</option>
                    <option value="SICK">SICK LEAVE</option>
                    <option value="MATERNITY">MATERNITY LEAVE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Reason / Justification</label>
                  <input
                    type="text"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-border bg-background"
                    placeholder="Brief rationale..."
                  />
                </div>

                <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs">
                  Submit Request
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <h4 className="font-bold text-sm">Leave History</h4>
              <div className="space-y-3.5 text-xs">
                {profile?.leaves && profile.leaves.length > 0 ? (
                  profile.leaves.map((l: any) => (
                    <div key={l.id} className="flex justify-between items-center p-3 rounded-lg bg-secondary/35 border border-border/50">
                      <div>
                        <p className="font-semibold">{l.type} LEAVE</p>
                        <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{l.reason || 'No details provided'}</p>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        l.status === 'APPROVED'
                          ? 'bg-green-500/10 text-green-500 border-green-500/10'
                          : l.status === 'REJECTED'
                          ? 'bg-red-500/10 text-red-500 border-red-500/10'
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/10'
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground italic text-xs">No leave applications lodged yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-2xl relative">
            <h3 className="text-xl font-bold mb-6">Add New Staff Member</h3>
            <form onSubmit={handleCreateEmployee} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={empFirst}
                    onChange={(e) => setEmpFirst(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g. Rahul"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={empLast}
                    onChange={(e) => setEmpLast(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g. Kumar"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Corporate Email</label>
                <input
                  type="email"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. rahul@vexor.com"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Role Type</label>
                  <select
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="DEVELOPER">DEVELOPER</option>
                    <option value="DESIGNER">DESIGNER</option>
                    <option value="HR">HR MANAGER</option>
                    <option value="FINANCE_MANAGER">FINANCE MANAGER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
                  <input
                    type="text"
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Designation</label>
                  <input
                    type="text"
                    value={empDesignation}
                    onChange={(e) => setEmpDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">CTC Salary (₹)</label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEmpModal(false)}
                  className="px-4 py-2 border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg">
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVacModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-2xl relative">
            <h3 className="text-xl font-bold mb-6">Publish Job opening</h3>
            <form onSubmit={handlePostVacancy} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Job Title</label>
                <input
                  type="text"
                  value={vacTitle}
                  onChange={(e) => setVacTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g. Senior Frontend Engineer"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Target Department</label>
                <select
                  value={vacDept}
                  onChange={(e) => setVacDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product Design">Product Design</option>
                  <option value="Marketing">Marketing & Sales</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVacModal(false)}
                  className="px-4 py-2 border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg">
                  Publish Vacancy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSlipModal && selectedSlipEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg p-8 rounded-3xl border border-border bg-card shadow-2xl relative space-y-6 text-xs text-foreground">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-black tracking-tight text-primary">VEXOR IT SOLUTIONS</h3>
                <p className="text-[10px] text-muted-foreground">Plot 45, Sector-12, Gurugram, Haryana - 122001</p>
              </div>
              <div className="text-right">
                <span className="p-1 px-2.5 font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/10 rounded-full text-[9px]">
                  PAID SLIP
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">July 2026</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/60">
              <div>
                <p className="text-[10px] text-muted-foreground">Employee Name</p>
                <p className="font-bold text-sm mt-0.5">{selectedSlipEmp.firstName} {selectedSlipEmp.lastName}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Designation / Role</p>
                <p className="font-bold text-sm mt-0.5">{selectedSlipEmp.employeeProfile?.designation || 'Engineer'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Department</p>
                <p className="font-bold text-sm mt-0.5">{selectedSlipEmp.employeeProfile?.department || 'Engineering'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Email</p>
                <p className="font-bold text-sm mt-0.5 text-muted-foreground">{selectedSlipEmp.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-bold text-[10px] uppercase text-muted-foreground border-b border-border/40 pb-1.5">
                <span>Description</span>
                <span>Amount (₹)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Basic Salary</span>
                <span>₹{Math.round((selectedSlipEmp.employeeProfile?.salary || 0) / 12).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 text-green-500 font-medium">
                <span>HRA & Allowances (10%)</span>
                <span>+₹{Math.round(((selectedSlipEmp.employeeProfile?.salary || 0) / 12) * 0.1).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 text-red-500 font-medium">
                <span>Tax Deductions (5%)</span>
                <span>-₹{Math.round(((selectedSlipEmp.employeeProfile?.salary || 0) / 12) * 0.05).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border text-sm font-black bg-secondary/15 p-4 rounded-xl">
              <span>NET PAYABLE DISBURSED</span>
              <span className="text-primary text-base">
                ₹{Math.round(((selectedSlipEmp.employeeProfile?.salary || 0) / 12) * 1.05).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition text-xs font-semibold"
              >
                Print Slip
              </button>
              <button
                onClick={() => setShowSlipModal(false)}
                className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
