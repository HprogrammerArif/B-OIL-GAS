# 08 — DevOps, Environments & CI/CD

**Document:** 08 of the Production Platform Specification Suite
**Status:** Baseline v1.0 — 1 November 2026
**Audience:** DevOps, backend, web, mobile engineers; BOGCL IT infrastructure team
**Depends on:** `00_PLATFORM_OVERVIEW_AND_ARCHITECTURE.md` (§3 repo layout, ADR-02/03/04/05/09/10/17/19/20/21, §8 environments), `02_DATABASE_SCHEMA.md` (§7 migration policy), `07_SECURITY_COMPLIANCE_AND_NFR.md` (controls enforced by the pipeline, NFR targets, backups RPO/RTO)
**Conventions:** paths relative to repo root; shell samples are POSIX unless marked PowerShell; `<placeholder>` values are never real secrets.

> Current repository facts (1 Nov 2026): remote `https://github.com/HprogrammerArif/B-OIL-GAS.git`, default branch `master`; `server/`, `frontend/` and `infra/` contain only README stubs; `app/` is the Expo starter with `eas.json` already defining `development/preview/production` profiles; root has `.gitignore`, `.nvmrc`, `.editorconfig`, `.gitattributes`, `AGENTS.md` and `.cursor/` rules+skills, but no `package.json`, Husky or CI yet. Everything below describes the target state; the "Bootstrap tasks" list in §2.3 is the delta.

---

## 1. Principles

| Principle | Consequence |
| :--- | :--- |
| Same artefact everywhere | One Docker image per service is built once per commit and promoted dev → staging → production by tag; no environment-specific builds (web uses runtime `config.json`, see §5.3) |
| 12-factor configuration | All config via environment variables validated by zod at boot; a missing or malformed variable fails the container immediately |
| Trunk-based, short-lived branches | `main` is always deployable; feature branches < 3 days; releases are tags |
| Pipelines enforce the security gates | Lint, typecheck, tests, `prisma validate`, audit, gitleaks, Semgrep, Trivy are required checks (doc 07 §6.10–6.11) |
| On-prem first, cloud-portable | Docker Compose + Traefik on BOGCL VMs for pilot; Kubernetes-ready images and health contracts (ADR-21) |
| No manual production changes | Everything in `infra/` under version control; the deploy user has no shell write access outside `/opt/oneops`; emergency changes are followed by a PR within 24 h (`project.mdc`: never modify production configuration without approval) |

---

## 2. Repository Layout

### 2.1 Target layout

```
B-OIL-GAS/
├── client/                 FROZEN prototype (Vite+React). Not built or deployed. Never modified.
├── server/                 Express 5 + TS (ESM) + Prisma + BullMQ + Socket.IO — own package.json + package-lock.json
│   ├── prisma/             schema.prisma, migrations/, seed.ts
│   ├── src/                core/, modules/, jobs/, main.ts, worker.ts
│   ├── test/               integration (Testcontainers), k6 lives in infra/
│   ├── Dockerfile
│   └── .env.example
├── frontend/                    React 19 + Vite 6 + RTK Query — own package.json
│   ├── src/
│   ├── public/config.template.json   runtime config, filled by entrypoint (§5.3)
│   ├── nginx/default.conf.template
│   ├── Dockerfile
│   └── .env.example
├── app/                    Expo SDK 56 — own package.json, app.config.ts, eas.json
│   └── .env.example
├── infra/
│   ├── compose/            docker-compose.dev.yml, docker-compose.staging.yml, docker-compose.prod.yml
│   ├── traefik/            traefik.yml, dynamic/*.yml
│   ├── db/                 init.sql (extensions, roles), anonymise.sql, pgbackrest.conf
│   ├── observability/      prometheus.yml, alert-rules.yml, loki-config.yml, promtail.yml, grafana/dashboards/*.json
│   ├── k6/                 scenarios (doc 07 §11.7)
│   ├── runbooks/           *.md (§12)
│   └── scripts/            deploy.sh, rollback.sh, backup-verify.sh, rotate-jwt-key.sh
├── docs/
├── .github/
│   ├── workflows/          server-ci.yml, web-ci.yml, app-ci.yml, security.yml, deploy-dev.yml, deploy-staging.yml, deploy-prod.yml, release.yml
│   ├── CODEOWNERS
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── renovate.json
├── .cursor/rules/, .cursor/skills/, AGENTS.md
├── .husky/                 pre-commit, commit-msg
├── .editorconfig
├── .gitignore
├── .nvmrc                  22
├── commitlint.config.js
├── package.json            root: tooling only (husky, lint-staged, commitlint) — NOT a workspace
└── README.md
```

### 2.2 Why no npm workspaces (ADR summary)

Decided in doc 00 §3: Expo/Metro hoisting problems and the prototype's independence. Each of `client/`, `server/`, `frontend/`, `app/` has its own `package.json` and `package-lock.json`; CI caches per lockfile. Shared types are generated from the server's OpenAPI into `frontend/src/shared/api/generated/` and `app/src/types/generated/` by `npm run gen:api` in each client (reads `server/openapi.json` artefact).

Root `package.json` contains only:

```json
{
  "name": "b-oil-gas-tooling",
  "private": true,
  "scripts": { "prepare": "husky" },
  "devDependencies": { "husky": "^9", "lint-staged": "^15", "@commitlint/cli": "^19", "@commitlint/config-conventional": "^19" },
  "lint-staged": {
    "server/**/*.{ts,json}": "npm --prefix server run lint:staged --",
    "frontend/**/*.{ts,tsx,json,css}": "npm --prefix web run lint:staged --",
    "app/**/*.{ts,tsx,json}": "npm --prefix app run lint:staged --",
    "*": "gitleaks protect --staged --redact --no-banner"
  }
}
```

Package manager: **npm** (matches `client/` and the `app/` starter lockfiles; avoids a second toolchain on Windows machines and on BOGCL build hosts). `pnpm` is not used.

### 2.3 Bootstrap tasks (delta from today)

1. Rename default branch `master` → `main` (GitHub settings → branches; update local clones with `git branch -m master main && git fetch origin && git branch -u origin/main main`).
2. Add root `package.json` (tooling only), `.husky/`, `commitlint.config.js` (`.gitignore`, `.nvmrc`, `.editorconfig` already exist).
3. Scaffold the SPA inside `frontend/` (the directory already exists with a README; doc 00 §3 names it).
4. Create `server/`, `frontend/` from the scaffolding skills; keep `app/` and migrate it per doc 05.
5. Add `.github/` workflows, `CODEOWNERS`, PR template, `renovate.json`.
6. Enable branch protection on `main` (§7.7).

Root `.gitignore` (excerpt — each app extends it):

```
node_modules/
dist/
build/
coverage/
.env
.env.*
!.env.example
*.pem
*.p12
*.keystore
google-play-service-account.json
.expo/
.turbo/
*.log
.DS_Store
Thumbs.db
infra/compose/.data/
```

---

## 3. Local Development

### 3.1 Prerequisites

| Tool | Version | Notes |
| :--- | :--- | :--- |
| Node.js | 22 LTS (`.nvmrc` = `22`) | `fnm` recommended on Windows (`fnm use` reads `.nvmrc`); `nvm` on macOS/Linux |
| npm | 10.x (bundled) | `npm ci` only in CI; `npm install` locally |
| Docker Desktop | 4.30+ with Compose v2 | WSL 2 backend on Windows; allocate ≥ 6 GB RAM, 4 CPUs |
| Git | 2.40+ | `core.autocrlf=false`, `core.longpaths=true` on Windows |
| Expo tooling | `npx expo` (no global), EAS CLI ≥ 16 (`npm i -g eas-cli`) | Android Studio + emulator or a physical device with Expo Go/dev client; Xcode 16 on macOS for iOS |
| k6 | 0.50+ | Only for load tests |
| psql / pgcli | 16 | Optional; `docker compose exec postgres psql` works |

### 3.2 Compose services (`infra/compose/docker-compose.dev.yml`)

| Service | Image | Host port | Volume | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `postgres` | `postgis/postgis:16-3.4` | 5432 | `pgdata` | PG 16 + PostGIS (doc 02 extensions: pgcrypto, pg_trgm, postgis) |
| `redis` | `redis:7-alpine` | 6379 | `redisdata` | BullMQ, rate limits, sessions cache, Socket.IO adapter |
| `minio` | `minio/minio` | 9000 (S3), 9001 (console) | `miniodata` | S3-compatible storage; `mc` init container creates buckets `uploads`, `documents`, `quarantine` |
| `mailpit` | `axllent/mailpit` | 8025 (UI), 1025 (SMTP) | — | Catches all outgoing email |
| `clamav` | `clamav/clamav:stable` | 3310 | `clamdb` | Optional (`--profile av`); first start downloads ~300 MB definitions |
| `pgadmin` | `dpage/pgadmin4` | 5050 | — | Optional (`--profile tools`) |

Apps run on the host, not in containers, for fast reload: `server` on **4000**, `web` (Vite) on **5173**, Expo Metro on **8081**. Prometheus/Grafana are not part of the dev stack (use `docker-compose.staging.yml` locally if needed).

### 3.3 First run

