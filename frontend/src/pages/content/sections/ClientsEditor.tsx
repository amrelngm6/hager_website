import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../../../api/content.api';
import { Save, Plus, Trash2 } from 'lucide-react';

interface ClientItem { name: string; logoUrl: string }
interface ButtonItem { label: string; action: string; link?: string; styleClass: string }
interface ClientsData { intro: string; items: ClientItem[]; buttons: ButtonItem[]; triggers: string }

const def: ClientsData = { intro: '', items: [], buttons: [], triggers: '' };

export function ClientsEditor() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<ClientsData>(def);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['content', 'clients'],
    queryFn: () => contentApi.getByKey('clients'),
    select: (r: Awaited<ReturnType<typeof contentApi.getByKey>>) =>
      r.data.data.data as unknown as ClientsData,
  });

  useEffect(() => { if (raw) setForm({ ...def, ...raw }); }, [raw]);

  const mutation = useMutation({
    mutationFn: () => contentApi.update('clients', form as unknown as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content', 'clients'] }); setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  const setField = (k: keyof ClientsData, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setClient = (i: number, k: keyof ClientItem, v: string) => setForm((f) => { const a = [...f.items]; a[i] = { ...a[i], [k]: v }; return { ...f, items: a }; });
  const addClient = () => setForm((f) => ({ ...f, items: [...f.items, { name: '', logoUrl: '' }] }));
  const removeClient = (i: number) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setBtn = (i: number, k: keyof ButtonItem, v: string) => setForm((f) => { const a = [...f.buttons]; a[i] = { ...a[i], [k]: v }; return { ...f, buttons: a }; });
  const addBtn = () => setForm((f) => ({ ...f, buttons: [...f.buttons, { label: '', action: '', styleClass: '' }] }));
  const removeBtn = (i: number) => setForm((f) => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));

  if (isLoading) return <div className="editor-loading">Loading…</div>;

  return (
    <div className="section-editor">
      <div className="field-group">
        <label>Intro Text (HTML allowed)</label>
        <textarea rows={3} value={form.intro} onChange={(e) => setField('intro', e.target.value)} />
      </div>

      <div className="editor-sub-section">
        <div className="sub-section-header">
          <h3>Client Logos</h3>
          <button className="btn-add" onClick={addClient}><Plus size={14} /> Add Client</button>
        </div>
        {form.items.map((c, i) => (
          <div key={i} className="list-item-row">
            <input placeholder="Company Name" value={c.name} onChange={(e) => setClient(i, 'name', e.target.value)} />
            <input placeholder="Logo URL (e.g. img/clients/logo.png)" value={c.logoUrl} onChange={(e) => setClient(i, 'logoUrl', e.target.value)} />
            {c.logoUrl && <img src={c.logoUrl} alt={c.name} className="logo-preview" />}
            <button className="btn-remove" onClick={() => removeClient(i)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <div className="editor-sub-section">
        <div className="sub-section-header">
          <h3>Buttons</h3>
          <button className="btn-add" onClick={addBtn}><Plus size={14} /> Add Button</button>
        </div>
        {form.buttons.map((b, i) => (
          <div key={i} className="list-item-row">
            <input placeholder="Label" value={b.label} onChange={(e) => setBtn(i, 'label', e.target.value)} />
            <input placeholder="Action" value={b.action} onChange={(e) => setBtn(i, 'action', e.target.value)} />
            <input placeholder="Link (optional)" value={b.link || ''} onChange={(e) => setBtn(i, 'link', e.target.value)} />
            <input placeholder="Style class" value={b.styleClass} onChange={(e) => setBtn(i, 'styleClass', e.target.value)} />
            <button className="btn-remove" onClick={() => removeBtn(i)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <div className="field-group">
        <label>Chat Triggers (comma-separated)</label>
        <input value={form.triggers} onChange={(e) => setField('triggers', e.target.value)} />
      </div>

      <button className={`btn-save ${saved ? 'saved' : ''}`} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        <Save size={15} /> {mutation.isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
