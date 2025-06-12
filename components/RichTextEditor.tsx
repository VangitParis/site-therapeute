import { useRef, useEffect, useState } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (val: string) => void;
};

export default function RichTextEditor({ label, value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState('#000000');

  const format = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  useEffect(() => {
    if (ref.current && ref.current.innerHTML.trim() === '') {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div className="mb-6">
      <label className="block font-medium mb-2">{label}</label>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button onClick={() => format('bold')} className="px-2 py-1 border rounded font-bold">Gras</button>
        <button onClick={() => format('italic')} className="px-2 py-1 border rounded italic">Italique</button>
        <button onClick={() => format('underline')} className="px-2 py-1 border rounded underline">Souligné</button>
        <button onClick={() => format('removeFormat')} className="px-2 py-1 border rounded text-sm">🧹 Effacer</button>

        <select
          onChange={(e) => {
            format('fontSize', '7');
            document.querySelectorAll('font[size="7"]').forEach((el) => {
              el.removeAttribute('size');
              (el as HTMLElement).style.fontSize = e.target.value;
            });
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Taille</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
        </select>

        <input
          type="color"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            format('foreColor', e.target.value);
          }}
          className="w-8 h-8 border rounded cursor-pointer"
        />

        <button onClick={() => format('justifyLeft')} className="px-2 py-1 border rounded text-sm">↤</button>
        <button onClick={() => format('justifyCenter')} className="px-2 py-1 border rounded text-sm">↔</button>
        <button onClick={() => format('justifyRight')} className="px-2 py-1 border rounded text-sm">↦</button>

        <span className="text-sm text-gray-500 italic ml-2">Sélectionner le texte avant d’appliquer un style</span>
      </div>

      <div
        ref={ref}
        contentEditable
        className="border rounded p-3 min-h-[120px] bg-white whitespace-pre-wrap focus:outline focus:outline-indigo-400"
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
        suppressContentEditableWarning
      />
    </div>
  );
}
