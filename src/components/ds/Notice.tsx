import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

const TONES: Record<string, { icon: IconName; word: string }> = {
  info: { icon: 'info', word: 'Info' },
  success: { icon: 'circle-check', word: 'Confirmé' },
  warning: { icon: 'triangle-alert', word: 'Attention' },
  danger: { icon: 'circle-x', word: 'Erreur' },
};

interface Props {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children?: ReactNode;
}

export function Notice({ tone = 'info', title, children }: Props) {
  const t = TONES[tone]!;
  return (
    <div className={`np-notice np-notice--${tone}`}>
      <Icon name={t.icon} size={20} className="np-notice__icon" />
      <div className="np-notice__body">
        <p className="np-notice__title">{title ?? t.word}</p>
        {children && <div className="np-notice__text">{children}</div>}
      </div>
    </div>
  );
}
