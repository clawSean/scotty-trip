# Log

## 2026-10-23

- Created the AID project after JPop approved the public Scottsdale trip site.
- Selected `scotty.jpop.cloud`, **Desert Behavior**, and the line “The babies
  can't read this anyway.”
- Chose a dependency-free Node/static architecture with anonymous shared voting.
- Began assembling public promotional imagery from the verified trip research;
  source credits are preserved in `ASSET_CREDITS.md`.
- Implemented the full mobile-first experience, itinerary tabs, option filters,
  anonymous shared voting, randomized plan generator, open-loop tracker, resort
  intelligence, and Sean concierge dialog.
- Local proof passed: syntax/content contract, 3/3 server tests, app/API smoke,
  security headers, vote persistence, image MIME types, and responsive browser
  runs at 320/390/1440 px. Fixed mobile hero clipping and a dialog hitbox issue
  found during visual QA.
- Published the public-safe repository at
  `https://github.com/clawSean/scotty-trip` and deployed a reboot-safe,
  least-privilege `www-data` service on VPS port 3014 behind Caddy.
- Live proof passed at `https://scotty.jpop.cloud`: TLS certificate, IPv4 HTTP
  redirect, HTTPS/API health, anonymous vote round trip, iPhone 13 navigation,
  itinerary tab and filter behavior, and zero recorded browser errors.
- The first deploy exposed Mac-preserved `0700/0600` modes; normalized the app
  tree to public-service-safe `0755/0644` and encoded that rule in deploy.sh.
- The first deploy-script run exposed BSD rsync's rejection of numeric
  `--chmod=D755,F644`; replaced it with portable symbolic directory/file modes.
- The restart smoke could race systemd before Node bound port 3014; added bounded
  connection-refused retries to both internal and public health checks.
- BSD rsync accepted symbolic `--chmod` but still preserved the source root's
  private mode; the deploy now normalizes ownership and every remote directory
  and file explicitly before restarting the service.
- Archived the synthetic live-proof votes as
  `votes.prelaunch-proof-20261023.json`; the public board launched at zero.
