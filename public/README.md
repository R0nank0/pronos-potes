# Pronos Potes - Frontend

Frontend statique pour l'archive des pronostics sportifs.

## Structure

```
public/
├── index.html           # Landing page avec toutes les compétitions
├── season.html          # Page de détail d'une saison
├── css/
│   ├── main.css        # Styles globaux
│   └── season.css      # Styles spécifiques à la page season
└── js/
    ├── utils.js        # Fonctions utilitaires
    ├── index.js        # Script landing page
    └── season.js       # Script page season
```

## Fonctionnalités

### Landing Page (`index.html`)
- ✅ Affichage de toutes les compétitions
- ✅ Liste des saisons par compétition
- ✅ Statistiques globales
- ✅ Navigation vers les saisons

### Page Saison (`season.html`)
- ✅ **Onglet Classement Général**
  - Classement complet de la saison
  - Recherche de joueurs
  - Tri par points, taux de réussite, etc.

- ✅ **Onglet Par Journée**
  - Navigation entre toutes les journées
  - Classement par journée
  - Points cumulés

- ✅ **Onglet Évolution**
  - Historique du classement journée par journée
  - Statistiques d'évolution
  - (Graphique à venir)

## Design

- Design moderne et responsive
- Mobile-first
- Couleurs par compétition
- Animations et transitions fluides
- Performance optimisée (lazy loading)

## Cache

- Index global : 24h
- Saisons index : 24h
- Classements : 1h
- Journées : 1h

## Développement Local

```bash
# Démarrer le serveur de développement
node server.js

# Ouvrir dans le navigateur
http://localhost:8080
```

## Déploiement

Le site est conçu pour être déployé sur GitHub Pages ou tout autre hébergement statique.

```bash
# Pour GitHub Pages, copier public/ vers docs/
cp -r public/* docs/
git add docs/
git commit -m "Deploy frontend"
git push
```

## Performance

- **Taille moyenne par page** : ~10-15 KB (HTML + CSS + JS)
- **Temps de chargement initial** : <500ms
- **Chargement lazy des données** : Oui
- **Cache navigateur** : LocalStorage avec expiration

## Compatibilité

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## TODO

- [ ] Ajouter graphiques d'évolution (Chart.js)
- [ ] Ajouter page de recherche globale
- [ ] Ajouter comparaison de joueurs
- [ ] Ajouter statistiques avancées
- [ ] Ajouter mode sombre
- [ ] Ajouter PWA support
- [ ] Ajouter partage sur réseaux sociaux
