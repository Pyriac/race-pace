function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export PNG impossible'))), 'image/png');
  });
}

/**
 * Télécharge le PNG (lien avec attribut download), sans passer par la feuille de partage.
 * Sur iPhone, Safari propose « Télécharger » : l'image arrive dans l'app Fichiers (Téléchargements).
 */
export async function downloadImage(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Laisse au navigateur le temps de lancer le téléchargement avant de libérer l'URL.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
