import { useEffect, useState } from 'react';
import { Users, UserCheck, CalendarDays, Clock3, ArrowUpRight, Plus, ChevronRight, CalendarCheck, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import StatCard from '../components/StatCard.jsx';

const today = () => new Date().toLocaleDateString('en-CA');
const shortDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) : '—';

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api.get('/employees'), api.get('/attendance'), api.get('/leaves')])
      .then(([e,a,l]) => { setEmployees(e.data.employees); setAttendance(a.data.records); setLeaves(l.data.leaves); })
      .catch(err => setError(errorMessage(err)));
  }, []);
  const active = employees.filter(e=>e.status==='Active').length;
  const todayRecords = attendance.filter(a=>a.date===today());
  const present = todayRecords.filter(a=>['Present','Late','Half-day'].includes(a.status)).length;
  const pending = leaves.filter(l=>l.status==='Pending').length;
  const recent = [...employees].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);

  return <div className="page-stack">
    <section className="welcome-row"><div><div className="eyebrow">YOUR PEOPLE, AT A GLANCE</div><h1>Good work starts here<span className="title-period">.</span></h1><p className="muted">A clear view of your team and the workday ahead.</p></div><div className="welcome-date"><CalendarDays size={17}/>{new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</div></section>
    {error && <div className="alert error">{error}</div>}
    <section className="stats-grid">
      <StatCard label="Total employees" value={employees.length} detail={`${active} active team members`} icon={Users} tone="blue"/>
      <StatCard label="Present today" value={present} detail={`${todayRecords.length} attendance records`} icon={UserCheck} tone="green"/>
      <StatCard label="Pending leave" value={pending} detail="Requests awaiting review" icon={Clock3} tone="orange"/>
      <StatCard label="Departments" value={new Set(employees.map(e=>e.department)).size} detail="Across your organisation" icon={CalendarDays} tone="purple"/>
    </section>
    <section className="dashboard-grid">
      <div className="panel">
        <div className="panel-heading"><div><h2>Recently added people</h2><p>Your latest employee records</p></div><Link to="/employees" className="text-link">View directory <ArrowUpRight size={15}/></Link></div>
        {recent.length ? <div className="people-list">{recent.map(e=><div className="person-row" key={e._id}><div className="avatar person-avatar">{e.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div><div className="person-info"><strong>{e.name}</strong><small>{e.position} · {e.department}</small></div><div className={`status-pill ${e.status.toLowerCase().replace(' ','-')}`}>{e.status}</div></div>)}</div> : <div className="empty-state"><Users size={28}/><strong>Your team starts here</strong><p>Add your first employee to see them here.</p><Link className="text-link" to="/employees">Add employee <ChevronRight size={15}/></Link></div>}
      </div>
      <div className="panel quick-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Get the essentials done</p></div></div>
        <Link to="/employees" className="quick-action"><span className="quick-icon blue"><Plus size={19}/></span><span><strong>Add an employee</strong><small>Create a new employee record</small></span><ChevronRight size={17}/></Link>
        <Link to="/attendance" className="quick-action"><span className="quick-icon green"><CalendarCheck size={19}/></span><span><strong>Mark attendance</strong><small>Record today's attendance</small></span><ChevronRight size={17}/></Link>
        <Link to="/leaves" className="quick-action"><span className="quick-icon orange"><ClipboardList size={19}/></span><span><strong>Review leave</strong><small>{pending} request{pending===1?'':'s'} need attention</small></span><ChevronRight size={17}/></Link>
        <div className="tip-card"><div className="tip-spark">✦</div><div><strong>A people-first reminder</strong><p>Consistent records make everyday decisions easier and fairer.</p></div></div>
      </div>
    </section>
    <section className="bottom-note"><div><span className="note-icon"><ShieldCheckIcon/></span><div><strong>One team, one source of truth</strong><p>Keep employee details, attendance and leave requests organised in StaffSync.</p></div></div><Link to="/employees" className="text-link">Open directory <ArrowUpRight size={15}/></Link></section>
  </div>;
}
function ShieldCheckIcon(){ return <UserCheck size={18}/>; }
