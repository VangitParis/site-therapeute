import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/live');
  }, [router]);

  return <p className="p-6">Redirection vers l’espace admin en cours...</p>;
}
