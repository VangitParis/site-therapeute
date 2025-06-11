import { useRef } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (val: string) => void;
};

export default function RichTextEditor({ label, value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const format = (command: string) => {
    document.execCommand(command, false);
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  };

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">{label}</label>

      <div className="flex gap-2 flex-wrap items-center mb-2">
        <button type="button" onClick={() => format('bold')} className="px-2 py-1 border rounded font-bold">Gras</button>
        <button type="button" onClick={() => format('italic')} className="px-2 py-1 border rounded italic">Italique</button>
        <button type="button" onClick={() => format('removeFormat')} className="px-2 py-1 border rounded text-sm">🧹 Effacer</button>
        <p className="text-sm text-gray-500 italic ml-2">Sélectionnez un mot pour activer ou désactiver un style.</p>
      </div>

      <div
        ref={ref}
        contentEditable
        className="border rounded p-2 min-h-[120px] whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
      />
    </div>
  );
}
