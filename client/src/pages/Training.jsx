import { useEffect, useState } from 'react';
import { BookOpenCheck, CalendarDays, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const departments = ['Engineering', 'Human Resources', 'Finance', 'Marketing', 'Sales', 'Operations', 'Design', 'Support'];
const emptyForm = { title: '', description: '', department: '', provider: '', format: 'In person', location: '', startDate: '', endDate: '', status: 'Planned' };
const dateValue = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
const dateLabel = (value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function Training() {
  const { user } = useAuth();
  const canManage = ['admin', 'hr', 'manager'].includes(user?.role);
  const isManager = user?.role === 'manager';
  const [programs, setPrograms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [programResponse, employeeResponse] = await Promise.all([api.get('/training'), api.get('/employees')]);
      setPrograms(programResponse.data.programs);
      setEmployees(employeeResponse.data.employees);
      setError('');
    } catch (requestError) { setError(errorMessage(requestError)); }
  };

  useEffect(() => { load(); }, []);

  const departmentOptions = [...new Set([...departments, ...employees.map((employee) => employee.department).filter(Boolean)])];
  const filtered = programs.filter((program) => (!status || program.status === status)
    && `${program.title} ${program.provider} ${program.department}`.toLowerCase().includes(search.toLowerCase()));
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, department: isManager ? (employees[0]?.department || '') : departments[0] });
    setError('');
    setModal(true);
  };

  const openEdit = (program) => {
    setEditing(program);
    setForm({ ...program, startDate: dateValue(program.startDate), endDate: dateValue(program.endDate) });
    setError('');
    setModal(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editing) await api.patch(`/training/${editing._id}`, form);
      else await api.post('/training', form);
      setModal(false);
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const remove = async (program) => {
    if (!window.confirm(`Delete the training program "${program.title}"?`)) return;
    try {
      await api.delete(`/training/${program._id}`);
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  };

  return <div className="page-stack">
    <section className="page-title-row"><div><div className="eyebrow">TEAM DEVELOPMENT</div><h1>Training programs<span className="title-period">.</span></h1><p className="muted">Plan learning opportunities and track their progress.</p></div>
      {canManage && <button className="primary-button" onClick={openCreate}><Plus size={17}/> Add program</button>}
    </section>
    {error && !modal && <div className="alert error">{error}</div>}
    <div className="panel table-panel training-panel">
      <div className="table-toolbar"><div className="search-field"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search programs, provider, department..."/></div>
        <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option>Planned</option><option>In Progress</option><option>Completed</option></select>
      </div>
      <div className="training-list">
        {filtered.map((program) => <article className="training-entry" key={program._id}>
          <div className="training-icon"><BookOpenCheck size={20}/></div>
          <div className="training-info"><div className="training-heading"><div><span className={`status-pill ${program.status.toLowerCase().replace(' ', '-')}`}>{program.status}</span><span className="training-department">{program.department}</span></div>
              {canManage && <div className="action-buttons"><button className="small-icon-button" title="Edit program" aria-label={`Edit ${program.title}`} onClick={() => openEdit(program)}><Pencil size={15}/></button><button className="small-icon-button danger" title="Delete program" aria-label={`Delete ${program.title}`} onClick={() => remove(program)}><Trash2 size={15}/></button></div>}
            </div>
            <h2>{program.title}</h2><p>{program.description}</p>
            <div className="training-details"><span><CalendarDays size={15}/>{dateLabel(program.startDate)} - {dateLabel(program.endDate)}</span><span>{program.format}{program.provider ? ` · ${program.provider}` : ''}</span>{program.location && <span><MapPin size={15}/>{program.location}</span>}</div>
          </div>
        </article>)}
        {!filtered.length && <div className="empty-state"><BookOpenCheck size={28}/><strong>No training programs found</strong><p>Programs for your team will appear here.</p></div>}
      </div>
      <div className="table-footer"><span>{filtered.length} program{filtered.length === 1 ? '' : 's'}</span><span>Programs are scoped to your department</span></div>
    </div>
    {modal && <Modal title={editing ? 'Edit training program' : 'Add a training program'} onClose={() => setModal(false)}><form className="modal-form" onSubmit={save}>
      <div className="form-grid"><label className="full-span">Program title *<input maxLength="140" value={form.title} onChange={(event) => setField('title', event.target.value)} required/></label>
        <label>Department *<select value={form.department} onChange={(event) => setField('department', event.target.value)} disabled={isManager} required>{departmentOptions.map((department) => <option key={department}>{department}</option>)}</select></label>
        <label>Format<select value={form.format} onChange={(event) => setField('format', event.target.value)}><option>In person</option><option>Online</option><option>Hybrid</option></select></label>
        <label>Start date *<input type="date" value={form.startDate} onChange={(event) => setField('startDate', event.target.value)} required/></label>
        <label>End date *<input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => setField('endDate', event.target.value)} required/></label>
        <label>Provider<input value={form.provider} onChange={(event) => setField('provider', event.target.value)} placeholder="Optional"/></label>
        <label>Location<input value={form.location} onChange={(event) => setField('location', event.target.value)} placeholder="Optional"/></label>
        <label>Status<select value={form.status} onChange={(event) => setField('status', event.target.value)}><option>Planned</option><option>In Progress</option><option>Completed</option></select></label>
        <label className="full-span">Description *<textarea rows="4" maxLength="3000" value={form.description} onChange={(event) => setField('description', event.target.value)} required/></label>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button><button className="primary-button" disabled={busy || (isManager && !employees.length)}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Create program'}</button></div>
    </form></Modal>}
  </div>;
}
