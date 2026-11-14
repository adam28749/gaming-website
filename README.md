# NovaQuest Arena

A static browser prototype for a gaming community: players can play mini-games, earn demo coins, complete quests, and use the no-code Studio to create and publish simple playable mini-games.

## Studio

Open **Studio** from the navigation. Set a name and instructions, select a template (tap challenge, target hunt, or quick quiz), choose a demo reward, and publish. Your published game appears in the Games list and can be played. Game drafts and published games are stored only in the current browser.

## Run / publish

Open `index.html` locally or host the static files. GitHub Pages must be enabled in the repository's Settings → Pages before a public site URL will work.

## Security and limitations

This is a front-end-only demo, not a production game platform. It has no secure authentication, shared database, or server-side role enforcement. Account data, game submissions, coins, and moderation state are stored in local browser storage and can be changed by the browser user. The email check is only demo behavior, not proof of identity. Never enter a real password or rely on it for real accounts, bans, or currency. Public game sharing and secure admin access require a backend with verified authentication and server-side authorization.
