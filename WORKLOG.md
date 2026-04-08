# WORKLOG

Last updated: 2026-04-08

## Current status

- `ama-listing-creator` is treated as an independent app repository.
- The portal `APPs` page already reserves an entry for this app.
- It is not yet fully integrated as a production-deployed app in the same way as `customer-service`.

## Changes completed recently

- The main portal now has a reserved entry point for this app under `/apps`.
- Main system repository migration clarified that this app is separate from the platform root repository.

## Next likely work

- Complete GitHub-side app readiness.
- Define deployment path, service model, and portal integration details.
- Decide whether it will mirror the standalone deployment pattern used by `customer-service`.

## Risks / notes

- The app may appear in portal planning before its deploy chain is fully finished.
- Keep the separation between app repository lifecycle and portal-system root lifecycle clear.

## Important references

- `apps/ama-listing-creator/next.config.ts`
- `modules/amazon-cleaner/scripts/templates/apps.html`
- `PROJECT_STATUS.md`
