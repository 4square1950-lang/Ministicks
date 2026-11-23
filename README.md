# Ministicks | Rink Tour

A browser knee hockey game with two runners and a goalie per club, a ten-city campaign, local multiplayer, training, and league standings.

## Play locally

Install Node.js, then run these commands from the repository root.

```sh
npm ci --prefix viewer
node serve-rink.cjs
```

Open [the local preview](http://127.0.0.1:8096/). A browser with WebGL is required. Satellite imagery requires an internet connection. Campaign progress, profiles, and league results stay in the browser's local storage.

## Controls

Player 1 uses WASD to move, the mouse to aim, click or Space to shoot, right-click or E to pass or poke, Q to switch runners, and Shift for off-ball steps.

Player 2 uses the arrow keys to move, K and L to aim, Enter to shoot, O to pass or poke, U to switch runners, and Right Shift for off-ball steps.

## Credits

Player art and animation come from the Ministicks-Player project. See the [third-party notices](dist/THIRD_PARTY_NOTICES.md) and [font license](dist/OFL.txt). The world map uses Natural Earth land outlines. Satellite imagery attribution appears on the map.
