import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Polices du design system, auto-hébergées (équivalent du lien Google Fonts de la charte).
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
// Design system Tour du Nipalou, importé tel quel (ne pas modifier : remplacer le dossier).
import '../design/nipalou-design-system/tokens.css';
import '../design/nipalou-design-system/components/bundle.css';
import './styles/tokens-plan.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
