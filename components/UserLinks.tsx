import Link from 'next/link';
import { useRouter } from 'next/router';

interface UserLinkProps {
  href: string;
  uid?: string;
  isDev?: boolean;
  hash?: string;
  children: React.ReactNode;
  [key: string]: any; // pour className, style, target, rel, etc.
}

export default function UserLink({ href, uid, isDev, hash, children, ...props }: UserLinkProps) {
  const router = useRouter();

  // Vérification de sécurité pour href
  if (!href || typeof href !== 'string' || href.trim() === '') {
    console.warn('UserLink: href is empty or invalid, rendering as span');
    return <span {...props}>{children}</span>;
  }

  const isExternal = href.startsWith('http');

  let url: URL;

  try {
    // on force une base pour URL relative si besoin
    url = new URL(href, isExternal ? href : 'http://localhost');
  } catch {
    console.warn('UserLink: Invalid URL, falling back to localhost');
    url = new URL('http://localhost'); // fallback en cas d'erreur
  }

  // Ajoute les query params uniquement si ce n'est pas un lien complet (genre Calendly avec déjà ?)
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

  // Gestionnaire de clic pour éviter la navigation vers la même URL
  const handleClick = (e: React.MouseEvent) => {
    const currentPath = router.asPath;
    if (currentPath === finalHref) {
      e.preventDefault();
      console.log('Navigation vers la même URL évitée:', finalHref);
      return;
    }

    // Appeler le onClick original s'il existe
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <Link href={finalHref} {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}
