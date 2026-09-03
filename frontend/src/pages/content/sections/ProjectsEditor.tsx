import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../../../api/content.api';
import { MediaPickerInput } from '../../../components/media/MediaPickerInput';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';

interface ProjectItem {
  title: string; link: string; image: string;
  mediaType: 'image' | 'gallery' | 'youtube' | 'video';
  summary: string; gallery?: string[]; youtubeId?: string; videoUrl?: string;
}
interface ButtonItem { label: string; action: string; styleClass: string }
interface ProjectsData { intro: string; items: ProjectItem[]; globalButtons: ButtonItem[]; finalButtons: ButtonItem[]; triggers: string }

const def: ProjectsData = { intro: '', items: [], globalButtons: [], finalButtons: [], triggers: '' };
const mediaTypes = ['image', 'gallery', 'youtube', 'video'] as const;

export function ProjectsEditor() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<ProjectsData>(def);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['content', 'projects'],
    queryFn: () => contentApi.getByKey('projects'),
    select: (r: Awaited<ReturnType<typeof contentApi.getByKey>>) =>
      r.data.data.data as unknown as ProjectsData,
  });

  useEffect(() => { if (raw) setForm({ ...def, ...raw }); }, [raw]);

  const mutation = useMutation({
    mutationFn: () => contentApi.update('projects', form as unknown as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content', 'projects'] }); setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  const setField = (k: keyof ProjectsData, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setProject = (i: number, k: keyof ProjectItem, v: string) => setForm((f) => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items }; });
  const addProject = () => setForm((f) => ({ ...f, items: [...f.items, { title: '', link: '', image: '', mediaType: 'image', summary: '' }] }));
  const removeProject = (i: number) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setGalleryUrl = (pi: number, gi: number, v: string) => setForm((f) => { const items = [...f.items]; const gallery = [...(items[pi].gallery || [])]; gallery[gi] = v; items[pi] = { ...items[pi], gallery }; return { ...f, items }; });
  const addGalleryUrl = (pi: number) => setForm((f) => { const items = [...f.items]; items[pi] = { ...items[pi], gallery: [...(items[pi].gallery || []), ''] }; return { ...f, items }; });
  const removeGalleryUrl = (pi: number, gi: number) => setForm((f) => { const items = [...f.items]; items[pi] = { ...items[pi], gallery: (items[pi].gallery || []).filter((_, i) => i !== gi) }; return { ...f, items }; });
  const setBtn = (type: 'globalButtons' | 'finalButtons', i: number, k: keyof ButtonItem, v: string) => setForm((f) => { const a = [...f[type]]; a[i] = { ...a[i], [k]: v }; return { ...f, [type]: a }; });
  const addBtn = (type: 'globalButtons' | 'finalButtons') => setForm((f) => ({ ...f, [type]: [...f[type], { label: '', action: '', styleClass: '' }] }));
  const removeBtn = (type: 'globalButtons' | 'finalButtons', i: number) => setForm((f) => ({ ...f, [type]: f[type].filter((_, idx) => idx !== i) }));

  if (isLoading) return <div className="editor-loading">Loading…</div>;

  return (
    <div className="section-editor">
      <div className="field-group">
        <label>Intro Text (HTML allowed)</label>
        <textarea rows={3} value={form.intro} onChange={(e) => setField('intro', e.target.value)} />
      </div>

      <div className="editor-sub-section">
        <div className="sub-section-header">
          <h3>Projects</h3>
          <button className="btn-add" onClick={addProject}><Plus size={14} /> Add Project</button>
        </div>
        {form.items.map((proj, i) => (
          <div key={i} className="nested-card">
            <div className="nested-card-header">
              <GripVertical size={16} className="drag-handle" />
              <span className="card-index">#{i + 1}</span>
              <button className="btn-remove" onClick={() => removeProject(i)}><Trash2 size={14} /></button>
            </div>
            <div className="editor-grid">
              <div className="field-group"><label>Title</label><input value={proj.title} onChange={(e) => setProject(i, 'title', e.target.value)} /></div>
              <div className="field-group"><label>Link (optional)</label><input value={proj.link} onChange={(e) => setProject(i, 'link', e.target.value)} placeholder="https://…" /></div>
              <div className="field-group"><label>Thumbnail Image URL</label><MediaPickerInput value={proj.image} onChange={(v) => setProject(i, 'image', v)} /></div>
              <div className="field-group">
                <label>Media Type</label>
                <select value={proj.mediaType} onChange={(e) => setProject(i, 'mediaType', e.target.value)}>
                  {mediaTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="field-group"><label>Summary</label><textarea rows={2} value={proj.summary} onChange={(e) => setProject(i, 'summary', e.target.value)} /></div>
            {proj.mediaType === 'gallery' && (
              <div className="nested-items">
                <label>Gallery Image URLs</label>
                {(proj.gallery || []).map((url, gi) => (
                  <div key={gi} className="list-item-row">
                    <MediaPickerInput value={url} onChange={(v) => setGalleryUrl(i, gi, v)} placeholder="img/projects/big.jpg" />
                    <button className="btn-remove" onClick={() => removeGalleryUrl(i, gi)}><Trash2 size={13} /></button>
                  </div>
                ))}
                <button className="btn-add-inner" onClick={() => addGalleryUrl(i)}><Plus size={13} /> Add Image</button>
              </div>
            )}
            {proj.mediaType === 'youtube' && (
              <div className="field-group"><label>YouTube Video ID</label><input value={proj.youtubeId || ''} onChange={(e) => setProject(i, 'youtubeId', e.target.value)} placeholder="SjJhuZQlkbA" /></div>
            )}
            {proj.mediaType === 'video' && (
              <div className="field-group"><label>MP4 Video URL</label><MediaPickerInput value={proj.videoUrl || ''} onChange={(v) => setProject(i, 'videoUrl', v)} placeholder="img/video.mp4" accept="video" /></div>
            )}
          </div>
        ))}
      </div>

      {(['globalButtons', 'finalButtons'] as const).map((type) => (
        <div key={type} className="editor-sub-section">
          <div className="sub-section-header">
            <h3>{type === 'globalButtons' ? 'Repeating Button (after each project)' : 'Final Buttons (after last project)'}</h3>
            <button className="btn-add" onClick={() => addBtn(type)}><Plus size={14} /> Add</button>
          </div>
          {form[type].map((b, i) => (
            <div key={i} className="list-item-row">
              <input placeholder="Label" value={b.label} onChange={(e) => setBtn(type, i, 'label', e.target.value)} />
              <input placeholder="Action" value={b.action} onChange={(e) => setBtn(type, i, 'action', e.target.value)} />
              <input placeholder="Style class" value={b.styleClass} onChange={(e) => setBtn(type, i, 'styleClass', e.target.value)} />
              <button className="btn-remove" onClick={() => removeBtn(type, i)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      ))}

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