```bash
# 1. clone and tooling
git clone https://github.com/HprogrammerArif/B-OIL-GAS.git && cd B-OIL-GAS
fnm use            # or: nvm use
npm install        # root tooling → installs husky hooks

# 2. infrastructure
docker compose -f infra/compose/docker-compose.dev.yml up -d
docker compose -f infra/compose/docker-compose.dev.yml --profile av up -d   # optional ClamAV

# 3. server
cd server && cp .env.example .env    # edit nothing for defaults; never commit .env
npm install
npm run prisma:migrate               # prisma migrate dev
npm run prisma:seed                  # seeds per doc 02 §6; persona passwords from SEED_PERSONA_PASSWORD in .env
npm run dev                          # tsx watch src/main.ts  → http://localhost:4000, OpenAPI at /api/v1/docs
npm run dev:worker                   # second terminal: BullMQ workers

# 4. web
cd ../web && cp .env.example .env && npm install
npm run gen:api                      # types from ../server/openapi.json (server must have been built or running)
npm run dev                          # http://localhost:5173

# 5. mobile
cd ../app && cp .env.example .env && npm install
npx expo start                       # EXPO_PUBLIC_API_URL must point to the host's LAN IP, e.g. http://192.168.1.20:4000
```

Per-app scripts (identical names across apps where applicable):

| Script | server | web | app |
| :--- | :--- | :--- | :--- |
| `dev` | `tsx watch src/main.ts` | `vite` | `expo start` |
| `build` | `tsc -p tsconfig.build.json && npm run openapi:emit` | `tsc -b && vite build` | — (EAS) |
| `typecheck` | `tsc --noEmit` | `tsc --noEmit` | `tsc --noEmit` |
| `lint` / `lint:staged` | `eslint .` / `eslint --fix` | same | same |
| `test` / `test:int` | `vitest run` / `vitest run --config vitest.int.config.ts` (Testcontainers) | `vitest run` | `jest` |
| `e2e` | — | `playwright test` | `maestro test .maestro/` |
| `prisma:*` | `generate`, `migrate` (dev), `deploy`, `seed`, `studio`, `validate` | — | — |
| `gen:api` | — | `openapi-typescript ../server/openapi.json -o src/shared/api/generated/schema.d.ts` | same into `src/types/generated/` |

### 3.4 Editor setup (VS Code / Cursor)

`.vscode/extensions.json` (recommended): `dbaeumer.vscode-eslint`, `esbenp.prettier-vscode`, `Prisma.prisma`, `bradlc.vscode-tailwindcss`, `ms-azuretools.vscode-docker`, `expo.vscode-expo-tools`, `ms-playwright.playwright`, `vitest.explorer`, `redhat.vscode-yaml`, `EditorConfig.EditorConfig`, `streetsidesoftware.code-spell-checker` (with a `bn` word list), `lokalise.i18n-ally`.

`.vscode/settings.json` (shared): `"editor.formatOnSave": true`, `"editor.defaultFormatter": "esbenp.prettier-vscode"`, `"editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }`, `"eslint.workingDirectories": [{ "pattern": "./server" }, { "pattern": "./web" }, { "pattern": "./app" }]`, `"files.eol": "\n"`, `"typescript.tsdk": "server/node_modules/typescript/lib"`, `"i18n-ally.localesPaths": ["frontend/src/locales", "app/src/locales"]`.

`.editorconfig`: `end_of_line = lf`, `charset = utf-8`, `indent_style = space`, `indent_size = 2`, `insert_final_newline = true`, `trim_trailing_whitespace = true`.

### 3.5 Windows notes

- Use PowerShell 7 or Git Bash; scripts in `package.json` avoid bash-isms (use `cross-env`, `rimraf`, `shx`).
- Line endings: `git config --global core.autocrlf false` and `.gitattributes` with `* text=auto eol=lf`; `*.sh text eol=lf`; Dockerfiles copy scripts that must be LF.
- Path length: `git config --system core.longpaths true`; enable Win32 long paths (`HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled=1`) — Expo/Metro and Prisma generate deep paths.
- Docker Desktop: keep the repo on the Windows filesystem (not WSL `\\wsl$`) when using host-run Node; bind mounts are only used for `infra/db/init.sql`.
- Expo on a physical Android device: `adb reverse tcp:8081 tcp:8081` and `adb reverse tcp:4000 tcp:4000` so `EXPO_PUBLIC_API_URL=http://localhost:4000` works over USB.
- Firewall: allow Node (ports 4000, 5173, 8081) on the private network profile for LAN device testing.
- Testcontainers works with Docker Desktop; set `TESTCONTAINERS_RYUK_DISABLED=true` only if Ryuk is blocked by corporate policy.

---

## 4. Environment Matrix

| Env | Purpose | URL pattern | Data | Deploy trigger | Who deploys | Feature flags | Secrets source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `local` | Developer machine | `http://localhost:5173` web, `http://localhost:4000` api, `http://localhost:9001` MinIO console, `http://localhost:8025` Mailpit | Seed (doc 02 §6) | `npm run dev` | Developer | All on via `.env` | `.env` from `.env.example` |
| `dev` | Shared integration; QA smoke; mobile `development` channel | `https://dev-oneops.bashundhara.com` (web) · `https://api.dev-oneops.bashundhara.com` · `https://files.dev-oneops.bashundhara.com` | Seed + QA-generated; reset weekly | Auto on merge to `main` | GitHub Actions (`deploy-dev.yml`) | Any; toggled via `Setting feature.*` by QA | GitHub Environment `dev` |
| `staging` | UAT with BOGCL; load/chaos tests; mobile `preview` channel; mirrors prod sizing | `https://staging-oneops.bashundhara.com` · `https://api.staging-oneops…` · `https://files.staging-oneops…` | Anonymised copy of prod (doc 07 §5.9) refreshed monthly; synthetic load data | Release-candidate tag `vX.Y.Z-rc.N` | GitHub Actions after CI green | Prod-like; new flags off by default | GitHub Environment `staging` (required reviewer: tech lead) |
| `production` | Live | `https://oneops.bashundhara.com` · `https://api.oneops.bashundhara.com` · `https://files.oneops.bashundhara.com` | Real | Tag `vX.Y.Z` + manual approval | Release manager via GitHub Environment gate | Changed only through 4-eyes admin flow (doc 07 §4.6) | Vault / Docker secrets on the hosts; GitHub holds only SSH deploy key |

Notes:
- Doc 00 §8 shows a single host with web+api behind nginx; this document uses separate hostnames behind Traefik so cookies stay host-only and CORS is explicit. Both satisfy ADR-21; DNS names are to be confirmed by BOGCL IT.
- `dev` deploys from `main` (trunk-based; doc 00 §8 updated).
- Feature flags are simple: `Setting` rows with key `feature.<name>` read through a cached `isEnabled()` helper, plus build-time `VITE_FEATURE_*` only for code that must be tree-shaken. No third-party flag service.

---

## 5. Configuration

### 5.1 Rules

- Loaded once in `server/src/core/config.ts` with a zod schema; `config` is a frozen typed object; no `process.env` reads elsewhere (ESLint `no-process-env` with that file allow-listed).
- Every variable supports a `*_FILE` twin (reads the file content, for Docker/Swarm secrets).
- `NODE_ENV=production` tightens the schema: `CORS_ORIGINS` must be https, `JWT_PRIVATE_KEY` required, `SEED_PERSONA_PASSWORD` forbidden, `LOG_LEVEL` ≤ `info`.
- `.env.example` files list every variable with a placeholder and a one-line comment; CI job `env-example-check` fails if the zod schema and `.env.example` drift (script compares keys).
- Secrets never printed: config loader logs only the key names it loaded and masks values.

### 5.2 Server variable catalog (`server/.env.example`)

