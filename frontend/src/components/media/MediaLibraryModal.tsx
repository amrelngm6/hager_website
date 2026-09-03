import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Folder, FileVideo, File as FileIcon, Upload, ChevronRight, Home, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { filesApi, FileEntry } from '../../api/files.api';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)$/i;

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  /** Restrict the browsable/uploadable file types shown in the grid. */
  accept?: 'image' | 'video' | 'all';
}

const joinPath = (dir: string, name: string) => (dir === '/' ? `/${name}` : `${dir}/${name}`);

export function MediaLibraryModal({ open, onClose, onSelect, accept = 'image' }: MediaLibraryModalProps) {
  const qc = useQueryClient();
  const [currentPath, setCurrentPath] = useState('/');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => filesApi.list(currentPath),
    select: (r: Awaited<ReturnType<typeof filesApi.list>>) => r.data.entries,
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => filesApi.upload(currentPath, files),
    onSuccess: (r) => {
      if (r.data.failed?.length) setError(r.data.failed.map((f) => `${f.name}: ${f.error}`).join(', '));
      else setError('');
      qc.invalidateQueries({ queryKey: ['files', currentPath] });
    },
    onError: () => setError('Upload failed'),
  });

  const breadcrumbs = useMemo(() => {
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ label: 'root', path: '/' }];
    let acc = '';
    for (const part of parts) {
      acc += `/${part}`;
      crumbs.push({ label: part, path: acc });
    }
    return crumbs;
  }, [currentPath]);

  const isMediaFile = (name: string) => {
    if (accept === 'image') return IMAGE_EXT.test(name);
    if (accept === 'video') return VIDEO_EXT.test(name);
    return IMAGE_EXT.test(name) || VIDEO_EXT.test(name);
  };

  const folders = entries.filter((e) => e.type === 'directory');
  const files = entries.filter((e) => e.type === 'file' && isMediaFile(e.name));

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFilesChosen = (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    uploadMutation.mutate(Array.from(fileList));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelect = (entry: FileEntry) => {
    onSelect(entry.path.replace(/^\//, ''));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Media Library" size="lg">
      <div className="flex flex-col gap-3">
        {/* Breadcrumbs + upload */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-1 text-sm text-gray-500">
            {breadcrumbs.map((c, i) => (
              <span key={c.path} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={13} className="text-gray-300" />}
                <button
                  className="hover:text-indigo-600 flex items-center gap-1"
                  onClick={() => setCurrentPath(c.path)}
                >
                  {i === 0 && <Home size={13} />}
                  {c.label}
                </button>
              </span>
            ))}
          </div>
          <Button size="sm" variant="secondary" onClick={handleUploadClick} loading={uploadMutation.isPending}>
            <Upload size={14} /> Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : undefined}
            className="hidden"
            onChange={(e) => handleFilesChosen(e.target.files)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Grid */}
        <div className="border border-gray-200 rounded-lg min-h-[320px] max-h-[420px] overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-16 text-gray-400">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="flex items-center justify-center h-full py-16 text-sm text-gray-400">
              This folder is empty.
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {folders.map((folder) => (
                <button
                  key={folder.path}
                  onClick={() => setCurrentPath(joinPath(currentPath, folder.name))}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200"
                  title={folder.name}
                >
                  <Folder size={32} className="text-indigo-400" />
                  <span className="text-xs text-gray-600 truncate w-full text-center">{folder.name}</span>
                </button>
              ))}
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => handleSelect(file)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200"
                  title={file.name}
                >
                  {IMAGE_EXT.test(file.name) ? (
                    <img
                      src={filesApi.viewUrl(file.path)}
                      alt={file.name}
                      className="w-full h-16 object-cover rounded-md border border-gray-200 bg-white"
                    />
                  ) : VIDEO_EXT.test(file.name) ? (
                    <FileVideo size={32} className="text-gray-400" />
                  ) : (
                    <FileIcon size={32} className="text-gray-400" />
                  )}
                  <span className="text-xs text-gray-600 truncate w-full text-center">{file.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
