# TextField

Champ de saisie avec libellé, aide et message d'erreur, pour le formulaire d'inscription.

**Le consommateur fournit** : `label` (obligatoire, toujours visible), `hint` (aide sous le champ), `error` (remplace l'aide, bordure `danger`, icône), et tous les attributs d'`<input>` (`type`, `name`, `value`, `onChange`, `required`, `autoComplete`).

Hauteur 44 px, texte 16 px (pas de zoom sur iOS), bordure `line-strong` sur `surface-200`, focus `focus-ring`. Le message est relié au champ par `aria-describedby` ; l'erreur pose `aria-invalid`.

À faire : dire comment corriger (« vérifiez le jour et le mois »). À éviter : le placeholder comme seul libellé, une erreur affichée avant que le champ ait été quitté.
