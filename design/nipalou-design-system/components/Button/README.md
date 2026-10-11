# Button

Bouton en pilule pour toute action ; `accent` est réservé à « S'inscrire », une fois par écran.

**Le consommateur fournit** : le libellé (`children`), `variant`, éventuellement `href` (rend un lien `<a>`), `icon` en fin de bouton (`arrow-right` pour une action qui mène ailleurs), `size`, et les attributs HTML habituels (`onClick`, `disabled`, `type`).

- `primary` (défaut) : aplat `brand`, texte `on-brand`. Action principale d'une section.
- `accent` : aplat `accent`, texte `on-accent`. L'inscription, rien d'autre.
- `secondary` : fond `surface-200`, bordure `line-strong`. Actions de second rang (télécharger, partager).
- `ghost` : texte `brand` sans fond. Liens d'action dans une carte.
- Tailles : `sm` 36 px, `md` 44 px (défaut, cible tactile), `lg` 52 px pour le héros.

À faire : verbe à l'infinitif en casse de phrase (« Voir le profil »). À éviter : deux boutons `accent` côte à côte, des libellés en capitales, « Cliquez ici ».
