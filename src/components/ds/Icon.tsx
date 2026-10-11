// Portage de design/nipalou-design-system/components/bundle.js (Icon).
// Pictogrammes au trait façon Lucide, grille 24 px, trait 1,75 px.

type Shape = ['path', { d: string }] | ['circle', { cx: number; cy: number; r: number }];

const PATHS = {
  'arrow-right': [['path', { d: 'M5 12h14' }], ['path', { d: 'm12 5 7 7-7 7' }]],
  clock: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 6v6l4 2' }]],
  mountain: [['path', { d: 'm8 3 4 8 5-5 5 15H2L8 3z' }]],
  'map-pin': [['path', { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' }], ['circle', { cx: 12, cy: 10, r: 3 }]],
  flag: [['path', { d: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z' }], ['path', { d: 'M4 22v-7' }]],
  info: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 16v-4' }], ['path', { d: 'M12 8h.01' }]],
  'circle-check': [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'm9 12 2 2 4-4' }]],
  'triangle-alert': [
    ['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }],
    ['path', { d: 'M12 9v4' }],
    ['path', { d: 'M12 17h.01' }],
  ],
  'circle-x': [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'm15 9-6 6' }], ['path', { d: 'm9 9 6 6' }]],
  // Ajouts au jeu du design system (Lucide) : export et pente des sections.
  'trend-up': [['path', { d: 'M22 7 13.5 15.5 8.5 10.5 2 17' }], ['path', { d: 'M16 7h6v6' }]],
  'trend-down': [['path', { d: 'M22 17 13.5 8.5 8.5 13.5 2 7' }], ['path', { d: 'M16 17h6v-6' }]],
  // Ravitos : bouteille (point d'eau) et couverts (ravitaillement complet), mêmes tracés que l'image exportée.
  milk: [
    ['path', { d: 'M8 2h8' }],
    ['path', { d: 'M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2' }],
    ['path', { d: 'M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0' }],
  ],
  utensils: [
    ['path', { d: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2' }],
    ['path', { d: 'M7 2v20' }],
    ['path', { d: 'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7' }],
  ],
  download: [['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }], ['path', { d: 'm7 10 5 5 5-5' }], ['path', { d: 'M12 15V3' }]],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof PATHS;

interface Props {
  name: IconName;
  size?: number;
  title?: string;
  className?: string;
}

export function Icon({ name, size = 20, title, className }: Props) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  return (
    <svg
      className={['np-icon', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...a11y}
    >
      {(PATHS[name] as Shape[]).map(([tag, attrs], i) =>
        tag === 'path' ? <path key={i} {...attrs} /> : <circle key={i} {...attrs} />,
      )}
    </svg>
  );
}