| Variable | Required | Example / default | Purpose |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | ✔ | `development` | `development|test|production` |
| `APP_ENV` | ✔ | `local` | `local|dev|staging|production` (labels, metrics, Sentry env) |
| `APP_BASE_URL` | ✔ | `http://localhost:5173` | Web origin used in emails/SMS links and `/verify` QR |
| `API_BASE_URL` | ✔ | `http://localhost:4000` | Self URL for OpenAPI servers, presign callbacks |
| `PORT` | | `4000` | HTTP port |
| `HOST` | | `0.0.0.0` | Bind address |
| `TRUST_PROXY` | | `1` | Hops behind Traefik |
| `LOG_LEVEL` | | `debug` (local) / `info` | pino level |
| `LOG_PRETTY` | | `true` (local) | pino-pretty in dev only |
| `DATABASE_URL` | ✔ | `postgresql://oneops_app:CHANGE_ME@localhost:5432/oneops?schema=public` | Prisma (app role) |
| `DATABASE_MIGRATE_URL` | CI/CD | `postgresql://oneops_migrate:CHANGE_ME@…` | `prisma migrate deploy` only |
| `DATABASE_REPLICA_URL` | | — | Read replica for reports/audit (optional) |
| `DATABASE_POOL_SIZE` | | `20` | Prisma `connection_limit` |
| `REDIS_URL` | ✔ | `redis://localhost:6379/0` | BullMQ, cache, rate limit, Socket.IO adapter |
| `REDIS_KEY_PREFIX` | | `oneops:local:` | Isolates envs sharing a Redis |
| `JWT_ISSUER` | | `oneops` | `iss` |
| `JWT_AUDIENCE` | | `oneops-api` | `aud` |
| `JWT_PRIVATE_KEY` | ✔ | PEM (Ed25519) | Access-token signing; generate with `openssl genpkey -algorithm ed25519` |
| `JWT_PUBLIC_KEYS` | ✔ | JSON `{"k1":"<pem>"}` | All currently valid public keys (JWKS) |
| `JWT_ACTIVE_KID` | ✔ | `k1` | Key used for new tokens |
| `JWT_ACCESS_TTL` | | `15m` | |
| `REFRESH_TTL` | | `30d` | Refresh family lifetime |
| `SESSION_MAX_PER_USER` | | `5` | |
| `SESSION_IDLE_TIMEOUT_MFA` | | `30m` | Doc 07 §3.4 |
| `SESSION_IDLE_TIMEOUT` | | `12h` | |
| `COOKIE_DOMAIN` | | — (host-only) | Leave empty |
| `COOKIE_SECURE` | | `false` local / `true` | |
| `MFA_ISSUER` | | `BOGCL OneOps` | TOTP label |
| `MFA_ENFORCED_ROLES` | | `CHAIRMAN,DIRECTOR,PLANT_GM,FINANCE,SUPER_ADMIN` | |
| `ENCRYPTION_KEYS` | ✔ | JSON `{"k1":"<base64 32 bytes>"}` | AES-256-GCM field encryption |
| `ENCRYPTION_ACTIVE_KEY_ID` | ✔ | `k1` | |
| `WATCHLIST_HMAC_KEY` | ✔ | base64 32 bytes | Watchlist ID matching |
| `PASSWORD_MIN_LENGTH` | | `12` | |
| `PASSWORD_MIN_ZXCVBN` | | `3` | |
| `LOCKOUT_THRESHOLD` | | `5` | |
| `LOCKOUT_MINUTES` | | `15` | |
| `RATE_LIMIT_API_PER_MIN` | | `600` | Per user |
| `RATE_LIMIT_LOGIN_PER_MIN` | | `5` | Per user |
| `RATE_LIMIT_LOGIN_IP_PER_15M` | | `20` | |
| `RATE_LIMIT_OTP_PER_10M` | | `5` | |
| `RATE_LIMIT_UPLOADS_PER_HOUR` | | `30` | |
| `CORS_ORIGINS` | ✔ | `http://localhost:5173` | Comma-separated exact origins |
| `BODY_LIMIT` | | `1mb` | |
| `S3_ENDPOINT` | ✔ | `http://localhost:9000` | MinIO/S3 |
| `S3_PUBLIC_ENDPOINT` | ✔ | `http://localhost:9000` | Hostname embedded in presigned URLs (edge hostname in prod) |
| `S3_REGION` | | `ap-south-1` | |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | ✔ | `CHANGE_ME` | Service account scoped to the three buckets |
| `S3_BUCKET_UPLOADS` / `S3_BUCKET_DOCUMENTS` / `S3_BUCKET_QUARANTINE` | | `uploads` / `documents` / `quarantine` | |
| `S3_FORCE_PATH_STYLE` | | `true` | MinIO |
| `PRESIGN_PUT_TTL` / `PRESIGN_GET_TTL` | | `300` / `300` | Seconds |
| `UPLOAD_MAX_BYTES` | | `26214400` | 25 MB cap |
| `CLAMAV_HOST` / `CLAMAV_PORT` | | `localhost` / `3310` | Empty host disables scanning in local only (never in prod schema) |
| `SMTP_HOST` / `SMTP_PORT` | ✔ | `localhost` / `1025` | Mailpit locally |
| `SMTP_USER` / `SMTP_PASS` | | — | |
| `SMTP_SECURE` | | `false` | STARTTLS when `false` on 587 |
| `MAIL_FROM` | ✔ | `OneOps <no-reply@oneops.bashundhara.com>` | |
| `SMS_PROVIDER` | ✔ | `mock` | `mock|ssl_wireless|banglalink|gp` |
| `SMS_API_URL` / `SMS_API_KEY` / `SMS_SENDER_ID` | prod | — | Provider adapter |
| `SMS_DLR_SECRET` | prod | — | Validates delivery-report callbacks |
| `EXPO_PUSH_ACCESS_TOKEN` | prod | — | Expo Push API (enhanced security) |
| `EXPO_PUSH_URL` | | `https://exp.host/--/api/v2/push/send` | |
| `SENTRY_DSN` | | — | Empty disables |
| `SENTRY_TRACES_SAMPLE_RATE` | | `0.1` | |
| `SENTRY_RELEASE` | CI | `server@<sha>` | Set by build |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | | — | Optional tracing (ADR-09) |
| `METRICS_ENABLED` | | `true` | `/metrics` on `METRICS_PORT` |
| `METRICS_PORT` | | `9464` | Internal network only |
| `QUEUE_CONCURRENCY_NOTIFICATIONS` / `_FILES` / `_PDF` / `_REMINDERS` / `_EXPORTS` | | `10/4/2/4/2` | Worker concurrency |
| `PDF_RENDERER_URL` | | — | If Playwright runs in a separate container; empty = in-process worker |
| `GEOFENCE_MAX_ACCURACY_M` | | `50` | Doc 00 §6.7 |
| `IDEMPOTENCY_TTL_HOURS` | | `24` | |
| `RETENTION_JOBS_ENABLED` | | `true` | |
| `MAINTENANCE_MODE` | | `off` | `off|readonly|full` |
| `SEED_PERSONA_PASSWORD` | local/dev only | `CHANGE_ME` | Password for seeded personas; forbidden in production schema |
| `BREAK_GLASS_ALERT_EMAILS` | prod | `it-head@…,chairman-office@…` | Doc 07 §4.5 |

### 5.3 Web variables (`frontend/.env.example`)

Build-time (`VITE_*`, baked into the bundle — only non-secret, environment-independent values):

| Variable | Example | Purpose |
| :--- | :--- | :--- |
| `VITE_APP_NAME` | `BOGCL OneOps` | |
| `VITE_DEFAULT_LANG` | `en` | |
| `VITE_FEATURE_VOICE_BRIEFING` | `true` | Tree-shaken feature code |

Runtime (`/config.json`, written by the nginx container entrypoint from env so one image serves all envs):

| Variable (container env) | JSON key | Example |
| :--- | :--- | :--- |
| `API_URL` | `apiUrl` | `https://api.staging-oneops.bashundhara.com` |
| `WS_URL` | `wsUrl` | `wss://api.staging-oneops.bashundhara.com` |
| `FILES_URL` | `filesUrl` | `https://files.staging-oneops.bashundhara.com` |
| `SENTRY_DSN` | `sentryDsn` | public DSN (not a secret, but still per env) |
| `APP_ENV` | `env` | `staging` |
| `RELEASE` | `release` | `web@1.4.0+abc1234` |

The SPA fetches `/config.json` before rendering (`Cache-Control: no-store`). Locally, Vite serves `public/config.json` generated from `.env` by `npm run dev` pre-script.

### 5.4 Mobile variables (`app/.env.example` and EAS)

| Variable | Where | Example |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | `.env` local; `eas.json` `env` per profile; EAS environment variables for secrets-free values | `http://192.168.1.20:4000` local; `https://api.oneops.bashundhara.com` production |
| `EXPO_PUBLIC_WS_URL` | same | |
| `EXPO_PUBLIC_FILES_URL` | same | |
| `EXPO_PUBLIC_APP_ENV` | same | `development|preview|production` |
| `EXPO_PUBLIC_SENTRY_DSN` | same | |
| `SENTRY_AUTH_TOKEN` | EAS secret (never `EXPO_PUBLIC_`) | Source-map upload at build |
| `EXPO_UPDATES_CODE_SIGNING_PRIVATE_KEY` | CI secret | OTA signing (doc 07 §8) |
| `GOOGLE_SERVICES_JSON` / `GOOGLE_SERVICE_INFO_PLIST` | EAS file secrets | FCM/APNs config |

