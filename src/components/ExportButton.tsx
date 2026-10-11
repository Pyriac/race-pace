import { useState } from 'react';
import { renderPlanImage, type PlanImageInput } from '../export/renderPlanImage';
import { downloadImage } from '../export/downloadImage';
import { hms } from '../lib/format';
import { Button } from './ds/Button';

interface Props extends PlanImageInput {
  courseId: string;
}

export function ExportButton({ courseId, ...input }: Props) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const canvas = await renderPlanImage(input);
      const time = hms(input.schedule.totalSeconds).replace(/:/g, '-');
      await downloadImage(canvas, `plan-allure-${courseId}-${time}.png`);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  // Variante primary : accent est réservé à « S'inscrire » dans le design system.
  return (
    <div className="export-bar">
      <Button variant="primary" size="lg" icon="download" onClick={handleClick} disabled={busy}>
        {busy ? 'Génération de l’image…' : 'Télécharger votre plan d’allure'}
      </Button>
    </div>
  );
}
