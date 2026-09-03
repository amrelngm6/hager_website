import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../../../api/content.api';
import { Save, Plus, Trash2 } from 'lucide-react';

interface DirectItem { label: string; icon: string; value: string }
interface SocialItem { icon: string; url: string; class: string }
interface ButtonItem { label: string; action: string; styleClass: string }
interface ContactData { intro: string; directContact: DirectItem[]; socialLinks: SocialItem[]; buttons: ButtonItem[]; triggers: string }

const def: ContactData = { intro: '', directContact: [], socialLinks: [], buttons: [], triggers: '' };

export function ContactEditor() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<ContactData>(def);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['content', 'contact'],
    queryFn: () => contentApi.getByKey('contact'),
    select: (r: Awaited<ReturnType<typeof contentApi.getByKey>>) =>
      r.data.data.data as unknown as ContactData,
  });

  useEffect(() => { if (raw) setForm({ ...def, ...raw }); }, [raw]);

  const mutation = useMutation({
    mutationFn: () => contentApi.update('contact', form as unknown as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content', 'contact'] }); setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  const setField = (k: keyof ContactData, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setDirect = (i: number, k: keyof DirectItem, v: string) => setForm((f) => { const a = [...f.directContact]; a[i] = { ...a[i], [k]: v }; return { ...f, directContact: a }; });
  const addDirect = () => setForm((f) => ({ ...f, directContact: [...f.directContact, { label: '', icon: '', value: '' }] }));
  const removeDirect = (i: number) => setForm((f) => ({ ...f, directContact: f.directContact.filter((_, idx) => idx !== i) }));
  const setSocial = (i: number, k: keyof SocialItem, v: string) => setForm((f) => { const a = [...f.socialLinks]; a[i] = { ...a[i], [k]: v }; return { ...f, socialLinks: a }; });
  const addSocial = () => setForm((f) => ({ ...f, socialLinks: [...f.socialLinks, { icon: '', url: '', class: '' }] }));
  const removeSocial = (i: number) => setForm((f) => ({ ...f, socialLinks: f.socialLinks.filter((_, idx) => idx !== i) }));
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
          <h3>Direct Contact</h3>
          <button className="btn-add" onClick={addDirect}><Plus size={14} /> Add Row</button>
        </div>
        {form.directContact.map((d, i) => (
          <div key={i} className="list-item-row">
            <input placeholder="Label (e.g. Email :)" value={d.label} onChange={(e) => setDirect(i, 'label', e.target.value)} />
            <input placeholder="Icon class (e.g. fa-regular fa-envelope-open)" value={d.icon} onChange={(e) => setDirect(i, 'icon', e.target.value)} />
            <input placeholder="Value (e.g. hello@website.com)" value={d.value} onChange={(e) => setDirect(i, 'value', e.target.value)} />
            <button className="btn-remove" onClick={() => removeDirect(i)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <div className="editor-sub-section">
        <div className="sub-section-header">
          <h3>Social Links</h3>
          <button className="btn-add" onClick={addSocial}><Plus size={14} /> Add Link</button>
        </div>
        {form.socialLinks.map((s, i) => (
          <div key={i} className="list-item-row">
            <input placeholder="Icon class (e.g. fa-brands fa-linkedin-in)" value={s.icon} onChange={(e) => setSocial(i, 'icon', e.target.value)} />
            <input placeholder="URL" value={s.url} onChange={(e) => setSocial(i, 'url', e.target.value)} />
            <input placeholder="CSS class (e.g. linkedin)" value={s.class} onChange={(e) => setSocial(i, 'class', e.target.value)} />
            <button className="btn-remove" onClick={() => removeSocial(i)}><Trash2 size={14} /></button>
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
        <label>Chat Triggers (comma-separated)</label>
        <input value={form.triggers} onChange={(e) => setField('triggers', e.target.value)} />
      </div>

      <button className={`btn-save ${saved ? 'saved' : ''}`} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        <Save size={15} /> {mutation.isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