`EXPO_PUBLIC_*` values are embedded in the bundle; they must never contain secrets. `app.config.ts` reads them and sets `extra`, `updates.url`, `runtimeVersion` (`{ policy: "appVersion" }`), bundle ids `com.bashundhara.oneops` (replacing the starter's `com.example.reactnativestarter`).

### 5.5 Secrets handling summary

| Env | Mechanism |
| :--- | :--- |
| local | `.env` per app (git-ignored); never shared via chat; `SEED_PERSONA_PASSWORD` is per developer |
| dev / staging | GitHub Environments → written by the deploy workflow over SSH into `/opt/oneops/secrets/<service>.env` (mode 600, owner `oneops`); compose uses `env_file` |
| production | HashiCorp Vault (self-hosted on-prem, KV v2, AppRole for the deploy host) rendered by `vault agent` into `/run/oneops/secrets/*` as files; compose passes `*_FILE` variables. Fallback for the pilot: Docker Swarm secrets. GitHub never holds production application secrets — only the SSH deploy key to the bastion |
| Rotation | Runbook `rotate-secrets.md` (§12); JWT and encryption keys support overlap by design (doc 07 §3.4, §5.2) |

---

## 6. Containerisation

### 6.1 Server image (`server/Dockerfile`) — see Appendix B

- Multi-stage: `deps` (`npm ci --ignore-scripts`), `build` (`prisma generate`, `tsc`), `runtime` (`node:22-alpine` pinned by digest, `npm ci --omit=dev --ignore-scripts` + `prisma generate`, copy `dist/`, `prisma/`).
- Non-root `node` user; read-only root filesystem with `tmpfs` for `/tmp`; `dumb-init` as PID 1; `NODE_OPTIONS=--enable-source-maps --max-old-space-size=768`.
- Entrypoints: `node dist/main.js` (API) and `node dist/worker.js` (workers) from the same image; migrations run as a one-off container `npx prisma migrate deploy` (needs `openssl` in alpine — installed).
- `HEALTHCHECK` hits `/healthz` (liveness: process up) — readiness `/readyz` (DB, Redis, MinIO reachable, migrations current) is used by Traefik and deploy scripts, not by Docker's healthcheck.
- Playwright/Chromium is **not** in the API image; PDF rendering runs in `oneops-pdf` built from `mcr.microsoft.com/playwright:v1.4x-noble` with the worker code, `network_mode: none` except the internal network, no ingress.

### 6.2 Web image (`frontend/Dockerfile`)

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
ARG RELEASE
ENV VITE_RELEASE=$RELEASE
RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN apk add --no-cache gettext brotli && rm /etc/nginx/conf.d/default.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/40-config-json.sh /docker-entrypoint.d/40-config-json.sh
RUN chmod +x /docker-entrypoint.d/40-config-json.sh \
 && find /usr/share/nginx/html -type f \( -name '*.js' -o -name '*.css' -o -name '*.svg' -o -name '*.woff2' \) \
    -exec gzip -9 -k {} \; -exec brotli -9 -k {} \; \
 && chown -R nginx:nginx /usr/share/nginx/html /etc/nginx/templates
USER nginx
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
```

`nginx/default.conf.template` essentials: `listen 8080`; `gzip_static on; brotli_static on;` (brotli via the `ngx_brotli` module in the official image's `nginx:alpine` variant with `brotli_static` — if the module is unavailable, precompressed `.br` files are served by Traefik's compress middleware instead); SPA fallback `try_files $uri /index.html`; `index.html` and `/config.json` → `Cache-Control: no-store`; `/assets/*` (hashed) → `Cache-Control: public, max-age=31536000, immutable`; security headers incl. the CSP from doc 07 §6.6; `location = /healthz { return 200; }`; `server_tokens off`.

`40-config-json.sh` writes `/usr/share/nginx/html/config.json` from `API_URL`, `WS_URL`, `FILES_URL`, `SENTRY_DSN`, `APP_ENV`, `RELEASE` using `envsubst` on `config.template.json`.

### 6.3 Image naming, tagging, SBOM, scanning

| Item | Rule |
| :--- | :--- |
| Registry | GitHub Container Registry `ghcr.io/hprogrammerarif/oneops-{server,web,pdf}`; mirrored to an on-prem Harbor/registry at BOGCL for air-gapped pulls (`registry.oneops.bashundhara.local`) |
| Tags | Every `main` build: `sha-<12>`; release: `vX.Y.Z` and `X.Y`, plus `latest` only for the server/web on production release; RCs: `vX.Y.Z-rc.N`. Deploy scripts always pin by digest recorded in the release notes |
| Labels | OCI labels: `org.opencontainers.image.revision`, `.version`, `.created`, `.source` |
| SBOM | `anchore/sbom-action` (syft) → CycloneDX JSON attached to the GitHub release and pushed as an OCI artefact |
| Scan | `aquasecurity/trivy-action` on the image (`CRITICAL,HIGH`, ignore-unfixed) — blocking; Trivy config scan on Dockerfiles/compose |
| Signing | `cosign sign --yes` with GitHub OIDC keyless on release images; deploy script verifies signature before `docker compose pull` (`cosign verify`) |
| Base image refresh | Renovate bumps digests weekly; `release.yml` also rebuilds monthly (`schedule`) to pick up alpine patches |

---

## 7. Continuous Integration (GitHub Actions)

The repo lives on GitHub; if it is ever mirrored to Cursor Origin, the same workflows apply (Origin runs GitHub-compatible checks and exposes `checks_read`/`rerun_checks`); nothing below is GitHub-only except Environments and Dependabot alerts.

### 7.1 Workflows and path filters

| Workflow | Trigger | Paths | Jobs |
| :--- | :--- | :--- | :--- |
| `server-ci.yml` | PR + push `main` | `server/**`, `.github/workflows/server-ci.yml` | `lint-typecheck`, `unit`, `integration` (PG + Redis services, `prisma validate`, `prisma migrate deploy`, Supertest), `build-image` (push `sha-*` on `main` only), `openapi-diff` |
| `web-ci.yml` | PR + push `main` | `frontend/**`, `server/openapi.json` | `lint-typecheck`, `unit`, `build`, `e2e` (Playwright against `docker-compose.ci.yml`: server image from this PR or `main`, PG, Redis, MinIO, Mailpit), `lighthouse` (non-blocking), `build-image` |
| `app-ci.yml` | PR + push `main` | `app/**` | `lint-typecheck`, `unit` (jest-expo), `expo-doctor`, `eas-update-preview` (on `main`: `eas update --branch development`), `eas-build` only on tags |
| `security.yml` | PR + push `main` + nightly | all | `gitleaks`, `semgrep`, `npm-audit` (per app, prod deps), `dependency-review` (PR only), `trivy-fs`, `env-example-check`, `i18n-parity` |
| `release.yml` | Tag `v*` | — | Builds and signs images for the tag, SBOM, `oasdiff` vs previous tag, GitHub Release with changelog (conventional commits), triggers `deploy-staging` for `-rc.*` or `deploy-prod` for final |
| `deploy-dev.yml` | `workflow_run` of server/web CI success on `main` | — | SSH deploy to dev host (§8.2) |
| `deploy-staging.yml` | From `release.yml` (rc tags) | — | Environment `staging` (1 reviewer) |
| `deploy-prod.yml` | From `release.yml` (final tags) | — | Environment `production` (2 reviewers incl. BOGCL IT), change-window check |
| `nightly.yml` | 02:30 Asia/Dhaka | — | k6 smoke on staging, ZAP baseline on staging (weekly), backup verification report, `gitleaks` full history |

### 7.2 Caching

- `actions/setup-node@v4` with `cache: npm` and `cache-dependency-path: <app>/package-lock.json`.
- Prisma engines cached via `~/.cache/prisma`.
- Playwright browsers cached by version key (`~/.cache/ms-playwright`).
- Docker layers: `docker/build-push-action` with `cache-from/to: type=gha,scope=<image>`.
- Expo: `~/.npm` only; EAS builds run on Expo's infrastructure.

### 7.3 Required checks on `main`

`server / lint-typecheck`, `server / unit`, `server / integration`, `web / lint-typecheck`, `web / unit`, `web / e2e`, `app / lint-typecheck`, `app / unit`, `security / gitleaks`, `security / semgrep`, `security / npm-audit`, `security / dependency-review`, `commitlint`. Path-filtered jobs that are skipped report success via a lightweight `paths-filter` + `if:` pattern so merges are not blocked on untouched apps.

### 7.4 Commit and PR conventions

- Conventional Commits enforced by `commitlint` (husky `commit-msg` locally, `wagoid/commitlint-github-action` in CI on PR titles and commits). Scopes: `server`, `web`, `app`, `infra`, `docs`, `deps`, module names (`claims`, `fleet`…).
- Squash-merge only; PR title becomes the commit; changelog generated by `conventional-changelog` in `release.yml`.
- `PULL_REQUEST_TEMPLATE.md` sections: *What / Why*, *Module(s)*, *Screenshots (frontend/mobile)*, *Migration?* (expand/contract plan if yes), *Permissions touched?*, *Security checklist* (input validated, scope applied, audit written, no secrets), *Tests added*, *Docs updated (03/06 if API/behaviour changed)*.
- `CODEOWNERS`: `/server/` backend lead; `/frontend/` web lead; `/app/` mobile lead; `/infra/` `/.github/` DevOps + backend lead; `/docs/platform/` tech lead; `/server/prisma/` backend lead + DBA; `/server/src/modules/auth/` and `/server/src/core/authz/` security reviewer required.

### 7.5 Branch strategy

| Item | Rule |
| :--- | :--- |
| Trunk | `main`; protected: PR required, 1 approval (2 for `server/src/core/**`, `server/prisma/**`), required checks, linear history, no force-push, signed commits recommended |
| Feature branches | `feat/<module>-<short>`, `fix/<module>-<short>`, `chore/…`; lifetime ≤ 3 days; rebase on `main` before merge |
| Releases | Tags only, SemVer `vX.Y.Z`: `X` breaking API (`/api/v2`), `Y` features, `Z` fixes. RC tags `vX.Y.Z-rc.N` deploy to staging. Release branch `release/X.Y` is cut **only** if a hotfix is needed on an older minor still in production |
| Hotfix | Branch `hotfix/<issue>` from the production tag → PR to `main` → tag `vX.Y.Z+1` directly (skips RC when the change is ≤ 50 lines and has tests; otherwise RC first) → cherry-pick is unnecessary because `main` already has it |
| Mobile | Same tags; `app` builds triggered by tags matching `app-vX.Y.Z` to decouple store releases from server releases when needed |
| Versioning files | `server/package.json`, `frontend/package.json`, `app/app.config.ts` versions bumped by `release.yml` (`npm version --no-git-tag-version`) in a release PR, not by hand |

---

## 8. Continuous Delivery

### 8.1 Deployment target decision

| Option | Pros | Cons | Verdict |
| :--- | :--- | :--- | :--- |
| **A. On-prem/colo VMs + Docker Compose + Traefik** (PG primary + streaming replica, MinIO, Redis, pgBackRest offsite) | Data sovereignty (ADR-05/21), BOGCL IT already runs VMs, predictable cost, simple ops surface, no egress dependency | Manual failover for PG in pilot, team owns patching, no autoscaling | **Recommended for pilot and v1 production** |
| B. Kubernetes (on-prem k3s/RKE2 or ECS/EKS) | Rolling updates, autoscaling, HA control plane, GitOps | Operational complexity for a 2–3 person team; BOGCL has no cluster today | Target for year 2+ if the group standardises; images already comply |
| C. Managed PaaS (Render/Fly/Railway + Neon/RDS + Upstash) | Fastest to stand up, zero server ops | Data outside Bangladesh, recurring USD cost, latency from BD (Singapore region ≈ 60–80 ms), vendor lock-in; conflicts with on-prem preference | Only for throwaway `dev` if BOGCL cannot provide a dev VM quickly |

Recommended topology (production):

```
Internet/Intranet ──► [VM-edge]   Traefik v3 (TLS, rate-limit, access logs), Promtail
                      [VM-app-1]  oneops-server ×2, oneops-worker ×2, oneops-pdf ×1, node-exporter, cAdvisor
                      [VM-app-2]  same (second host; Traefik round-robins; Redis replica; MinIO node 2)
                      [VM-db-1]   PostgreSQL 16 primary, pgBackRest, Redis primary, node-exporter, postgres-exporter
                      [VM-db-2]   PostgreSQL 16 streaming replica (hot standby), MinIO node 1 (4 drives, EC:2)
                      [VM-obs]    Prometheus, Alertmanager, Grafana, Loki, Uptime-Kuma, Vault (pilot: same VM; later separate)
                      Offsite      pgBackRest repo2 (S3 bucket at CTG terminal MinIO or BD cloud) + MinIO bucket replication
```

Pilot (≤ 300 users, 3 months) may collapse to **two VMs** (app+edge+obs, db+storage) with the same compose files and a documented promotion path.

### 8.2 Deployment mechanics (Compose hosts)

- Deploy user `oneops` on each host; `/opt/oneops/{compose,secrets,data}`; Docker rootful but containers non-root, `no-new-privileges`, read-only FS, `cap_drop: [ALL]`.
- `infra/scripts/deploy.sh <env> <tag>`:
  1. `cosign verify` images; `docker compose pull`.
  2. Run migration container: `docker compose run --rm migrate` (`prisma migrate deploy` with `DATABASE_MIGRATE_URL`); abort if it fails.
  3. Rolling restart: `docker compose up -d --no-deps --scale server=2 server` one replica at a time — Traefik health checks `/readyz` every 5 s; a replica is only added to the pool when ready; previous replica drained (30 s) before stop.
  4. Workers: `docker compose up -d --no-deps worker` (BullMQ jobs are idempotent and resume).
  5. Web: `docker compose up -d --no-deps web` (nginx restarts in < 1 s; Traefik retries).
  6. Smoke: `curl /readyz`, login with the synthetic monitor user, `GET /api/v1/me`; mark deployment in Grafana annotations and Sentry release.
- GitHub Actions reaches hosts via SSH through a bastion with a per-environment deploy key stored in the GitHub Environment; production additionally requires the change-window job (`Fri 00:00–04:00` or an approved exception label on the release PR).

### 8.3 Zero-downtime rules

| Topic | Rule |
| :--- | :--- |
| Migrations | Expand/contract (doc 02 §7): release N adds columns/tables/indexes (`CREATE INDEX CONCURRENTLY` via raw migration), code writes both; release N+1 backfills; release N+2 drops. Never rename in place. `prisma migrate deploy` runs **before** new code starts and must be compatible with the old code still running |
| Long migrations | Backfills are BullMQ jobs or `infra/db/backfill-*.sql` run in batches, not migration steps |
| Health | `/healthz` → 200 if process alive; `/readyz` → 200 only if DB (`SELECT 1`), Redis (`PING`), MinIO (`HEAD bucket`) succeed and `prisma migrate status` reports no pending migrations (cached 30 s) |
| Graceful shutdown | SIGTERM → stop accepting, finish in-flight (≤ 25 s), close Socket.IO with reconnect hint, close pools; Docker `stop_grace_period: 30s` |
| Sockets | Clients reconnect automatically to another replica; missed notifications are fetched on reconnect (`since` cursor) |
| Blue/green (optional) | Compose project names `oneops-blue`/`oneops-green` with Traefik weighted routing; used for major versions or risky releases; otherwise rolling is sufficient |

### 8.4 Rollback

1. `infra/scripts/rollback.sh <env> <previous-tag>` re-points compose to the previous digest and performs the same rolling restart (< 10 min).
2. Database: migrations are forward-only; because of expand/contract the previous code runs on the new schema. If a migration must be undone, apply a new forward migration that reverses it (tested on staging), or restore to a point in time (last resort, §11).
3. Web: previous image restores previous assets; clients hard-refresh via a `version` check in `/config.json` (the SPA shows "new version available").
4. Mobile: OTA rollback = `eas update --branch production --republish --group <previous-group-id>`; native regressions require a store build.
5. Every rollback produces an incident ticket and a Grafana annotation.

### 8.5 Database migration gates (CI + CD)

| Gate | Where |
| :--- | :--- |
| `prisma validate` and `prisma format --check` | server CI |
| `prisma migrate deploy` on an empty ephemeral PG, then `prisma migrate diff --from-migrations --to-schema-datamodel` must be empty | server CI |
| Destructive statement detector (`DROP TABLE|DROP COLUMN|ALTER … TYPE` in a new migration) → requires label `migration:destructive` and the expand/contract note in the PR | server CI |
| Migration dry-run on a fresh restore of last night's staging backup (timing recorded; > 5 min → must be converted to a backfill job) | `deploy-staging` |
| Pre-deploy backup snapshot (`pgbackrest backup --type=diff`) | `deploy-prod` |

---

## 9. Mobile Release (EAS)

### 9.1 Pipeline

| Stage | Command / trigger | Output |
| :--- | :--- | :--- |
| PR | `app-ci.yml`: lint, typecheck, jest-expo, `expo-doctor` | Checks |
| Merge to `main` | `eas update --branch development --message "<sha>"` | OTA to internal dev-client builds |
| RC tag `app-vX.Y.Z-rc.N` | `eas build --profile preview --platform all --non-interactive --no-wait` then `eas submit` is **not** run; APK/IPA distributed via EAS internal distribution + TestFlight (internal) | UAT builds for BOGCL testers |
| Final tag `app-vX.Y.Z` | `eas build --profile production --platform all --auto-submit` → Play **internal testing** track and TestFlight; promotion to production tracks is manual in the consoles after UAT sign-off | Store builds |
| JS-only fix on a released version | `eas update --branch production --message "fix: …"` after CI green on `main` and a `hotfix` label | OTA within minutes |

Channels/branches map to profiles already present in `app/eas.json`: `development` (dev client, `EXPO_PUBLIC_API_URL` → dev API), `preview` (internal APK/IPA, staging API), `production` (store, production API). `runtimeVersion` policy `appVersion`: any native dependency change bumps the app version, which creates a new runtime and prevents incompatible OTA.

### 9.2 OTA policy

| Change | Delivery |
| :--- | :--- |
| JS/TS, assets, translations, RTK Query endpoints | OTA (`expo-updates`), signed (doc 07 §8), staged rollout: `development` → `preview` 24 h → `production` |
| New native module, Expo SDK upgrade, permission change, app icon/splash, `app.config.ts` plugin change | Store build (new `runtimeVersion`) |
| API breaking change | Server keeps `/api/v1` until all runtimes older than 60 days are below 2 % of active devices (Sentry release adoption) |
| Forced update | Server `GET /api/v1/mobile/min-version` → app blocks usage below the minimum with a store link; used only for security fixes |

### 9.3 Versioning, stores, quality

- `version` = marketing `X.Y.Z`; `android.versionCode`/`ios.buildNumber` auto-incremented by EAS (`autoIncrement: true` already set for production).
- Identifiers: `com.bashundhara.oneops` (Android), `com.bashundhara.oneops` (iOS); scheme `oneops://`; universal links `https://oneops.bashundhara.com/app/*`.
- Distribution: **Google Play** (closed testing with BOGCL Google Workspace group → production, or Managed Google Play private app if the group uses an MDM) and **Apple**: App Store with a private/unlisted distribution, or Apple Business Manager custom app; `enterpriseProvisioning: universal` in `eas.json` indicates an Apple Developer Enterprise option — decide with BOGCL before the first iOS build.
- Store listing requirements: privacy policy URL (hosted at `https://oneops.bashundhara.com/privacy`), data-safety form (location "while in use" for attendance, camera, microphone, no ads, data encrypted in transit, deletion on request), screenshots per device class in EN/BN, age rating, test credentials for review (a `REVIEWER` seeded account on staging with MFA disabled).
- Crash-free targets: sessions ≥ 99.5 %, users ≥ 99 % (Sentry); ANR rate < 0.3 %; app start p95 < 2.5 s. A release is halted/rolled back if crash-free sessions drop below 98.5 % in the first 24 h.
- Beta cadence: weekly `preview` build during UAT, monthly store release after go-live, OTA as needed.

---

## 10. Observability

### 10.1 Logs

- pino JSON (doc 07 §9) → stdout → Docker json-file (max 100 MB × 5) → **Promtail** → **Loki** (single binary, filesystem/MinIO backend). Labels: `env`, `service`, `host`, `level`; everything else is JSON fields queried via LogQL `| json`.
- Traefik access logs JSON to Loki with the same `requestId` (Traefik injects `X-Request-Id` if absent; API echoes it).
- Retention: 90 d hot (Loki), 1 y compacted in MinIO (`logs-archive` bucket), per doc 07 §5.8.
- Alternative if BOGCL already runs ELK: ship the same JSON with Filebeat; nothing in the app changes.

### 10.2 Metrics (Prometheus) and dashboards (Grafana)

Exposed by server/worker on `:9464/metrics` (prom-client), scraped over the internal network:

| Metric | Type | Labels |
| :--- | :--- | :--- |
| `http_request_duration_seconds` | histogram | `method`, `route` (templated), `status` |
| `http_requests_in_flight` | gauge | — |
| `oneops_auth_events_total` | counter | `event` (`login_success`, `login_failed`, `locked`, `mfa_failed`, `refresh_reuse`) |
| `oneops_permission_denied_total` | counter | `permission` |
| `bullmq_queue_jobs` | gauge | `queue`, `state` (`waiting`, `active`, `delayed`, `failed`) |
| `bullmq_job_duration_seconds` | histogram | `queue`, `name` |
| `oneops_queue_lag_seconds` | gauge | `queue` (oldest waiting job age) |
| `socket_io_connections` | gauge | `namespace` |
| `socket_io_events_total` | counter | `namespace`, `event`, `direction` |
| `prisma_pool_connections` | gauge | `state` (`open`, `busy`, `idle`) |
| `prisma_query_duration_seconds` | histogram | `model`, `action` |
| `oneops_notifications_sent_total` | counter | `channel`, `status` |
| `oneops_files_scanned_total` | counter | `result` |
| `oneops_pdf_render_seconds` | histogram | `kind` |
| `oneops_build_info` | gauge | `version`, `sha` |
| Exporters | — | `node_exporter`, `cadvisor`, `postgres_exporter` (incl. replication lag), `redis_exporter`, MinIO native `/minio/v2/metrics/cluster`, Traefik native metrics, `blackbox_exporter` for TLS/cert expiry |

Grafana dashboards (`infra/observability/grafana/dashboards/`):

1. **Platform overview** — RPS, error rate, p50/p95/p99 by route group, in-flight, deploy annotations.
2. **API routes** — top slow routes, status breakdown, per-module latency (SLO 300/600 ms lines).
3. **Auth & security** — login outcomes, lockouts, MFA failures, refresh reuse, permission denials, break-glass count.
4. **Queues & workers** — depth/lag per queue, job durations, failures, retries, PDF render time.
5. **Realtime** — socket connections per namespace, event rates, fan-out latency probe.
6. **PostgreSQL** — connections, TPS, cache hit, slow queries (`pg_stat_statements`), replication lag, bloat, disk.
7. **Redis** — memory, evictions, ops/s, AOF status.
8. **MinIO** — capacity, bucket sizes, request rates, erasure health.
9. **Hosts** — CPU, memory, disk, network, container restarts.
10. **Business ops** — punches/min, approvals pending by module, notices fan-out, SMS deliveries and failures (read from PG via the Grafana PostgreSQL datasource on the replica).
11. **SLO** — availability (24×7 and business-hours), latency burn rates.

### 10.3 Error tracking (Sentry)

- Projects: `oneops-server`, `oneops-web`, `oneops-app`; environments `dev|staging|production`; releases `server@<version>+<sha>`, `web@…`, `app@<version>+<build>`.
- Source maps: web uploaded by `@sentry/vite-plugin` in `web-ci build-image` (release = image tag); mobile via `sentry-expo`/`@sentry/react-native` EAS hook with `SENTRY_AUTH_TOKEN`; server ships with `--enable-source-maps` and uploads `dist/**/*.map` (maps are not in the runtime image).
- Sampling: errors 100 %; traces 10 % (server), 5 % (frontend/app); replay off (PII).
- PII: `sendDefaultPii=false`, `beforeSend` applies the doc 07 §9.2 redaction list; IPs stored truncated.
- Self-hosting: SaaS (EU region) acceptable for pilot since payloads are redacted; move to self-hosted Sentry on `VM-obs` if BOGCL legal requires.

### 10.4 Uptime and synthetic checks

- Uptime-Kuma (or Blackbox exporter + Alertmanager) every 60 s from `VM-obs` and every 5 min from an external BD vantage point: `GET /readyz`, web `/healthz`, MinIO `/minio/health/live`, Socket.IO handshake, TLS expiry.
- Synthetic login + inbox probe every 5 min with a dedicated `MONITOR` user (no permissions beyond `me`), measures realtime fan-out by posting to a monitor-only channel and timing the socket event.

### 10.5 Alert rules (Alertmanager → email + Telegram/Slack + SMS for Sev-1)

| Alert | Expression (sketch) | For | Sev |
| :--- | :--- | :--- | :--- |
| API 5xx rate | `sum(rate(http_request_duration_seconds_count{status=~"5.."}[5m])) / sum(rate(...[5m])) > 0.005` | 5 m | High |
| API p95 reads | `histogram_quantile(0.95, …{method="GET"}) > 0.3` | 10 m | Medium |
| API p95 writes | `… {method!="GET"} > 0.6` | 10 m | Medium |
| Readiness failing | `probe_success{job="readyz"} == 0` | 2 m | Critical |
| Queue lag | `oneops_queue_lag_seconds{queue="notifications"} > 60` | 5 m | High |
| Failed jobs | `increase(bullmq_queue_jobs{state="failed"}[15m]) > 20` | — | Medium |
| Socket drop | `delta(socket_io_connections[5m]) < -500` in business hours | — | Medium |
| DB connections | `prisma_pool_connections{state="busy"} / 20 > 0.8` | 5 m | Medium |
| Replication lag | `pg_replication_lag_seconds > 60` | 5 m | High |
| Disk | `node_filesystem_avail_bytes / size < 0.15` | 10 m | High; `< 0.05` Critical |
| Memory | container RSS > 85 % of limit | 10 m | Medium |
| Cert expiry | `probe_ssl_earliest_cert_expiry - time() < 14d` | — | High |
| Backup | `time() - pgbackrest_last_successful_backup_timestamp > 26h` or WAL archive failure | — | Critical |
| Host down | `up{job="node"} == 0` | 2 m | Critical |
| Security alerts | Doc 07 §9.4 (from Loki ruler on audit events) | — | per table |

Routing: Sev-Critical → on-call phone (SMS via the same BD gateway) + channel; High → channel + email; Medium → channel; business-hours silences for Low. On-call: weekly rotation of 2 backend engineers during pilot; BOGCL IT NOC receives Critical alerts in parallel.

---

## 11. Backups and Disaster Recovery

### 11.1 PostgreSQL

| Item | Setting |
| :--- | :--- |
| Tool | pgBackRest 2.5x on `VM-db-1`, repo1 local disk (fast restore), repo2 offsite S3 (MinIO at CTG terminal or BD cloud), `repo-cipher-type=aes-256-cbc` |
| Full | Weekly Friday 01:00 |
| Differential | Daily 01:00 |
| WAL archiving | `archive_command = pgbackrest archive-push`, `archive_timeout = 300` → RPO ≤ 5 min normally; **15 min** is the committed RPO (doc 07 §11.3) |
| Retention | `repo-retention-full=5` (≈ 35 d PITR), monthly full kept 12 months on repo2 |
| Replica | Streaming replication to `VM-db-2` (`synchronous_commit=remote_apply` for the `signatures`/`audit_logs` writes only if latency permits; otherwise async) |
| Verification | Nightly `pgbackrest verify`; weekly automated restore to a scratch container + `SELECT count(*)` on key tables + app `integrity:notesheets` job; report posted to the ops channel (`nightly.yml`) |
| Logical dumps | Monthly `pg_dump -Fc` of the whole DB to WORM bucket for long-term/legal retention independent of pgBackRest format |

### 11.2 MinIO

- Production bucket replication (async, versioned) `documents`, `uploads` → offsite MinIO; `documents` keeps object-lock on both sides.
- Erasure coding EC:2 on 4 drives tolerates 1 drive loss per set; monthly `mc admin heal`.
- `quarantine` is not replicated.

### 11.3 Redis and configuration

- Redis AOF `appendfsync everysec` + nightly RDB copy; loss is acceptable (queues re-created from DB state by the reminder scanner, sessions in DB, rate limits reset).
- `infra/` in git is the source of truth for all configuration; Vault storage backed up daily (raft snapshot) to repo2.

### 11.4 Targets and drills

| Scenario | RPO | RTO | Drill |
| :--- | :--- | :--- | :--- |
| Primary DB failure | ≤ 15 min | ≤ 2 h | Quarterly: promote replica, repoint, verify |
| Full restore from backup | ≤ 15 min | ≤ 2 h (DB ≈ 60 GB at 100 MB/s ≈ 10 min + verification) | Quarterly on staging; annually in production window |
| Site loss | ≤ 15 min | ≤ 8 h | Annual tabletop + partial rebuild on cloud VMs from `infra/` |

Runbook `restore-database.md` (§12) covers: stop writers (`MAINTENANCE_MODE=full`), `pgbackrest restore --type=time --target="…"`, promote, re-create replication, run `prisma migrate status`, start API, run integrity job, lift maintenance, post-incident note.

---

## 12. Operations Runbooks Index (`infra/runbooks/`)

| Runbook | Summary |
| :--- | :--- |
| `deploy.md` | Pre-checks (CI green, release notes, change window), `deploy.sh`, smoke, announcement notice |
| `rollback.md` | Decision criteria (error rate, p95, Sentry spike), `rollback.sh`, DB considerations, mobile OTA republish |
| `rotate-secrets.md` | DB password (create new role password, update Vault, rolling restart), JWT key (`rotate-jwt-key.sh`: add kid, deploy, switch active, remove after 24 h), `ENCRYPTION_KEYS` (doc 07 §5.2), SMS/SMTP credentials, S3 service keys, EAS/Sentry tokens |
| `add-site-geofence.md` | Create `Site` in admin UI, add `Geofence` (circle/polygon from GeoJSON), assign departments/shifts, verify with a test punch, update bus routes if needed |
| `reset-mfa.md` | Identity verification steps, 4-eyes `AdminChangeRequest`, user notification, audit check |
| `unlock-user.md` | Verify brute-force alerts, unlock, advise password change |
| `restore-database.md` | Full and PITR restore (§11.4) |
| `promote-replica.md` | Failover steps, DNS/compose repoint, rebuild old primary as replica |
| `scale-workers.md` | Adjust `QUEUE_CONCURRENCY_*` or `--scale worker=N`, watch lag dashboards |
| `purge-retention.md` | Run a retention job manually with dry-run, review counts, execute, confirm `RETENTION_PURGE` audit |
| `anonymise-staging.md` | Monthly refresh: restore prod backup to staging DB host, run `anonymise.sql`, truncate chat/files, reseed monitor users |
| `security-incident.md` | Doc 07 §10.3 |
| `certificate-renewal.md` | Let's Encrypt automatic via Traefik; internal CA manual steps and pinning notes |
| `onboard-engineer.md` | Access to GitHub, Vault policies (least privilege), VPN, on-call tooling; offboarding checklist |
| `mobile-release.md` | Tagging, EAS build/submit, store console steps, OTA, rollback |
| `load-test.md` | Running k6 scenarios against staging, reading results |

Each runbook has: purpose, preconditions, step-by-step commands, verification, rollback, who to inform.

---

## 13. Sizing and Cost Sketch

### 13.1 Sizing

| Component | Pilot (≤ 300 users) | Full v1 (800 users, 3× headroom) | Notes |
| :--- | :--- | :--- | :--- |
| Edge (Traefik) | shared with app VM | 2 vCPU / 2 GB | Can be an HA pair with keepalived later |
| API | 1 VM 4 vCPU / 8 GB running 2 × server + 2 × worker + pdf | 2 VMs × (2 vCPU / 4 GB per API replica; 2 vCPU / 4 GB per worker pair; pdf 2 vCPU / 2 GB) ≈ 2 × 4 vCPU / 8 GB | Node process heap 768 MB; Chromium needs 1 GB |
| PostgreSQL primary | 4 vCPU / 8 GB / 200 GB SSD | 4 vCPU / 16 GB / 500 GB SSD (NVMe) | `shared_buffers` 4 GB, `effective_cache_size` 12 GB |
| PostgreSQL replica | optional | same as primary | Also serves reports |
| Redis | 1 GB on DB VM | 2 GB dedicated container, replica on app VM 2 | `maxmemory-policy allkeys-lru` for cache DB, `noeviction` for queues DB (two logical DBs) |
| MinIO | 500 GB on DB VM | 4 × 1 TB drives EC:2 (≈ 2 TB usable) + offsite replica | 50 GB/year growth leaves 10+ years |
| Observability | 2 vCPU / 4 GB / 200 GB | 4 vCPU / 8 GB / 500 GB | Loki 90 d + Prometheus 15 months |
| Backups offsite | 500 GB | 2 TB | pgBackRest repo2 + MinIO replica + log archive |
| Bandwidth | 50 Mbps | 200 Mbps between HQ and plant/terminal | Presigned uploads from field sites |

### 13.2 Cost sketch (indicative, BDT/month, excluding staff)

| Item | Pilot | Full v1 |
| :--- | :--- | :--- |
| On-prem VMs (amortised hardware + power + DC) — 2 VMs vs 6 VMs | ৳25,000–40,000 | ৳90,000–150,000 |
| Storage (NVMe + 2 TB object + offsite) | ৳8,000 | ৳30,000 |
| TLS certificates | ৳0 (Let's Encrypt) or ৳15,000/yr wildcard | same |
| SMS (OTP, critical notices) at ~৳0.35/SMS: 10k vs 60k/month | ৳3,500 | ৳21,000 |
| Expo EAS (Production plan) | ≈ US$99 ≈ ৳12,000 | same |
| Apple Developer + Google Play | ≈ US$99/yr + US$25 once | same |
| Sentry Team (SaaS) or self-hosted (VM cost above) | ≈ US$26–80 ≈ ৳3,000–10,000 | ≈ US$80 ≈ ৳10,000 |
| GitHub Team (5–8 seats) + Actions minutes | ≈ US$40 ≈ ৳5,000 | ≈ US$80 ≈ ৳10,000 |
| Vault / Grafana / Loki / Prometheus / MinIO / pgBackRest | ৳0 (OSS) | ৳0 |
| **Total (approx.)** | **৳60,000–85,000** | **৳175,000–250,000** |

Cloud alternative (BD Tier-III or Singapore) for the same sizing is typically 1.5–2.5× the amortised on-prem figure; it is justified only if BOGCL IT cannot provide VMs with 99.5 % availability and off-hours support.

---

## 14. Appendix A — `infra/compose/docker-compose.dev.yml`

```yaml
name: oneops-dev

services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: oneops
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres          # local only; app roles created by init.sql
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ../db/init.sql:/docker-entrypoint-initdb.d/10-init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d oneops"]
      interval: 5s
      timeout: 3s
      retries: 20

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "512mb", "--maxmemory-policy", "noeviction"]
    ports: ["6379:6379"]
    volumes: [redisdata:/data]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 20

  minio:
    image: minio/minio:RELEASE.2025-09-07T16-13-09Z
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin          # local only
      MINIO_ROOT_PASSWORD: minioadmin      # local only
    ports: ["9000:9000", "9001:9001"]
    volumes: [miniodata:/data]
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 5s
      timeout: 3s
      retries: 20

  minio-init:
    image: minio/mc:RELEASE.2025-08-13T08-35-41Z
    depends_on:
      minio: { condition: service_healthy }
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 minioadmin minioadmin &&
      mc mb -p local/uploads local/quarantine &&
      mc mb -p --with-lock local/documents &&
      mc ilm rule add local/uploads --expire-days 7 --prefix pending/ || true &&
      echo buckets-ready"

  mailpit:
    image: axllent/mailpit:latest
    ports: ["8025:8025", "1025:1025"]
    environment:
      MP_SMTP_AUTH_ACCEPT_ANY: "1"
      MP_SMTP_AUTH_ALLOW_INSECURE: "1"

  clamav:
    image: clamav/clamav:stable
    profiles: ["av"]
    ports: ["3310:3310"]
    volumes: [clamdb:/var/lib/clamav]
    healthcheck:
      test: ["CMD", "clamdscan", "--ping", "1"]
      interval: 30s
      timeout: 10s
      retries: 10
      start_period: 180s

