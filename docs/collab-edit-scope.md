# Collaborative Edit Scope

Purpose: prevent overwrite bugs when two chats edit in parallel.

## Current split

- Assistant owns:
  - `app/app.js`
  - `app/ui.js`
  - `app/result.js`
  - `app/styles.css`

- User owns:
  - `app/index.html`
  - `app/test.html`
  - `app/result.html`
  - `app/gallery.html`
  - `app/coin.html`
  - `app/privacy.html`
  - `app/terms.html`
  - content/text/image updates under `app/assets/`

## Rules

1. Do not edit a file currently owned by the other side.
2. If a change must cross boundaries, announce the exact file first and wait for handoff.
3. Commit in small checkpoints before handoff.
4. Before deploy, run `git diff --name-only` and confirm no overlap.

## Handoff format

Use one line in chat:

`HANDOFF: app/result.html -> assistant`

