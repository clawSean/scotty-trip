# Status

## Current phase

Operational.

## Locked decisions

- Host: `https://scotty.jpop.cloud`
- Public and login-free, with `noindex` metadata.
- Title: **Desert Behavior**.
- Anonymous, device-scoped voting; no accounts or names.
- Canonical trip dates: Nov. 19–22, 2026.
- Public-safe content only.

## Current step

Version 1 is live at `https://scotty.jpop.cloud` and published at
`https://github.com/clawSean/scotty-trip`. Keep research details current as
reservations lock, then replace options with the confirmed itinerary without
publishing private traveler or booking data.

## Proof required before done

- Syntax/content checks and 3/3 server tests pass.
- Mobile and desktop screenshots reviewed at 320, 390, and 1440 pixels with no
  horizontal overflow or page errors.
- Core navigation, filters, itinerary tabs, voting, and Sean concierge work;
  one mobile hero clipping issue and one dialog close hitbox bug were fixed.
- Live HTTPS/TLS, HTTP redirect, security/noindex headers, service persistence,
  anonymous voting, and iPhone 13 interaction were verified. The live browser
  recorded zero page errors and successful `GET /api/votes` plus
  `POST /api/vote` responses.

## Live surfaces

- Site: `https://scotty.jpop.cloud`
- Repository: `https://github.com/clawSean/scotty-trip`
- VPS app: `/srv/apps/scotty-trip`
- Vote data: `/var/lib/scotty-trip/votes.json`
- Service: `scotty-trip.service` on `127.0.0.1:3014`
- Edge: Caddy HTTPS reverse proxy with a dedicated IPv4 HTTP redirect

## Next

1. Gather friend votes and use them to pick the birthday dinner and major
   daytime/nightlife anchors.
2. Replace tentative itinerary language as reservations become real.
3. Reconfirm resort amenities and F1 viewing before publishing either as locked.