volumes:
  pgdata:
  redisdata:
  miniodata:
  clamdb:
```

`infra/db/init.sql` (local): creates extensions `pgcrypto`, `pg_trgm`, `postgis`; roles `oneops_migrate` (owner of schema) and `oneops_app` (DML only; `REVOKE UPDATE, DELETE ON audit_logs` is applied by the migration itself once the table exists). Production roles are created by the DBA with Vault-managed passwords, not by this file.

---

## 15. Appendix B — `server/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1.7
ARG NODE_IMAGE=node:22-alpine

# ---- deps: full install for building ----
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts && npx prisma generate

# ---- build: compile TypeScript, emit OpenAPI ----
FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
# NOTE: `prisma` (CLI) is declared under "dependencies", not "devDependencies", because the
# runtime image runs `prisma migrate deploy` and re-generates the client after pruning dev deps.
RUN npm run build && npm prune --omit=dev --ignore-scripts && npx prisma generate

# ---- runtime ----
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    NODE_OPTIONS="--enable-source-maps --max-old-space-size=768" \
    PORT=4000 \
    METRICS_PORT=9464
WORKDIR /app
RUN apk add --no-cache dumb-init openssl curl \
 && addgroup -S oneops && adduser -S -G oneops -h /app oneops
COPY --from=build --chown=oneops:oneops /app/node_modules ./node_modules
COPY --from=build --chown=oneops:oneops /app/dist ./dist
COPY --from=build --chown=oneops:oneops /app/prisma ./prisma
COPY --from=build --chown=oneops:oneops /app/package.json ./package.json
USER oneops
EXPOSE 4000 9464
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:4000/healthz || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
# worker:  docker run <image> node dist/worker.js
# migrate: docker run <image> npx prisma migrate deploy
```

Compose service hardening (prod/staging):

```yaml
  server:
    image: ghcr.io/hprogrammerarif/oneops-server:${TAG}
    env_file: [/opt/oneops/secrets/server.env]
    read_only: true
    tmpfs: ["/tmp"]
    security_opt: ["no-new-privileges:true"]
    cap_drop: ["ALL"]
    stop_grace_period: 30s
    deploy:
      replicas: 2
      resources: { limits: { cpus: "2", memory: 1g } }
    networks: [app, data]
    depends_on:
      migrate: { condition: service_completed_successfully }
