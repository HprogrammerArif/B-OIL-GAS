# infra/ — Local stack, containers, CI/CD

Planned contents (see `../docs/platform/08_DEVOPS_ENVIRONMENTS_AND_CICD.md`):

```
infra/
├── docker-compose.dev.yml     postgres:16 (+postgis), redis:7, minio, mailpit, (clamav)
├── docker/                    server.Dockerfile, frontend.Dockerfile, nginx.conf
├── github/                    workflow templates copied to .github/workflows/
├── traefik/                   reverse-proxy config for VM deployments
└── scripts/                   backup, restore, rotate-secrets, seed helpers
```

Local data volumes are written to `infra/.data/` (git-ignored).
