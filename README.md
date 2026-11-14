# Gaming Website

A community gaming platform where players can play and create games, complete quests, and earn in-game currency. The platform supports owner, admin, and tester roles.

## Sign-in

- When entering the site, players choose a username and may set a password.
- Password is optional for guest-style access; a username without a password is not secure proof of identity, so it must not grant access to an existing account or privileged features.
- To protect a persistent account and its progress, encourage players to set a password. Store passwords only as strong salted hashes on the server—never in plain text.

## Gameplay and rewards

- Players can earn in-game currency by completing quests and playing games.
- Quests and games should award currency through trusted server-side logic, not client-submitted balance changes.
- Show players how much currency each quest or game can award.

## Roles and requested account setup

- **Owner:** The site owner has full access to role management, moderation, and the economy.
- **Admins:** `zuby` and `ben54` are requested admin accounts.
- **Tester:** `cilly14` is a requested tester account.
- **Testers:** Try games before release and provide feedback.
- Assign privileged roles only to verified accounts, and store roles server-side. Do not rely on display names or usernames alone to authorize privileged actions.

## Moderation and economy

- **Owner controls:** Set player balances, gift in-game currency, and ban or unban accounts.
- **Admins:** Help moderate the community according to owner-assigned permissions.
- **Safety:** Currency changes and moderation actions should be validated and recorded server-side, with a reason and audit trail. Never trust a balance or role supplied by the browser.

This repository is the initial project scaffold. The website and its secure backend still need to be implemented.
