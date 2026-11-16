# SDSI Agenda • ENSIAS Master SDSI (2026-2027)

Progressive Web App (PWA) moderne, rapide et épurée pour la gestion de l'emploi du temps et le suivi pédagogique du **Master SDSI (Semestre 1, 2026-2027)** à l'ENSIAS.

---

## ✨ Fonctionnalités Clés

- 📱 **PWA Installable & Mobile-First :** Conçue pour un usage fluide à une main avec barre de navigation basse, manifest complet, icônes adaptatives et Service Worker pour la consultation hors-ligne.
- ⚡ **Accès Immédiat à l'Essentiel :** Affichage optimisé sans texte superflu — Horaire, Module, Salle en grand, Professeur et Mode de cours.
- 🎯 **Carte Hero "Temps Réel" :** Détection automatique du cours en cours ou du prochain cours avec compte à rebours en direct (`Dans 25 min`, `Finit dans 40 min`...).
- 📅 **Mapping Dynamique des Semaines (S1 à S14) :** Calcul automatique de la semaine actuelle selon la date système et le lundi de départ du semestre (`2026-10-05` par défaut).
- 🔀 **Gestion des Chevauchements :** Détection et affichage soigné côte à côte des séances simultanées (ex: `Amphi 4` vs `LC3` en S7/S8/S10 pour les sous-groupes SDSI).
- ✅ **Suivi Pédagogique & Tâches :** Gestion des devoirs, TP et révisions rattachés aux séances ou aux modules, avec priorités, échéances et barres de progression par module (`M111` à `M117`).
- 🛠️ **Édition & Rattrapage :** Modification rapide de séances, ajout de séances de rattrapage, et réinitialisation complète ou export direct au format CSV original.
- 🌙 **Design Épuré & Dark Mode :** Esthétique inspirée de Linear et Apple Calendar, palette de couleurs personnalisée par module.

---

## 🛠️ Stack Technique

- **Framework :** Next.js 16 (App Router, TypeScript)
- **Styling :** Tailwind CSS + Lucide Icons
- **PWA :** Manifest Web, Service Worker (`sw.js`) avec cache offline
- **Persistance :** Base de données légère embarquée JSON/CSV (`./data/agenda_db.json`) initialisée automatiquement au démarrage (seeding) depuis `./data/emploi_du_temps_SDSI_S1_S14.csv`
- **Conteneurisation :** Docker (multi-stage standalone) & Docker Compose

---

## 🚀 Démarrage Rapide

### 1. Développement Local

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### 2. Build Production Local

```bash
npm run build
npm start
```

---

## 🐳 Déploiement avec Docker Compose

L'application est prête à être déployée en production avec persistance complète des données :

```bash
# Lancer le conteneur en arrière-plan
docker compose up -d --build

# Consulter les logs
docker compose logs -f

# Arrêter l'application
docker compose down
```

Le volume `./data` est monté automatiquement pour conserver vos modifications, ajouts de rattrapages et tâches.

---

## ⚙️ Configuration

Vous pouvez ajuster la date de départ du semestre (Lundi S1) :
1. Directement dans l'onglet **"Édition EDT"** de l'interface.
2. Ou via la variable d'environnement `NEXT_PUBLIC_SEMESTER_START_DATE` dans `.env.local` ou `docker-compose.yml` :

```env
NEXT_PUBLIC_SEMESTER_START_DATE=2026-10-05
PORT=3000
```

---

## 📊 Modules du Semestre 1

| Code | Intitulé | Couleur |
| :--- | :--- | :--- |
| **M111** | Statistique inférentielle & analyse et visualisation | Émeraude (`#10b981`) |
| **M112** | Bases de traitement des données multimédias | Cyan (`#06b6d4`) |
| **M113** | Algorithmique avancée et structures de données | Indigo (`#6366f1`) |
| **M114** | Techniques de l'Intelligence Artificielle | Ambre (`#f59e0b`) |
| **M115** | Ingénierie des Données et Systèmes Décisionnels | Rose (`#f43f5e`) |
| **M117** | Compétences en culture et art marocains | Violet (`#a855f7`) |

---

## 📲 Installation PWA

- **Sur Mobile (Android / Chrome) :** Cliquez sur le bouton "Installer l'App SDSI" ou depuis le menu Chrome : *"Ajouter à l'écran d'accueil"*.
- **Sur iPhone (iOS / Safari) :** Appuyez sur le bouton Partager puis *"Sur l'écran d'accueil"*.
- **Sur Desktop (Chrome / Edge) :** Cliquez sur l'icône d'installation dans la barre d'adresse.