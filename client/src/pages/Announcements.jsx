import { useEffect, useState } from 'react';
import { Megaphone, Pin, Plus, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { title: '', body: '', category: 'News', pinned: false };

export default function Announcements() {
  const { user } = useAuth();
  const canPost = ['admin', 'hr'].includes(user?.role);
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data.announcements);
      setError('');
    } catch (requestError) { setError(errorMessage(requestError)); }
  };

  useEffect(() => { load(); }, []);

  const publish = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/announcements', form);
      setModal(false);
      setForm(emptyForm);
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const remove = async (announcement) => {
    if (!window.confirm(`Delete the announcement "${announcement.title}"?`)) return;
    try {
      await api.delete(`/announcements/${announcement._id}`);
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  };

  return <div className="page-stack">
    <section className="page-title-row">
      <div><div className="eyebrow">COMPANY BULLETIN</div><h1>Announcements<span className="title-period">.</span></h1><p className="muted">News, events, and updates from across your organisation.</p></div>
      {canPost && <button className="primary-button" onClick={() => { setError(''); setForm(emptyForm); setModal(true); }}><Plus size={17}/> Post an update</button>}
    </section>
    {error && !modal && <div className="alert error">{error}</div>}
    <section className="announcement-feed" aria-live="polite">
      {announcements.map((announcement) => <article className={`announcement-entry${announcement.pinned ? ' is-pinned' : ''}`} key={announcement._id}>
        <div className="announcement-mark"><Megaphone size={19}/></div>
        <div className="announcement-content">
          <div className="announcement-meta"><span className="status-pill">{announcement.category}</span>{announcement.pinned && <span className="pinned-label"><Pin size={13}/> Pinned</span>}<time>{new Date(announcement.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time></div>
          <h2>{announcement.title}</h2>
          <p>{announcement.body}</p>
          <small>Posted by {announcement.createdBy?.name || 'StaffSync HR'}</small>
        </div>
        {canPost && <button className="small-icon-button danger" title="Delete announcement" aria-label={`Delete ${announcement.title}`} onClick={() => remove(announcement)}><Trash2 size={15}/></button>}
      </article>)}
      {!announcements.length && <div className="empty-state"><Megaphone size={28}/><strong>No announcements yet</strong><p>Company updates will appear here when they are posted.</p></div>}
    </section>
    {modal && <Modal title="Post an announcement" onClose={() => setModal(false)}><form className="modal-form" onSubmit={publish}>
      <div className="form-grid"><label className="full-span">Headline *<input maxLength="140" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required/></label>
        <label>Category<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}><option>News</option><option>Policy</option><option>Event</option></select></label>
        <label className="checkbox-field"><input type="checkbox" checked={form.pinned} onChange={(event) => setForm((current) => ({ ...current, pinned: event.target.checked }))}/> Pin to the top</label>
        <label className="full-span">Update *<textarea rows="5" maxLength="5000" value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} required/></label>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Publishing...' : 'Publish update'}</button></div>
    </form></Modal>}
  </div>;
}
