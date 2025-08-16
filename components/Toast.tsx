// components/Toast.tsx
import { useEffect, useState } from 'react';

export default function Toast({
  message,
  type = 'error',
  duration = 4000,
}: {
  message: string;
  type?: 'error' | 'success';
  duration?: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const color = type === 'error' ? 'bg-red-500' : 'bg-green-500';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${color}`}
    >
      {message}
    </div>
  );
}
