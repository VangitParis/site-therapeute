import Link from 'next/link';

interface UserLinkProps {
  href: string;
  uid?: string;
  isDev?: boolean;
  hash?: string;
  children: React.ReactNode;
  [key: string]: any; // pour className, style, target, rel, etc.
}

export default function UserLink({ href, uid, isDev, hash, children, ...props }: UserLinkProps) {
  const isExternal = href.startsWith('http');

  let url: URL;

  try {
    // on force une base pour URL relative si besoin
    url = new URL(href, isExternal ? href : 'http://localhost');
  } catch {
    url = new URL('http://localhost'); // fallback en cas d’erreur
  }

  // Ajoute les query params uniquement si ce n’est pas un lien complet (genre Calendly avec déjà ?)
  if (uid && !url.searchParams.has('uid')) url.searchParams.set('uid', uid);
  if (isDev && !url.searchParams.has('frdev')) url.searchParams.set('frdev', '1');

  let finalHref = url.pathname + url.search;
  if (hash) finalHref += `#${hash}`;

  if (isExternal) {
    return (
      <a href={url.toString()} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={finalHref} {...props}>
      {children}
    </Link>
  );
}
