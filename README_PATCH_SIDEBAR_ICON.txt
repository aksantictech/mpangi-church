/* 
PATCH À APPLIQUER SI TON SIDEBAR NE CONNAÎT PAS L’ICÔNE MailCheck.

Dans src/components/layout/Sidebar.tsx :

1) Ajoute MailCheck dans l'import lucide-react :
import { ..., MailCheck, ... } from "lucide-react";

2) Ajoute-le dans ICONS :
MailCheck,

Si tu veux remplacer directement, tu peux ouvrir ton fichier et chercher :
const ICONS: Record<string, LucideIcon> = {

Puis ajoute :
  MailCheck,

Le moduleRegistry utilise iconKey: "MailCheck" pour Boîte administrative.
*/
