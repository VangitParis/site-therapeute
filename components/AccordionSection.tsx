import { useState, ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export default function AccordionSection({ title, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded shadow-sm mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 font-semibold"
      >
        <span>{title}</span>
        <span>{open ? '▼' : '▶'}</span>
      </button>

      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}
