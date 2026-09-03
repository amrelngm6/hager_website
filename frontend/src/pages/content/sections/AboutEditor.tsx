import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../../../api/content.api';
import { Save, Plus, Trash2 } from 'lucide-react';

interface StatItem { icon: string; text: string }
interface ButtonItem { label: string; action: string; link?: string; styleClass: string }
interface AboutData { bio: string; stats: StatItem[]; buttons: ButtonItem[]; triggers: string }

const def: AboutData = { bio: '', stats: [], buttons: [], triggers: '' };

export function AboutEditor() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<AboutData>(def);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['content', 'about'],
    queryFn: () => contentApi.getByKey('about'),
    select: (r: Awaited<ReturnType<typeof contentApi.getByKey>>) =>
      r.data.data.data as unknown as AboutData,
  });

  useEffect(() => { if (raw) setForm({ ...def, ...raw }); }, [raw]);

  const mutation = useMutation({
    mutationFn: () => contentApi.update('about', form as unknown as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content', 'about'] }); setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  const setField = (k: keyof AboutData, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setStat = (i: number, k: keyof StatItem, v: string) => setForm((f) => { const a = [...f.stats]; a[i] = { ...a[i], [k]: v }; return { ...f, stats: a }; });
  const addStat = () => setForm((f) => ({ ...f, stats: [...f.stats, { icon: '', text: '' }] }));
  const removeStat = (i: number) => setForm((f) => ({ ...f, stats: f.stats.filter((_, idx) => idx !== i) }));
  const setBtn = (i: number, k: keyof ButtonItem, v: string) => setForm((f) => { const a = [...f.buttons]; a[i] = { ...a[i], [k]: v }; return { ...f, buttons: a }; });
  const addBtn = () => setForm((f) => ({ ...f, buttons: [...f.buttons, { label: '', action: '', styleClass: '' }] }));
  const removeBtn = (i: number) => setForm((f) => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));

  if (isLoading) return <div className="editor-loading">Loading…</div>;

  return (
    <div className="section-editor">
      <div className="field-group">
        <label>Bio (HTML allowed)</label>
        <textarea rows={4} value={form.bio} onChange={(e) => setField('bio', e.target.value)} />
      </div>

      <div className="editor-sub-section">
        <div className="sub-section-header">
          <h3>Stats / Highlights</h3>
          <button className="btn-add" onClick={addStat}><Plus size={14} /> Add Stat</button>
        </div>
        {form.stats.map((s, i) => (
          <div key={i} className="list-item-row">
            <input placeholder="Icon class (e.g. fa-regular fa-star)" value={s.icon} onChange={(e) => setStat(i, 'icon', e.target.value)} />
            <input placeholder="Text" value={s.text} onChange={(e) => setStat(i, 'text', e.target.value)} />
            <button className="btn-remove" onClick={() => removeStat(i)}><Trash2 size={14} /></button>
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
            <input placeholder="Style class" value={b.styleClass} onChange={(e) => setBtn(i, 'styleClass', e.target.value)} />
            <button className="btn-remove" onClick={() => removeBtn(i)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <div className="field-group">
        <label>Chat Triggers (comma-separated keywords)</label>
        <input value={form.triggers} onChange={(e) => setField('triggers', e.target.value)} />
      </div>

      <button className={`btn-save ${saved ? 'saved' : ''}`} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        <Save size={15} /> {mutation.isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
