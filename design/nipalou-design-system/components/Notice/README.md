# Notice

Message encadré, teinté selon son statut, toujours accompagné d'une icône et d'un mot.

**Le consommateur fournit** : `tone`, le texte (`children`, une ou deux phrases), un `title` facultatif — par défaut le mot du statut : « Info », « Confirmé », « Attention », « Erreur ».

- `info` sur `info-soft` : logistique, navettes, écologie.
- `success` sur `success-soft` : confirmation d'inscription ou de paiement.
- `warning` sur `warning-soft` : règles qui coûtent (majoration, pièce manquante). Reprend le « Attention : » du site.
- `danger` sur `danger-soft` : erreur bloquante.

Le conteneur fixe la largeur ; la notice prend toute la place disponible. À éviter : empiler plus de deux notices, un statut porté par la seule couleur.
