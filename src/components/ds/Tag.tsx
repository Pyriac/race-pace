import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface Props {
  tone?: 'neutral' | 'brand' | 'accent' | 'earth' | 'highlight' | 'info';
  icon?: IconName;
  children: ReactNode;
}

export function Tag({ tone = 'neutral', icon, children }: Props) {
  return (
    <span className={`np-tag np-tag--${tone}`}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}
