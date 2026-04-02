# Application Maths BUT GCGP

Application web locale pour accompagner les etudiants de BUT Genie chimique genie des procedes en mathematiques.

## Contenu

- assistant IA pour repondre a des questions de maths en contexte GCGP
- espace cours par semestre avec objectifs et notions clefs
- generation rapide d'exercices cibles
- generation d'exercices par IA cote serveur
- bibliotheque d'exercices corriges prets a l'emploi
- filtres de recherche par semestre et niveau
- comptes et connexion avec persistance SQLite
- suivi local et synchronise de progression, favoris, historique et exercices generes
- themes alignes sur le programme national officiel du BUT GCGP 2022

## Themes integres

- `SYSLIN` : systemes lineaires, substitution, pivot de Gauss et cas sans solution
- `POLY` : operations sur les polynomes, racines et factorisation
- `FVAR` : fonctions a plusieurs variables, derivees partielles, EDP simples et integrales simple ou double
- `FRAT` : fractions rationnelles, division euclidienne sur les polynomes et decomposition en elements simples

## Lancer l'application

1. Verifier que Python 3 est installe.
2. Definir la cle API OpenAI.
3. Lancer le serveur.

```bash
export OPENAI_API_KEY="votre_cle"
python3 server.py
```

Puis ouvrir `http://localhost:3001`.

## Configuration

- `OPENAI_API_KEY` : cle API OpenAI obligatoire pour le chat IA
- `OPENAI_MODEL` : optionnel, par defaut `gpt-4.1-mini`
- `PORT` : optionnel, par defaut `3000`

## Donnees

- `app.db` : base SQLite creee automatiquement au premier lancement
- tables : `users`, `sessions`, `progress`

## Sources programme

- Programme national BUT GCGP 2022, Ministere de l'Enseignement superieur :
  https://www.enseignementsup-recherche.gouv.fr/sites/default/files/2023-12/g-nie-chimique-g-nie-des-proc-d-s-30828.pdf
