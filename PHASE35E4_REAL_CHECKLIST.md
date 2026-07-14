# Checklist réelle — Phase 35E-4

Marquer chaque test avec `[x]` après validation.

## aksantictech@gmail.com

- Rôle : `super_admin`
- Église : Aucune
- Statut : active

- [ ] Ouvrir /super-admin/churches
- [ ] Ouvrir /super-admin/users
- [ ] Ouvrir /settings/security-audit
- [ ] Vérifier la consultation de plusieurs églises
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## arnoldfalanga@gmail.com

- Rôle : `super_admin`
- Église : Aucune
- Statut : active

- [ ] Ouvrir /super-admin/churches
- [ ] Ouvrir /super-admin/users
- [ ] Ouvrir /settings/security-audit
- [ ] Vérifier la consultation de plusieurs églises
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## icckitambo@icc.cd

- Rôle : `church_admin`
- Église : Impact Centre Chrétien Extension Kitambo
- Statut : active

- [ ] Ouvrir /members
- [ ] Ouvrir /settings/users
- [ ] Ouvrir /settings/roles
- [ ] Ouvrir /settings/security-validation
- [ ] Vérifier que les données appartiennent à son église
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## icckinshasa@icc.cd

- Rôle : `church_admin`
- Église : Impact Centre Chretien RDC
- Statut : active

- [ ] Ouvrir /members
- [ ] Ouvrir /settings/users
- [ ] Ouvrir /settings/roles
- [ ] Ouvrir /settings/security-validation
- [ ] Vérifier que les données appartiennent à son église
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## erickomba01@gmail.com

- Rôle : `church_admin`
- Église : La Maison de Miséricorde
- Statut : active

- [ ] Ouvrir /members
- [ ] Ouvrir /settings/users
- [ ] Ouvrir /settings/roles
- [ ] Ouvrir /settings/security-validation
- [ ] Vérifier que les données appartiennent à son église
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## ecoledelafoiinternationale@gmail.com

- Rôle : `church_admin`
- Église : Communauté Charismatique des Térébinthes
- Statut : active

- [ ] Ouvrir /members
- [ ] Ouvrir /settings/users
- [ ] Ouvrir /settings/roles
- [ ] Ouvrir /settings/security-validation
- [ ] Vérifier que les données appartiennent à son église
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## pushlop24@gmail.com

- Rôle : `church_admin`
- Église : Communauté Charismatique des Térébinthes
- Statut : active

- [ ] Ouvrir /members
- [ ] Ouvrir /settings/users
- [ ] Ouvrir /settings/roles
- [ ] Ouvrir /settings/security-validation
- [ ] Vérifier que les données appartiennent à son église
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## icc@gmail.com

- Rôle : `church_admin`
- Église : Impact Centre Chretien RDC
- Statut : active

- [ ] Ouvrir /members
- [ ] Ouvrir /settings/users
- [ ] Ouvrir /settings/roles
- [ ] Ouvrir /settings/security-validation
- [ ] Vérifier que les données appartiennent à son église
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## tresorf@gmail.com

- Rôle : `church_admin`
- Église : La Maison de Miséricorde
- Statut : active

- [ ] Ouvrir /members
- [ ] Ouvrir /settings/users
- [ ] Ouvrir /settings/roles
- [ ] Ouvrir /settings/security-validation
- [ ] Vérifier que les données appartiennent à son église
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## susannegrace@gmail.com

- Rôle : `worker`
- Église : La Maison de Miséricorde
- Statut : active

- [ ] Ouvrir /my-work
- [ ] Ouvrir /attendance
- [ ] Confirmer que les modules administratifs sont refusés
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## natachabila@icc.cd

- Rôle : `worker`
- Église : Impact Centre Chretien RDC
- Statut : active

- [ ] Ouvrir /my-work
- [ ] Ouvrir /attendance
- [ ] Confirmer que les modules administratifs sont refusés
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## danielkayembe@icc.cd

- Rôle : `worker`
- Église : Impact Centre Chretien RDC
- Statut : active

- [ ] Ouvrir /my-work
- [ ] Ouvrir /attendance
- [ ] Confirmer que les modules administratifs sont refusés
- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible
- [ ] Vérifier le journal après un refus

## Test croisé obligatoire

- [ ] Choisir un compte de l’église A et un identifiant de donnée appartenant à l’église B
- [ ] Tester lecture, modification et téléchargement
- [ ] Confirmer : aucune ligne retournée ou accès refusé
- [ ] Vérifier l’événement dans `/settings/security-audit`