# Gaming Website

This repository hosts a play-and-create gaming site prototype for:

- playing games
- creating games
- earning in-game money from quests
- owner-only moderation and economy controls
- admin and tester roles

## Included demo accounts

- Owner: `adam28749`
- Admins: `zuby`, `ben54`
- Tester: `cilly14`

## Site behavior

- The home page asks for a username and an optional password.
- If the player does not provide a password, they enter guest mode.
- Persistent accounts can log in with a password and keep their progress.
- The owner can gift in-game money, set balances, and ban players.
- Quests and games award coins to the active player.
- A role panel shows ownership, admin, and tester access.

## Run locally

Open `index.html` in a browser or serve the folder with any static server.

Example:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## GitHub Pages

When GitHub Pages is enabled for this repository, the site will be available at:

```text
https://adam28749.github.io/gaming-website/
```
