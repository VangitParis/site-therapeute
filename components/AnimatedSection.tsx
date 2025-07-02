import React from 'react';
import { useInView } from '../utils/useInView';

type Props = {
  children: React.ReactNode;
  animation: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function AnimatedSection({
  children,
  animation,
  className = '',
  style = {},
}: Props) {
  const [ref, visible] = useInView();

  return (
    <section
      ref={ref}
      className={`${className} ${visible ? animation : 'opacity-0'} transition-all duration-1000`}
      style={style}
    >
      {children}
    </section>
  );
}