```

---

## 16. Appendix C — `.github/workflows/server-ci.yml`

```yaml
name: server-ci

on:
  pull_request:
    paths: ["server/**", ".github/workflows/server-ci.yml"]
  push:
    branches: [main]
    paths: ["server/**", ".github/workflows/server-ci.yml"]

concurrency:
  group: server-ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  packages: write
  id-token: write

defaults:
  run:
    working-directory: server

jobs:
  lint-typecheck:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: server/package-lock.json
      - run: npm ci --ignore-scripts
      - run: npx prisma generate
      - run: npx prisma validate
      - run: npx prisma format --check
      - run: npm run lint
      - run: npm run typecheck
      - run: node scripts/check-env-example.mjs

  unit:
    runs-on: ubuntu-24.04
    needs: lint-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: server/package-lock.json
      - run: npm ci --ignore-scripts
      - run: npx prisma generate
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: server-coverage
          path: server/coverage

  integration:
    runs-on: ubuntu-24.04
    needs: lint-typecheck
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_DB: oneops_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s --health-timeout 3s --health-retries 20
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s --health-timeout 3s --health-retries 20
    env:
      NODE_ENV: test
      APP_ENV: local
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/oneops_test?schema=public
      DATABASE_MIGRATE_URL: postgresql://postgres:postgres@localhost:5432/oneops_test?schema=public
      REDIS_URL: redis://localhost:6379/0
      JWT_PRIVATE_KEY: ${{ secrets.CI_JWT_PRIVATE_KEY }}      # throwaway CI key, not used anywhere else
      JWT_PUBLIC_KEYS: ${{ secrets.CI_JWT_PUBLIC_KEYS }}
      JWT_ACTIVE_KID: ci
      ENCRYPTION_KEYS: ${{ secrets.CI_ENCRYPTION_KEYS }}
      ENCRYPTION_ACTIVE_KEY_ID: ci
      WATCHLIST_HMAC_KEY: ${{ secrets.CI_WATCHLIST_HMAC_KEY }}
      APP_BASE_URL: http://localhost:5173
      API_BASE_URL: http://localhost:4000
      CORS_ORIGINS: http://localhost:5173
      S3_ENDPOINT: http://localhost:9000
      S3_PUBLIC_ENDPOINT: http://localhost:9000
      S3_ACCESS_KEY: test
      S3_SECRET_KEY: test
      SMTP_HOST: localhost
      SMTP_PORT: "1025"
      MAIL_FROM: OneOps <no-reply@localhost>
      SMS_PROVIDER: mock
      CLAMAV_HOST: ""
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: server/package-lock.json
      - run: npm ci --ignore-scripts
      - run: npx prisma generate
      - name: Apply migrations to ephemeral DB
        run: npx prisma migrate deploy
      - name: Schema drift check
        run: |
          npx prisma migrate diff \
            --from-url "$DATABASE_URL" \
            --to-schema-datamodel prisma/schema.prisma \
            --exit-code
      - run: npm run test:int
      - name: Emit OpenAPI document
        run: npm run build && test -f openapi.json
      - uses: actions/upload-artifact@v4
        with:
          name: openapi
          path: server/openapi.json

  openapi-diff:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-24.04
    needs: integration
    steps:
      - uses: actions/checkout@v4
        with: { ref: main, path: base }
      - uses: actions/download-artifact@v4
        with: { name: openapi, path: head }
      - name: Breaking change check (non-blocking; label 'api:breaking' acknowledges)
        run: |
          docker run --rm -v "$PWD:/w" tufin/oasdiff breaking /w/base/server/openapi.json /w/head/openapi.json \
            || echo "::warning::Breaking API change detected — requires /api/v2 or label api:breaking"

  build-image:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    needs: [unit, integration]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ghcr.io/${{ github.repository_owner }}/oneops-server
          tags: |
            type=sha,prefix=sha-,format=short
      - uses: docker/build-push-action@v6
        with:
          context: server
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha,scope=server
          cache-to: type=gha,scope=server,mode=max
          provenance: true
      - uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: ghcr.io/${{ github.repository_owner }}/oneops-server:${{ steps.meta.outputs.version }}
          severity: CRITICAL,HIGH
          ignore-unfixed: true
          exit-code: "1"
      - uses: anchore/sbom-action@v0
        with:
          image: ghcr.io/${{ github.repository_owner }}/oneops-server:${{ steps.meta.outputs.version }}
          format: cyclonedx-json
          artifact-name: sbom-server.cdx.json
