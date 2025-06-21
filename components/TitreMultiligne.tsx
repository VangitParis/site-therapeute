import React from 'react';

type Props = {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
};

export default function TitreMultiligne({
  text,
  className = '',
  style = {},
  tag: Tag = 'h2',
}: Props) {
  return (
    <Tag
      className={className}
      style={style}
      dangerouslySetInnerHTML={{
        __html: text.replace(/\n/g, '<br />'),
      }}
    />
  );
}
