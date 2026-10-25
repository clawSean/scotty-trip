#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

npm run check
npm test

rsync -az --delete --delete-excluded \
  --exclude .git \
  --exclude data \
  --exclude VISION.md \
  --exclude STATUS.md \
  --exclude LOG.md \
  --exclude DECISIONS.md \
  --exclude ROADMAP.md \
  --exclude CONTRIBUTING.md \
  --exclude RESOURCES.md \
  --exclude resources \
  --exclude rollouts \
  --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
  ./ jpop-vps:/srv/apps/scotty-trip/

ssh jpop-vps '
  chown -R root:root /srv/apps/scotty-trip
  find /srv/apps/scotty-trip -type d -exec chmod 0755 {} +
  find /srv/apps/scotty-trip -type f -exec chmod 0644 {} +
  install -d -o www-data -g www-data -m 0755 /var/lib/scotty-trip
  install -m 0644 /srv/apps/scotty-trip/ops/scotty-trip.service /etc/systemd/system/scotty-trip.service
  systemctl daemon-reload
  systemctl restart scotty-trip.service
  systemctl is-active --quiet scotty-trip.service
  curl --retry 10 --retry-connrefused --retry-delay 1 -fsS http://127.0.0.1:3014/api/health
'

curl --retry 5 --retry-connrefused --retry-delay 1 -fsS https://scotty.jpop.cloud/api/health
