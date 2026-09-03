import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../../../api/content.api';
import { MediaPickerInput } from '../../../components/media/MediaPickerInput';
import { Save } from 'lucide-react';

interface GeneralData {
  siteName: string; siteTitle: string; verticalTextLeft: string;
  verticalTextRight: string; footerHintText: string; chatAvatarUrl: string; activeSkin: string;
}

const SKINS = ['multicolors.css','multicolors2.css','apricot-rouge.css','exotic-teal.css','funky-red.css','lucky-green.css','mustard-gold.css','royal-blue.css','spring-sky.css','strong-pink.css','super-orange.css','violet-punk.css','monochrome.css'];
const def: GeneralData = { siteName: '', siteTitle: '', verticalTextLeft: '', verticalTextRight: '', footerHintText: '', chatAvatarUrl: '', activeSkin: 'multicolors2.css' };

export function GeneralEditor() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<GeneralData>(def);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['content', 'general'],
    queryFn: () => contentApi.getByKey('general'),
    select: (r: Awaited<ReturnType<typeof contentApi.getByKey>>) =>
      r.data.data.data as unknown as GeneralData,
  });

  useEffect(() => { if (raw) setForm({ ...def, ...raw }); }, [raw]);

  const mutation = useMutation({
    mutationFn: () => contentApi.update('general', form as unknown as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content', 'general'] }); setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  const setField = (k: keyof GeneralData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (isLoading) return <div className="editor-loading">Loading…</div>;

  return (
    <div className="section-editor">
      <p className="editor-hint">These settings apply to the entire portfolio site.</p>

      <div className="editor-grid">
        <div className="field-group">
          <label>Site Name (used in page title)</label>
          <input value={form.siteName} onChange={(e) => setField('siteName', e.target.value)} placeholder="David Johnson" />
        </div>
        <div className="field-group">
          <label>Site Subtitle / Role</label>
          <input value={form.siteTitle} onChange={(e) => setField('siteTitle', e.target.value)} placeholder="Frontend Web Developer" />
        </div>
        <div className="field-group">
          <label>Vertical Text — Left Side</label>
          <input value={form.verticalTextLeft} onChange={(e) => setField('verticalTextLeft', e.target.value)} placeholder="david Johnson" />
        </div>
        <div className="field-group">
          <label>Vertical Text — Right Side</label>
          <input value={form.verticalTextRight} onChange={(e) => setField('verticalTextRight', e.target.value)} placeholder="web developer" />
        </div>
        <div className="field-group">
          <label>Chat Avatar URL</label>
          <MediaPickerInput value={form.chatAvatarUrl} onChange={(v) => setField('chatAvatarUrl', v)} placeholder="img/chat-avatar.png" />
        </div>
      </div>

      <div className="field-group" style={{ marginTop: 12 }}>
        <label>Footer Hint Text</label>
        <input value={form.footerHintText} onChange={(e) => setField('footerHintText', e.target.value)} placeholder="You can ask me about : age · cv · education…" />
      </div>

      <div className="field-group" style={{ marginTop: 12 }}>
        <label>Active Color Skin</label>
        <select value={form.activeSkin} onChange={(e) => setField('activeSkin', e.target.value)}>
          {SKINS.map((s) => <option key={s} value={s}>{s.replace('.css', '').replace(/-/g, ' ')}</option>)}
        </select>
      </div>

      <button className={`btn-save ${saved ? 'saved' : ''}`} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        <Save size={15} /> {mutation.isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
