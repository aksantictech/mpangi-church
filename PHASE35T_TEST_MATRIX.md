# Phase 35T — matrice de tests

## Utilisateurs

Avec un administrateur d’église :

- sélectionner un utilisateur ;
- modifier son nom ;
- modifier son email ;
- modifier son rôle ;
- désactiver puis réactiver ;
- archiver puis réactiver ;
- réinitialiser son mot de passe ;
- supprimer un utilisateur de test.

Protections attendues :

- impossible de désactiver son propre compte ;
- impossible de supprimer son propre compte ;
- impossible de supprimer le dernier administrateur actif ;
- impossible de gérer un utilisateur d’une autre église ;
- impossible de modifier un Super Admin.

## Formulaires

Vérifier sur mobile et desktop :

- texte noir ou bleu foncé ;
- placeholders lisibles ;
- options de listes visibles ;
- champs désactivés lisibles ;
- focus clairement visible.

## Dons

Configurer au moins deux méthodes de test.

### Mobile Money manuel

Utiliser un numéro officiel de test ou un numéro marchand prévu pour les essais.

- M-Pesa ;
- Airtel Money ;
- Orange Money.

Le don doit :

- recevoir une référence ;
- apparaître dans `/finance/donations` ;
- afficher le numéro configuré ;
- rester `Paiement attendu` jusqu’à confirmation manuelle.

### Carte bancaire

Ne jamais utiliser une vraie carte dans les paramètres.

Configurer uniquement :

- le nom du prestataire ;
- une URL de sandbox ;
- éventuellement les variables :
  - `{amount}`
  - `{currency}`
  - `{reference}`
  - `{return_url}`

### Virement bancaire

Pour les tests, utiliser des coordonnées fictives clairement identifiées comme test.

Le don doit afficher :

- banque ;
- titulaire ;
- compte ;
- IBAN ;
- SWIFT ;
- référence.

## Verset

La page publique doit afficher :

> Honore l’Éternel avec tes biens...

Référence :

`Proverbes 3:9-10`
