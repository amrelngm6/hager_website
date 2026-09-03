import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { MediaLibraryModal } from './MediaLibraryModal';

interface MediaPickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accept?: 'image' | 'video' | 'all';
}

/** Text input for a media path, with a button that opens the media library to pick a file. */
export function MediaPickerInput({ value, onChange, placeholder, accept = 'image' }: MediaPickerInputProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="media-input-row">
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <button
        type="button"
        className="media-picker-btn"
        onClick={() => setOpen(true)}
        title="Browse media library"
      >
        <ImageIcon size={14} />
      </button>
      <MediaLibraryModal open={open} onClose={() => setOpen(false)} onSelect={onChange} accept={accept} />
    </div>
  );
}
