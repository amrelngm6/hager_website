import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../../../api/content.api';
import { Save, Plus, Trash2, Star } from 'lucide-react';

interface SkillItem { name: string; rating: number }
interface SkillCategory { name: string; icon: string; skills: SkillItem[] }
interface ButtonItem { label: string; action: string; link?: string; styleClass: string }
interface SkillsData { intro: string; categories: SkillCategory[]; buttons: ButtonItem[]; triggers: string }

const def: SkillsData = { intro: '', categories: [], buttons: [], triggers: '' };

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={`star ${n <= value ? 'active' : ''}`} onClick={() => onChange(n)}>
          <Star size={14} />
        </button>
      ))}
    </div>
  );
}

export function SkillsEditor() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<SkillsData>(def);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['content', 'skills'],
    queryFn: () => contentApi.getByKey('skills'),
    select: (r: Awaited<ReturnType<typeof contentApi.getByKey>>) =>
      r.data.data.data as unknown as SkillsData,
  });

  useEffect(() => { if (raw) setForm({ ...def, ...raw }); }, [raw]);

  const mutation = useMutation({
    mutationFn: () => contentApi.update('skills', form as unknown as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content', 'skills'] }); setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  const setField = (k: keyof SkillsData, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const addCategory = () => setForm((f) => ({ ...f, categories: [...f.categories, { name: '', icon: '', skills: [] }] }));
  const removeCategory = (ci: number) => setForm((f) => ({ ...f, categories: f.categories.filter((_, i) => i !== ci) }));
  const setCatField = (ci: number, k: 'name' | 'icon', v: string) => setForm((f) => { const cats = [...f.categories]; cats[ci] = { ...cats[ci], [k]: v }; return { ...f, categories: cats }; });
  const addSkill = (ci: number) => setForm((f) => { const cats = [...f.categories]; cats[ci] = { ...cats[ci], skills: [...cats[ci].skills, { name: '', rating: 3 }] }; return { ...f, categories: cats }; });
  const removeSkill = (ci: number, si: number) => setForm((f) => { const cats = [...f.categories]; cats[ci] = { ...cats[ci], skills: cats[ci].skills.filter((_, i) => i !== si) }; return { ...f, categories: cats }; });
  const setSkill = (ci: number, si: number, k: keyof SkillItem, v: string | number) => setForm((f) => { const cats = [...f.categories]; const skills = [...cats[ci].skills]; skills[si] = { ...skills[si], [k]: v }; cats[ci] = { ...cats[ci], skills }; return { ...f, categories: cats }; });
  const addBtn = () => setForm((f) => ({ ...f, buttons: [...f.buttons, { label: '', action: '', styleClass: '' }] }));
  const removeBtn = (i: number) => setForm((f) => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));
  const setBtn = (i: number, k: keyof ButtonItem, v: string) => setForm((f) => { const a = [...f.buttons]; a[i] = { ...a[i], [k]: v }; return { ...f, buttons: a }; });

  if (isLoading) return <div className="editor-loading">Loading…</div>;

  return (
    <div className="section-editor">
      <div className="field-group">
        <label>Intro Text (HTML allowed)</label>
        <textarea rows={3} value={form.intro} onChange={(e) => setField('intro', e.target.value)} />
      </div>

      <div className="editor-sub-section">
        <div className="sub-section-header">
          <h3>Skill Categories</h3>
          <button className="btn-add" onClick={addCategory}><Plus size={14} /> Add Category</button>
        </div>
        {form.categories.map((cat, ci) => (
          <div key={ci} className="nested-card">
            <div className="nested-card-header">
              <div className="editor-grid" style={{ flex: 1 }}>
                <input placeholder="Category Name (e.g. Frontend)" value={cat.name} onChange={(e) => setCatField(ci, 'name', e.target.value)} />
                <input placeholder="Icon class (e.g. fa-solid fa-laptop)" value={cat.icon} onChange={(e) => setCatField(ci, 'icon', e.target.value)} />
              </div>
              <button className="btn-remove" onClick={() => removeCategory(ci)}><Trash2 size={14} /></button>
            </div>
            <div className="nested-items">
              {cat.skills.map((sk, si) => (
                <div key={si} className="skill-row">
                  <input placeholder="Skill name" value={sk.name} onChange={(e) => setSkill(ci, si, 'name', e.target.value)} />
                  <StarRating value={sk.rating} onChange={(n) => setSkill(ci, si, 'rating', n)} />
                  <button className="btn-remove" onClick={() => removeSkill(ci, si)}><Trash2 size={13} /></button>
                </div>
              ))}
              <button className="btn-add-inner" onClick={() => addSkill(ci)}><Plus size={13} /> Add Skill</button>
            </div>
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
