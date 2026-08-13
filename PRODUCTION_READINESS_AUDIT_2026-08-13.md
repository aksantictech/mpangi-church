# Audit de préparation à la production — 13 août 2026

## Verdict

L'application compile et les contrôles automatisés ne détectent aucune page critique, aucune route sans état de couverture et aucune vulnérabilité npm connue. La mise en production est conditionnée à l'application de la migration `202608140002_production_data_hardening.sql`, au passage réussi du nouveau contrôle GitHub et à un test de restauration Supabase.

## Correctifs intégrés

- Mise à jour de Next.js et jsPDF vers des versions corrigées.
- Remplacement de la dépendance Excel vulnérable et limitation des imports à 5 Mo.
- Correction définitive de la catégorie du module `ai_assistant` (`system`).
- Passage du bucket `church-documents` en privé ; les téléchargements utilisent désormais la route authentifiée de l'application.
- Contrôles SQL empêchant de relier un rapport, un département, un auteur ou un destinataire appartenant à des églises différentes.
- Suppression de l'écriture directe trop large des rapports pour les utilisateurs authentifiés ; les écritures passent par les actions serveur contrôlées.
- Ajout d'un contrôle GitHub automatique : audit des dépendances, lint, pré-déploiement et build de production.

## Résultats vérifiés

| Contrôle | Résultat |
|---|---|
| `npm audit --omit=dev` | 0 vulnérabilité |
| ESLint | 0 erreur, 501 avertissements historiques |
| Audit pages/layouts | 0 page critique, 0 avertissement |
| Audit états de routes | 0 page sans couverture |
| Build Next.js 16.3.0 | Réussi, 123 pages statiques générées |

## Actions obligatoires avant le feu vert final

1. Exécuter la migration `supabase/202608140002_production_data_hardening.sql` dans Supabase.
2. Fusionner la branche uniquement après le passage au vert du workflow **Quality gate**.
3. Protéger `main` dans GitHub : pull request obligatoire, contrôle **Audit, lint and build** obligatoire, blocage du force-push et de la suppression.
4. Réaliser et documenter un test de restauration de la base et des fichiers depuis une sauvegarde récente.
5. Tester en Preview avec deux églises distinctes : accès aux rapports, destinataires et téléchargement de documents doivent rester strictement isolés.

## Dette technique à planifier

- Réduire progressivement les 501 avertissements ESLint, en priorité les effets React synchrones et les usages de `any` dans les routes sensibles.
- Ajouter des tests automatisés d'autorisation multi-église et de restauration des données.
- Réunir les anciens scripts SQL placés à la racine dans une stratégie de migrations versionnées reproductible.
