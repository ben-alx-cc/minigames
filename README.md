# KeinPlan - 3D Minigame Collection

Eine moderne 3D-Minigame-Webapp mit beeindruckenden visuellen Effekten, optimiert für Desktop und Mobile-Geräte.

## 🎮 Features

### 4 Coole 3D-Minigames

1. **Cube Racer** - 3D Labyrinth-Rennen
   - Steuere einen leuchtenden Würfel durch ein 3D-Labyrinth
   - Sammle Checkpoints und vermeide Hindernisse
   - Physik-basierte Bewegung mit Sprung-Mechanik

2. **Gravity Balls** - Physik-Simulator
   - Lass Bälle in einer Arena mit realistischer Physik fallen
   - Treffe Ziele und sammle Punkte
   - Verschiedene Hindernisse und Power-Ups

3. **Space Shooter** - Weltraum-Kampf
   - Kämpfe gegen verschiedene Feindtypen im Weltraum
   - Sammle Power-Ups und überlebe Wellen
   - Spektakuläre Explosionen und Partikel-Effekte

4. **3D Block Puzzle** - Strategisches Puzzle
   - Verschiebe Blöcke um Ziel-Pattern zu erstellen
   - Verschiedene Block-Typen mit einzigartigen Eigenschaften
   - Steigender Schwierigkeitsgrad

## 🚀 Technologie

- **Three.js** - 3D-Grafik-Engine
- **Vanilla JavaScript** - Keine Frameworks, pure Performance
- **Responsive Design** - Optimiert für alle Bildschirmgrößen
- **Touch Controls** - Mobile-optimierte Steuerung
- **WebGL** - Hardware-beschleunigte 3D-Grafiken

## 📱 Mobile-Optimierung

- Touch-optimierte Steuerung mit virtuellem Joystick
- Responsive Design für alle Bildschirmgrößen
- iPhone/iPad Optimierungen
- Adaptive Performance-Einstellungen
- Touch-Feedback und intuitive Gesten

## 🎨 Visuelle Features

- Moderne UI mit Glasmorphismus-Effekten
- Partikel-Systeme für Explosionen und Effekte
- Dynamische Beleuchtung und Schatten
- Smooth Animationen und Übergänge
- Adaptive Farbgebung und Themes

## 🕹️ Steuerung

### Desktop
- **WASD** oder **Pfeiltasten** - Bewegung
- **Leertaste** - Springen/Aktion
- **Maus** - Interaktion
- **ESC** - Pause/Menü
- **P** - Pause-Toggle

### Mobile
- **Virtueller Joystick** - Bewegung
- **Touch-Bereiche** - Aktionen
- **Swipe-Gesten** - Spezielle Aktionen

## 🎯 Gameplay-Features

- **Score-System** mit Bestenlisten
- **Level-basierter Fortschritt**
- **Leben-System** mit Respawn-Mechanik
- **Power-Ups** und Spezial-Effekte
- **Adaptive Schwierigkeit**

## 🌐 GitHub Pages Deployment

Die App ist so konzipiert, dass sie direkt auf GitHub Pages gehostet werden kann:

1. Repository auf GitHub erstellen
2. Dateien hochladen
3. GitHub Pages in den Repository-Einstellungen aktivieren
4. App ist unter `https://[username].github.io/[repository-name]` verfügbar

## 📁 Projektstruktur

```
keinPlan/
├── index.html              # Haupt-HTML-Datei
├── styles.css              # CSS-Styling
├── js/
│   ├── main.js             # Haupt-App-Logik
│   ├── game-engine.js      # 3D-Game-Engine
│   ├── input.js            # Input-Management
│   ├── utils.js            # Utility-Funktionen
│   └── games/
│       ├── cube-racer.js   # Cube Racer Spiel
│       ├── gravity-balls.js # Gravity Balls Spiel
│       ├── space-shooter.js # Space Shooter Spiel
│       └── block-puzzle.js  # Block Puzzle Spiel
└── README.md               # Diese Datei
```

## 🚀 Installation & Setup

1. **Repository klonen oder herunterladen**
   ```bash
   git clone https://github.com/[username]/keinplan.git
   cd keinplan
   ```

2. **Lokaler Server (optional)**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

3. **Im Browser öffnen**
   - Lokal: `http://localhost:8000`
   - GitHub Pages: `https://[username].github.io/keinplan`

## 🎮 Spielen

1. Öffne die Webapp in deinem Browser
2. Wähle eines der 4 Minigames aus dem Hauptmenü
3. Nutze die Steuerung (Desktop/Mobile)
4. Sammle Punkte und erreiche neue Level
5. Vergleiche deine Highscores!

## 🔧 Anpassungen

### Neue Spiele hinzufügen
1. Neue Spiel-Klasse in `js/games/` erstellen
2. `BaseGame` erben und Methoden implementieren
3. In `game-engine.js` registrieren
4. UI-Element im Hauptmenü hinzufügen

### Styling anpassen
- `styles.css` für visuelle Anpassungen
- CSS-Variablen für Farben und Größen
- Responsive Breakpoints anpassen

### Performance-Optimierung
- `game-engine.js` für Render-Einstellungen
- Partikel-Systeme anpassen
- LOD (Level of Detail) implementieren

## 🐛 Bekannte Probleme

- **iOS Safari**: Gelegentliche Touch-Event-Probleme
- **Firefox**: Minimale WebGL-Kompatibilitätsprobleme
- **Alte Geräte**: Performance kann auf schwächerer Hardware variieren

## 🤝 Beitragen

Verbesserungen und neue Features sind willkommen! 

1. Fork des Repositories
2. Feature-Branch erstellen
3. Änderungen committen
4. Pull Request erstellen

## 📄 Lizenz

MIT License - Siehe LICENSE-Datei für Details.

## 🎉 Credits

- **Three.js** - 3D-Grafik-Engine
- **Orbitron Font** - Futuristische Typografie
- **Roboto Font** - Moderne UI-Schriftart

---

**Viel Spaß beim Spielen! 🎮✨**

Für Fragen oder Feedback, erstelle gerne ein Issue im Repository.
