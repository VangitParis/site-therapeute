type Props = {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;') // ⚠️ doit être en premier
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function TitreMultiligne({
  text,
  className = '',
  style = {},
  tag: Tag = 'h2',
}: Props) {
  const safeHTML = escapeHtml(text).replace(/\n/g, '<br />');

  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: safeHTML }} />;
}