```

Notes: the CI keypair/secrets are generated once for CI only (`openssl genpkey -algorithm ed25519`, `openssl rand -base64 32`) and have no relation to any environment; `env-example-check` compares `.env.example` keys with the zod schema; the `openapi` artefact is consumed by `web-ci.yml` to regenerate types and fail if the committed generated types are stale.

---

## 17. Appendix D — Traefik labels (production `docker-compose.prod.yml` excerpt)

```yaml
services:
  traefik:
    image: traefik:v3.2
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --providers.file.directory=/etc/traefik/dynamic
      - --entrypoints.web.address=:80
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      - --entrypoints.websecure.address=:443
      - --entrypoints.websecure.http.tls.options=modern@file
      - --certificatesresolvers.le.acme.email=it-ops@bashundhara.com
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.le.acme.httpchallenge.entrypoint=web
      - --accesslog=true
      - --accesslog.format=json
      - --accesslog.fields.headers.names.X-Request-Id=keep
      - --metrics.prometheus=true
      - --metrics.prometheus.entrypoint=metrics
      - --entrypoints.metrics.address=:8082
    ports: ["80:80", "443:443"]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/dynamic:/etc/traefik/dynamic:ro
      - letsencrypt:/letsencrypt
    networks: [edge, app]

  server:
    # ...image/env/hardening as in Appendix B...
    labels:
      - traefik.enable=true
      - traefik.docker.network=app
      - traefik.http.routers.api.rule=Host(`api.oneops.bashundhara.com`)
      - traefik.http.routers.api.entrypoints=websecure
      - traefik.http.routers.api.tls.certresolver=le
      - traefik.http.routers.api.middlewares=api-ratelimit@docker,api-headers@docker,api-inflight@docker
      - traefik.http.services.api.loadbalancer.server.port=4000
      - traefik.http.services.api.loadbalancer.healthcheck.path=/readyz
      - traefik.http.services.api.loadbalancer.healthcheck.interval=5s
      - traefik.http.services.api.loadbalancer.healthcheck.timeout=2s
      - traefik.http.services.api.loadbalancer.sticky.cookie=false
      - traefik.http.middlewares.api-ratelimit.ratelimit.average=300
      - traefik.http.middlewares.api-ratelimit.ratelimit.burst=600
      - traefik.http.middlewares.api-ratelimit.ratelimit.sourcecriterion.ipstrategy.depth=0
      - traefik.http.middlewares.api-inflight.inflightreq.amount=2000
      - traefik.http.middlewares.api-headers.headers.stsSeconds=31536000
      - traefik.http.middlewares.api-headers.headers.stsIncludeSubdomains=true
      - traefik.http.middlewares.api-headers.headers.stsPreload=true
      - traefik.http.middlewares.api-headers.headers.customRequestHeaders.X-Forwarded-Proto=https

  web:
    image: ghcr.io/hprogrammerarif/oneops-web:${TAG}
    environment:
      API_URL: https://api.oneops.bashundhara.com
      WS_URL: wss://api.oneops.bashundhara.com
      FILES_URL: https://files.oneops.bashundhara.com
      APP_ENV: production
      RELEASE: web@${TAG}
      SENTRY_DSN: ${WEB_SENTRY_DSN}
    labels:
      - traefik.enable=true
      - traefik.docker.network=app
      - traefik.http.routers.web.rule=Host(`oneops.bashundhara.com`)
      - traefik.http.routers.web.entrypoints=websecure
      - traefik.http.routers.web.tls.certresolver=le
      - traefik.http.routers.web.middlewares=compress@docker
      - traefik.http.middlewares.compress.compress=true
      - traefik.http.services.web.loadbalancer.server.port=8080
      - traefik.http.services.web.loadbalancer.healthcheck.path=/healthz

  minio:
    # ...
    labels:
      - traefik.enable=true
      - traefik.docker.network=app
      - traefik.http.routers.files.rule=Host(`files.oneops.bashundhara.com`)
      - traefik.http.routers.files.entrypoints=websecure
      - traefik.http.routers.files.tls.certresolver=le
      - traefik.http.routers.files.middlewares=files-headers@docker
      - traefik.http.services.files.loadbalancer.server.port=9000
      - traefik.http.middlewares.files-headers.headers.customResponseHeaders.X-Content-Type-Options=nosniff
      - traefik.http.middlewares.files-headers.headers.customResponseHeaders.Content-Security-Policy=default-src 'none'; sandbox

