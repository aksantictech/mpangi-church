"use client";

/**
 * Désactivé pendant la Phase 35X.
 *
 * Ce compos composant modifiait directement les className et les
 * attributs data-label des tableaux gérés par React, ce qui
 * provoquait des erreurs d’hydratation.
 *
 * La responsivité sera désormais gérée par le CSS et par les
 * composants de tableaux eux-mêmes.
 */
export default function ResponsiveTablesEnhancer() {
  return null;
}