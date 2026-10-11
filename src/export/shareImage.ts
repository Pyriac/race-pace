function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export PNG impossible'))), 'image/png');
  });
}

/**
 * Sur mobile : ouvre la feuille de partage native (iOS → « Enregistrer l'image » dans Photos).
 * Ailleurs : téléchargement classique du PNG.
 */
export async function shareOrDownload(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (err) {
      // L'utilisateur a fermé la feuille de partage : rien d'autre à faire.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      // Autre échec : on retombe sur le téléchargement.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