networks:
  edge:
  app:
  data:
    internal: true
```

`traefik/dynamic/tls.yml` defines `tls.options.modern` (`minVersion: VersionTLS12`, modern cipher suites, `sniStrict: true`). Only `files.*` exposes MinIO's S3 API (for presigned URLs); the MinIO console is never published. Internal registries/airgap: replace `ghcr.io/...` with the on-prem mirror in `docker-compose.prod.yml` via `${REGISTRY}`.

---

## 18. Amendments Noted for Other Documents

| Doc | Item | Proposed change |
| :-- | :--- | :--- |
| 00 §3 | Layout omitted root tooling files | **Resolved:** `.nvmrc`, `.editorconfig`, `.gitattributes`, `.gitignore` added; `frontend/` is the SPA directory in doc 00 §3 |
| 00 §8 | `local` listed MailHog; `dev` deployed from `develop`; production "behind nginx" | **Resolved in doc 00 §8:** Mailpit; trunk-based from `main`; Traefik edge with `api.`/`files.` hostnames (nginx only inside the web image) |
| 00 ADR-21 | "Docker Compose/Swarm initially" | Compose + Traefik on VMs is the committed pilot/v1 topology; Swarm only if secrets management without Vault is required |
| 02 §7 | Migration policy | Add the CI drift check (`prisma migrate diff --exit-code`) and the destructive-statement label gate described in §8.5 |
| 05 (mobile) | Starter identifiers `com.example.reactnativestarter`, slug `reactnativestarter`, splash colour `#208AEF` | Replace with `com.bashundhara.oneops`, slug `oneops`, brand colours; keep `eas.json` profiles |
| 07 §5.5 | Secrets per env | Consistent with §5.5 here; Vault AppRole + `vault agent` is the production mechanism |
