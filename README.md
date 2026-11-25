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

In campaign districts, use WASD to walk, Shift to run, and drag either mouse button to orbit the camera. Left-click a person to open chat.

## Shared campaign rooms

Start `node serve-rink.cjs` and have both players use that same server. In a district, select **Join room**, enter the same 6–16 character room code, and visit the same city. Left-click the other player to send a message or request a voice call. The other player must accept the call. Room membership and chat history last for the session.

For access from another device, run the Node server behind an HTTPS reverse proxy. It binds to localhost by default. Set `MINISTICKS_HOST` only if the proxy needs a different bind address. The proxy must keep `/campaign/events` streaming and forward `/campaign/send` requests. Voice requires browser microphone permission and a network where the peers can connect directly.

A static build can use a separate HTTPS server by adding a `campaign-server` meta tag with that server's origin in `index.html` and setting `MINISTICKS_CAMPAIGN_ORIGIN` on the Node server to the static site's exact origin. The default GitHub Pages site serves solo play.

For networks that block direct audio, set the `campaign-ice-servers` meta tag to a JSON array of browser-facing ICE server entries, including your TURN relay. Use credentials intended for browser clients.

## Credits

Player art and animation come from the Ministicks-Player project. See the [third-party notices](dist/THIRD_PARTY_NOTICES.md) and [font license](dist/OFL.txt). The world map uses Natural Earth land outlines. Satellite imagery attribution appears on the map.
