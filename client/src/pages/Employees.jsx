import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Users, Download, X } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { accountPassword:'', accountRole:'employee', employeeId:'', name:'', email:'', phone:'', department:'Engineering', position:'', employmentType:'Full-time', salary:'', joiningDate:new Date().toISOString().slice(0,10), status:'Active' };
const departments = ['Engineering','Human Resources','Finance','Marketing','Sales','Operations','Design','Support'];
export default function Employees() {
  const { user } = useAuth();
  const canEdit = ['admin','hr'].includes(user?.role);
  const canDelete = user?.role === 'admin';
  const [employees,setEmployees] = useState([]);
  const [search,setSearch] = useState('');
  const [department,setDepartment] = useState('');
  const [status,setStatus] = useState('');
  const [modal,setModal] = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState(emptyForm);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);

  const load = async () => { try { const {data}=await api.get('/employees'); setEmployees(data.employees); setError(''); } catch(e){setError(errorMessage(e));} };
  useEffect(()=>{load();},[]);
  const filtered = useMemo(()=>employees.filter(e=>(!department||e.department===department)&&(!status||e.status===status)&&[e.name,e.email,e.employeeId,e.department,e.position].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase()))),[employees,search,department,status]);
  const setField=(k,v)=>setForm(f=>({...f,[k]:v}));
  const openCreate=()=>{setEditing(null);setForm({...emptyForm,employeeId:`EMP-${String(Date.now()).slice(-5)}`});setError('');setModal(true);};
  const openEdit=(e)=>{setEditing(e);setForm({...e,salary:e.salary??'',joiningDate:e.joiningDate?new Date(e.joiningDate).toISOString().slice(0,10):''});setError('');setModal(true);};
  const save=async(e)=>{e.preventDefault();setBusy(true);setError('');try{const payload={...form,salary:Number(form.salary||0)};if(editing) await api.put(`/employees/${editing._id}`,payload);else await api.post('/employees',payload);setModal(false);await load();}catch(err){setError(errorMessage(err));}finally{setBusy(false);}};
  const remove=async(e)=>{if(!window.confirm(`Delete ${e.name}'s employee record? This cannot be undone.`))return;try{await api.delete(`/employees/${e._id}`);await load();}catch(err){setError(errorMessage(err));}};
  const exportCsv=()=>{const cols=['employeeId','name','email','phone','department','position','employmentType','salary','joiningDate','status'];const csv=[cols.join(','),...filtered.map(e=>cols.map(c=>`"${String(e[c]??'').replaceAll('"','""')}"`).join(','))].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='staffsync-employees.csv';a.click();URL.revokeObjectURL(url);};
  return <div className="page-stack">
    <section className="page-title-row"><div><div className="eyebrow">YOUR ORGANISATION</div><h1>Employee directory<span className="title-period">.</span></h1><p className="muted">All your people information, neatly in one place.</p></div>{canEdit&&<button className="primary-button" onClick={openCreate}><Plus size={17}/> Add employee</button>}</section>
    {error&&!modal&&<div className="alert error">{error}</div>}
    <div className="panel table-panel">
      <div className="table-toolbar"><div className="search-field"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search people, ID, department…"/></div><select value={department} onChange={e=>setDepartment(e.target.value)}><option value="">All departments</option>{departments.map(d=><option key={d}>{d}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option>Active</option><option>On Leave</option><option>Inactive</option></select><button className="secondary-button" onClick={exportCsv}><Download size={16}/> Export CSV</button></div>
      <div className="table-scroll"><table><thead><tr><th>EMPLOYEE</th><th>EMPLOYEE ID</th><th>DEPARTMENT</th><th>POSITION</th><th>STATUS</th><th>JOINED</th><th>ACTIONS</th></tr></thead><tbody>
        {filtered.map(e=><tr key={e._id}><td><div className="table-person"><div className="avatar person-avatar">{e.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div><div><strong>{e.name}</strong><small>{e.email}</small></div></div></td><td><span className="id-tag">{e.employeeId}</span></td><td>{e.department}</td><td>{e.position}</td><td><span className={`status-pill ${e.status.toLowerCase().replace(' ','-')}`}>{e.status}</span></td><td>{e.joiningDate?new Date(e.joiningDate).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—'}</td><td><div className="action-buttons">{canEdit&&<button className="small-icon-button" title="Edit" onClick={()=>openEdit(e)}><Pencil size={15}/></button>}{canDelete&&<button className="small-icon-button danger" title="Delete" onClick={()=>remove(e)}><Trash2 size={15}/></button>}</div></td></tr>)}
      </tbody></table></div>
      {!filtered.length&&<div className="empty-state"><Users size={28}/><strong>No employees found</strong><p>Try a different search or add a new team member.</p>{search||department||status?<button className="secondary-button" onClick={()=>{setSearch('');setDepartment('');setStatus('');}}><X size={15}/> Clear filters</button>:null}</div>}
      <div className="table-footer"><span>Showing <strong>{filtered.length}</strong> of <strong>{employees.length}</strong> employees</span><span>Updated live from your database</span></div>
    </div>
    {modal&&<Modal title={editing?'Edit employee':'Add a new employee'} onClose={()=>setModal(false)}><form onSubmit={save} className="modal-form">
      <div className="form-grid"><label>Employee ID *<input value={form.employeeId} onChange={e=>setField('employeeId',e.target.value)} required/></label><label>Full name *<input value={form.name} onChange={e=>setField('name',e.target.value)} required/></label><label>Work email *<input type="email" value={form.email} onChange={e=>setField('email',e.target.value)} required/></label><label>Login role<select value={form.accountRole} onChange={e=>setField('accountRole',e.target.value)}><option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR</option></select></label><label>Initial login password<input type="password" minLength="8" value={form.accountPassword} onChange={e=>setField('accountPassword',e.target.value)} placeholder="Leave blank for no login account"/></label><label>Phone<input value={form.phone} onChange={e=>setField('phone',e.target.value)}/></label><label>Department *<select value={form.department} onChange={e=>setField('department',e.target.value)}>{departments.map(d=><option key={d}>{d}</option>)}</select></label><label>Job title *<input value={form.position} onChange={e=>setField('position',e.target.value)} required/></label><label>Employment type<select value={form.employmentType} onChange={e=>setField('employmentType',e.target.value)}>{['Full-time','Part-time','Contract','Intern'].map(x=><option key={x}>{x}</option>)}</select></label><label>Annual salary<input type="number" min="0" value={form.salary} onChange={e=>setField('salary',e.target.value)}/></label><label>Joining date<input type="date" value={form.joiningDate} onChange={e=>setField('joiningDate',e.target.value)}/></label><label>Status<select value={form.status} onChange={e=>setField('status',e.target.value)}>{['Active','On Leave','Inactive'].map(x=><option key={x}>{x}</option>)}</select></label></div>
      {error&&<div className="alert error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setModal(false)}>Cancel</button><button className="primary-button" disabled={busy}>{busy?'Saving…':editing?'Save changes':'Create employee'}</button></div>
    </form></Modal>}
  </div>;
}
