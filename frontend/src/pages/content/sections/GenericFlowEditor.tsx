import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../../../api/content.api';
import { Save, Plus, Trash2 } from 'lucide-react';

interface ContentBlock {
  tag: string; className?: string; content?: string; items?: string[];
}
interface ButtonItem { label: string; action: string; link?: string; styleClass: string }
interface GenericFlowData { blocks: ContentBlock[]; buttons: ButtonItem[]; triggers: string }

const def: GenericFlowData = { blocks: [], buttons: [], triggers: '' };

interface Props { sectionKey: string }

export function GenericFlowEditor({ sectionKey }: Props) {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<GenericFlowData>(def);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['content', sectionKey],
    queryFn: () => contentApi.getByKey(sectionKey),
    select: (r: Awaited<ReturnType<typeof contentApi.getByKey>>) =>
      r.data.data.data as unknown as GenericFlowData,
  });

  useEffect(() => { if (raw) setForm({ ...def, ...raw }); }, [raw]);

  const mutation = useMutation({
    mutationFn: () => contentApi.update(sectionKey, form as unknown as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content', sectionKey] }); setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  const addBlock = (tag: string) => setForm((f) => ({ ...f, blocks: [...f.blocks, tag === 'UL' ? { tag, items: [''] } : { tag, content: '' }] }));
  const removeBlock = (i: number) => setForm((f) => ({ ...f, blocks: f.blocks.filter((_, idx) => idx !== i) }));
  const setBlockContent = (i: number, v: string) => setForm((f) => { const blocks = [...f.blocks]; blocks[i] = { ...blocks[i], content: v }; return { ...f, blocks }; });
  const setBlockClass = (i: number, v: string) => setForm((f) => { const blocks = [...f.blocks]; blocks[i] = { ...blocks[i], className: v }; return { ...f, blocks }; });
  const setListItem = (bi: number, li: number, v: string) => setForm((f) => { const blocks = [...f.blocks]; const items = [...(blocks[bi].items || [])]; items[li] = v; blocks[bi] = { ...blocks[bi], items }; return { ...f, blocks }; });
  const addListItem = (bi: number) => setForm((f) => { const blocks = [...f.blocks]; blocks[bi] = { ...blocks[bi], items: [...(blocks[bi].items || []), ''] }; return { ...f, blocks }; });
  const removeListItem = (bi: number, li: number) => setForm((f) => { const blocks = [...f.blocks]; blocks[bi] = { ...blocks[bi], items: (blocks[bi].items || []).filter((_, i) => i !== li) }; return { ...f, blocks }; });
  const setBtn = (i: number, k: keyof ButtonItem, v: string) => setForm((f) => { const a = [...f.buttons]; a[i] = { ...a[i], [k]: v }; return { ...f, buttons: a }; });
  const addBtn = () => setForm((f) => ({ ...f, buttons: [...f.buttons, { label: '', action: '', styleClass: '' }] }));
  const removeBtn = (i: number) => setForm((f) => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));

  if (isLoading) return <div className="editor-loading">Loading…</div>;

  return (
    <div className="section-editor">
      <div className="editor-sub-section">
        <div className="sub-section-header">
          <h3>Content Blocks</h3>
          <div className="btn-group">
            <button className="btn-add" onClick={() => addBlock('P')}><Plus size={13} /> Paragraph</button>
            <button className="btn-add" onClick={() => addBlock('DIV')}><Plus size={13} /> Div</button>
            <button className="btn-add" onClick={() => addBlock('UL')}><Plus size={13} /> List</button>
          </div>
        </div>

        {form.blocks.map((block, bi) => (
          <div key={bi} className="nested-card">
            <div className="nested-card-header">
              <span className="tag-badge">{block.tag}</span>
              {block.tag === 'DIV' && (
                <input className="class-input" placeholder="CSS class (e.g. list-with-icons)" value={block.className || ''} onChange={(e) => setBlockClass(bi, e.target.value)} />
              )}
              <button className="btn-remove" onClick={() => removeBlock(bi)}><Trash2 size={14} /></button>
            </div>

            {block.tag === 'UL' ? (
              <div className="nested-items">
                {(block.items || []).map((item, li) => (
                  <div key={li} className="list-item-row">
                    <textarea rows={2} value={item} onChange={(e) => setListItem(bi, li, e.target.value)} placeholder="List item (HTML allowed)" />
                    <button className="btn-remove" onClick={() => removeListItem(bi, li)}><Trash2 size={13} /></button>
                  </div>
                ))}
                <button className="btn-add-inner" onClick={() => addListItem(bi)}><Plus size={13} /> Add Item</button>
              </div>
            ) : (
              <div className="field-group" style={{ marginTop: 8 }}>
                <textarea rows={3} value={block.content || ''} onChange={(e) => setBlockContent(bi, e.target.value)} placeholder="Content (HTML allowed)" />
              </div>
            )}
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
            <input placeholder="Action (e.g. about)" value={b.action} onChange={(e) => setBtn(i, 'action', e.target.value)} />
            <input placeholder="Link URL (optional)" value={b.link || ''} onChange={(e) => setBtn(i, 'link', e.target.value)} />
            <input placeholder="Style class" value={b.styleClass} onChange={(e) => setBtn(i, 'styleClass', e.target.value)} />
            <button className="btn-remove" onClick={() => removeBtn(i)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <div className="field-group">
        <label>Chat Triggers (comma-separated keywords)</label>
        <input value={form.triggers} onChange={(e) => setForm((f) => ({ ...f, triggers: e.target.value }))} placeholder="hi, hello, hey, greeting" />
      </div>

      <button className={`btn-save ${saved ? 'saved' : ''}`} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        <Save size={15} /> {mutation.isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
