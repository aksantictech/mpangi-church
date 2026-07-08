# Mpangi-church — Checklist sécurité & permissions V1

## Objectif
Stabiliser les accès avant l’onboarding de 5 églises.

## 1. Tests obligatoires par rôle

Créer au minimum ces comptes dans une église de test :

- Admin Eglise
- Pasteur T
- Pasteur A
- Chargé AFP
- Responsable D
- Logisticien
- Secrétaire
- Ouvrier / utilisateur
- Lecture seule

Pour chaque compte, tester :

- connexion
- dashboard
- menu visible
- accès direct par URL
- création
- modification
- suppression / archivage
- export
- accès refusé sur modules non autorisés

## 2. Tests multi-église

Créer deux églises :

- Église A
- Église B

Tester :

- un utilisateur de A ne voit pas les membres de B
- un utilisateur de A ne voit pas les finances de B
- un utilisateur de A ne voit pas le patrimoine de B
- un admin de A ne peut pas créer un utilisateur dans B
- un admin de A ne peut pas modifier les modules de B
- seul super_admin peut gérer toutes les églises

## 3. Routes critiques à protéger

Vérifier que ces routes utilisent requireChurchModuleAccess :

- /members
- /attendance
- /souls
- /events
- /publications
- /teachings
- /notifications
- /administration/*
- /finance/*
- /patrimony/*

Vérifier que ces routes utilisent requireChurchAdmin :

- /settings/users
- /settings/users/new

Vérifier que ces routes utilisent requireSuperAdmin :

- /super-admin/*

## 4. Clés sensibles

Vérifier dans le code :

- aucun fichier "use client" n’importe createAdminClient
- SUPABASE_SERVICE_ROLE_KEY n’existe pas avec NEXT_PUBLIC_
- VAPID_PRIVATE_KEY n’existe pas avec NEXT_PUBLIC_
- aucun log console ne montre une clé secrète

## 5. Vérification navigateur

Tester en navigation privée :

- ouvrir /dashboard sans login → redirection login
- ouvrir /finance sans droit → /unauthorized
- ouvrir /super-admin sans super_admin → /unauthorized
- ouvrir /settings/users sans admin église → /unauthorized

## 6. Vérification mobile

Tester sur Android Chrome :

- login
- menu
- dashboard
- scanner QR
- enseignements
- notifications
- accès refusé
