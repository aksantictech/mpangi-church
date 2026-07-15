MPANGI-CHURCH — HOTFIX PHASE 35S
COMPATIBILITÉ WINDOWS POWERSHELL 5.1

CAUSE
Windows PowerShell 5.1 utilise l'ancien .NET Framework.
La méthode suivante n'y existe pas :

[System.IO.Path]::GetRelativePath()

CORRECTION
Le script utilise maintenant System.Uri.MakeRelativeUri(), compatible avec Windows PowerShell 5.1.

INSTALLATION
1. Dézipper à la racine du projet.
2. Remplacer l'ancien fichier collect-production-stabilization-context.ps1.
3. Exécuter :

powershell -ExecutionPolicy Bypass `
  -File collect-production-stabilization-context.ps1

RÉSULTAT
mpangi-production-stabilization-context.zip

Téléverser ensuite ce ZIP dans la conversation.

Le script ne modifie aucun fichier de l'application.
