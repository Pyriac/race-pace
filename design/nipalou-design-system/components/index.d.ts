import type * as React from 'react';

export type IconName = 'arrow-right' | 'clock' | 'mountain' | 'map-pin' | 'users' | 'flag' | 'info' | 'circle-check' | 'triangle-alert' | 'circle-x';

export interface IconProps {
  /** Pictogram name (Lucide-style strokes on a 24px grid). */
  name: IconName;
  /** Pixel size, default 20. */
  size?: number;
  strokeWidth?: number;
  /** Accessible label; without it the icon is decorative (aria-hidden). */
  title?: string;
  className?: string;
}
export declare function Icon(props: IconProps): React.ReactElement;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = brand green (default); accent = brown "S'inscrire", once per screen; secondary = outlined; ghost = text only. */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** Renders an <a> instead of a <button>. */
  href?: string;
  /** Trailing icon, usually 'arrow-right'. */
  icon?: IconName;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface TagProps {
  tone?: 'neutral' | 'brand' | 'accent' | 'earth' | 'highlight' | 'info';
  icon?: IconName;
  children?: React.ReactNode;
  className?: string;
}
export declare function Tag(props: TagProps): React.ReactElement;

export interface NoticeProps {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  /** Defaults to the tone's word: Info, Confirmé, Attention, Erreur. */
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}
export declare function Notice(props: NoticeProps): React.ReactElement;

export interface BibProps {
  number: number | string;
  /** Race line under the number, e.g. "53 km". */
  race?: string;
  /** Band text, default "Tour du Nipalou". */
  event?: string;
  size?: 'sm' | 'md';
  className?: string;
}
export declare function Bib(props: BibProps): React.ReactElement;

export interface RaceDetail { label: string; value: React.ReactNode; icon?: IconName }
export interface RaceTag { label: string; tone?: TagProps['tone'] }
export interface RaceCardProps {
  distance: number | string;
  unit?: string;
  title: string;
  /** Colour of the distance figure: brand (trails), accent, earth (youth races), info (hikes). */
  tone?: 'brand' | 'accent' | 'earth' | 'info';
  details?: RaceDetail[];
  tags?: RaceTag[];
  ctaLabel?: string;
  ctaVariant?: ButtonProps['variant'];
  href?: string;
  onCta?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
}
export declare function RaceCard(props: RaceCardProps): React.ReactElement;

export interface ElevationMarker { km: number; label: string }
export interface ElevationProfileProps {
  /** [km, altitude in metres] pairs. */
  points: Array<[number, number]>;
  markers?: ElevationMarker[];
  title?: string;
  /** Plot height in px, default 240. */
  height?: number;
  /** Distance, D+, D−, max altitude strip, computed from points. Default true. */
  showStats?: boolean;
  className?: string;
}
export declare function ElevationProfile(props: ElevationProfileProps): React.ReactElement;

export interface ResultRow { rank?: number; bib: number | string; name: string; category: string; club?: string; time: string }
export interface ResultsTableProps {
  rows: ResultRow[];
  caption?: string;
  /** Medal discs on ranks 1–3. Default true. */
  podium?: boolean;
  className?: string;
}
export declare function ResultsTable(props: ResultsTableProps): React.ReactElement;

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}
export declare function TextField(props: TextFieldProps): React.ReactElement;

declare global {
  interface Window {
    Nipalou: {
      Button: typeof Button; Tag: typeof Tag; Notice: typeof Notice; Bib: typeof Bib; RaceCard: typeof RaceCard;
      ElevationProfile: typeof ElevationProfile; ResultsTable: typeof ResultsTable; TextField: typeof TextField; Icon: typeof Icon;
    };
  }
}
