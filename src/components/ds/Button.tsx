import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `accent` est réservé à « S'inscrire » : une seule fois par écran. */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
}

export function Button({ variant = 'primary', size = 'md', icon, className, children, ...rest }: Props) {
  const cls = ['np-btn', `np-btn--${variant}`, `np-btn--${size}`, className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      <span>{children}</span>
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 18} />}
    </button>
  );
}
