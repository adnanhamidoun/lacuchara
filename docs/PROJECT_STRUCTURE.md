# Project Structure Guide

Complete directory layout and file organization for AZCA.

## Canonical Layout

```text
lacuchara/
 backend/ # FastAPI service and business logic
 api/ # HTTP endpoints and request/response contracts
 core/ # Domain services, ML orchestration, auth, scheduling
 db/ # SQLAlchemy engine, models, schema, migrations
 scripts/ # Backend-only operational helpers
 tests/ # Backend-focused tests
 requirements.txt # Backend Python dependencies
 frontend/ # React + Vite client app
 src/ # Application source code
 public/ # Static public assets
 docs/ # Frontend-specific implementation notes
 package.json # Frontend dependencies and scripts
 scripts/ # Cross-project scripts (setup, diagnostics, deploy, utils)
 tests/ # End-to-end assets and shared test scripts
 docs/ # Project-level documentation
 config/ # Infra and environment configuration (nginx, etc.)
 .github/ # Workflows and repository automation
 main.py # Root compatibility entrypoint (uvicorn main:app)
 README.md # Repository landing page
```

## Ownership Rules

- `backend/` contains only backend runtime code and backend tests.
- `frontend/` contains only frontend runtime code and frontend docs.
- `scripts/` contains executable helpers; no business-domain modules.
- `docs/` contains architecture, setup, API, deployment, and governance docs.
- Top-level Python files should stay minimal and act as entrypoints only.

## Naming Conventions

- Python modules: `snake_case.py`
- React components: `PascalCase.jsx`
- Utility folders: short, descriptive nouns (`setup`, `diagnostics`, `deploy`)
- Documentation: uppercase topic files in `docs/` (`API.md`, `DEPLOYMENT.md`)

## What Should Not Be Committed

- Secrets: `.env`, certs, private keys
- Local environments: `venv/`, `.venv/`
- Build artifacts: `frontend/dist/`, caches, logs
- Local notebooks output and temporary files

See `.gitignore` for the full rule set.

## Practical Cleanup Plan (No-Risk First)

1. Keep runtime behavior stable (no import path changes).
2. Document architecture and folder boundaries.
3. Remove dead files and duplicated docs after verification.
4. If needed, perform folder moves in one dedicated refactor branch.

## Refactor Plan (Optional, Next Phase)

1. Move one folder at a time.
2. Update imports and test discovery.
3. Run backend and frontend test suites.
4. Merge only when CI is green.

