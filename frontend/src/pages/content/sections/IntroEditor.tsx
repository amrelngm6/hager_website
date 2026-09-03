import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../../../api/content.api';
import { MediaPickerInput } from '../../../components/media/MediaPickerInput';
import { Save, Plus, Trash2 } from 'lucide-react';

interface IntroButton { label: string; action: string; styleClass: string }
interface IntroData {
  greeting: string; name: string; title: string;
  imageUrl: string; imageAlt: string;
  quoteText: string; quoteAuthor: string;
  buttons: IntroButton[];
}

const def: IntroData = { greeting: '', name: '', title: '', imageUrl: '', imageAlt: '', quoteText: '', quoteAuthor: '', buttons: [] };

export function IntroEditor() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<IntroData>(def);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['content', 'intro'],
    queryFn: () => contentApi.getByKey('intro'),
    select: (r: Awaited<ReturnType<typeof contentApi.getByKey>>) =>
      r.data.data.data as unknown as IntroData,
  });

  useEffect(() => { if (raw) setForm({ ...def, ...raw }); }, [raw]);

  const mutation = useMutation({
    mutationFn: () => contentApi.update('intro', form as unknown as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content', 'intro'] }); setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  const setField = (k: keyof IntroData, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setButton = (i: number, k: keyof IntroButton, v: string) => setForm((f) => { const buttons = [...f.buttons]; buttons[i] = { ...buttons[i], [k]: v }; return { ...f, buttons }; });
  const addButton = () => setForm((f) => ({ ...f, buttons: [...f.buttons, { label: '', action: '', styleClass: '' }] }));
  const removeButton = (i: number) => setForm((f) => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));

  if (isLoading) return <div className="editor-loading">Loading…</div>;

  return (
    <div className="section-editor">
      <div className="editor-grid">
        <div className="field-group">
          <label>Greeting Text</label>
          <input value={form.greeting} onChange={(e) => setField('greeting', e.target.value)} placeholder="Hello!" />
        </div>
        <div className="field-group">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="David" />
        </div>
        <div className="field-group">
          <label>Title / Role</label>
          <input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Web Developer" />
        </div>
        <div className="field-group">
          <label>Avatar Image URL</label>
          <MediaPickerInput value={form.imageUrl} onChange={(v) => setField('imageUrl', v)} placeholder="img/avatar-intro.png" />
        </div>
        <div className="field-group">
          <label>Image Alt Text</label>
          <input value={form.imageAlt} onChange={(e) => setField('imageAlt', e.target.value)} placeholder="David Johnson" />
        </div>
      </div>

      <div className="field-group" style={{ marginTop: 16 }}>
        <label>Quote Text</label>
        <textarea rows={3} value={form.quoteText} onChange={(e) => setField('quoteText', e.target.value)} />
      </div>
      <div className="field-group">
        <label>Quote Author</label>
        <input value={form.quoteAuthor} onChange={(e) => setField('quoteAuthor', e.target.value)} placeholder="Marc Hawkins - Adobe Director" />
      </div>

      <div className="editor-sub-section">
        <div className="sub-section-header">
          <h3>Call-to-Action Buttons</h3>
          <button className="btn-add" onClick={addButton}><Plus size={14} /> Add Button</button>
        </div>
        {form.buttons.map((btn, i) => (
          <div key={i} className="list-item-row">
            <input placeholder="Label" value={btn.label} onChange={(e) => setButton(i, 'label', e.target.value)} />
            <input placeholder="Action (e.g. about)" value={btn.action} onChange={(e) => setButton(i, 'action', e.target.value)} />
            <input placeholder="Style class (e.g. btn-secondary)" value={btn.styleClass} onChange={(e) => setButton(i, 'styleClass', e.target.value)} />
            <button className="btn-remove" onClick={() => removeButton(i)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <button className={`btn-save ${saved ? 'saved' : ''}`} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        <Save size={15} /> {mutation.isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
