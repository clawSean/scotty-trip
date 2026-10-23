# Desert Behavior — Scottsdale 2026

Public, mobile-first trip planner and hype site for JPop's Scottsdale birthday.

## Run locally

```bash
npm run check
npm test
npm run smoke
PORT=4177 npm start
```

Then open <http://127.0.0.1:4177>.

## Deploy

The initial systemd and Caddy route are already installed on JPop's VPS. Future
code-only releases use:

```bash
./scripts/deploy.sh
```

The deploy normalizes remote directories to `0755` and files to `0644`; never
preserve the Mac checkout's private modes onto the public service path.

## Architecture

- Vanilla HTML/CSS/JS keeps the experience fast and portable.
- A dependency-free Node server serves the site and a small vote API.
- Votes are anonymous and device-scoped; only hashed device tokens are stored.
- The data file is external to the repository in production.

## Public safety

The repository contains no traveler identities, reservation numbers, private
confirmations, contact details, or financial information.
