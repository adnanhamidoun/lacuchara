# 📁 Project Structure

## Root Directory
```
Azca/
├── README.md                    # Project overview & quick start
├── Dockerfile                   # Docker image configuration
├── docker-compose.yml          # Multi-container orchestration
├── requirements.txt            # Python dependencies
├── requirements-docker.txt     # Docker-specific dependencies
├── .env.example                # Configuration template
├── .gitignore                  # Git ignore rules
├── .dockerignore               # Docker ignore rules
│
├── config/                     # Configuration files
│   └── nginx.conf             # Nginx reverse proxy config
│
├── docs/                       # Documentation
│   ├── SETUP.md               # Installation & setup guide
│   ├── API.md                 # REST API reference
│   ├── ARCHITECTURE.md        # System architecture
│   ├── DEPLOYMENT.md          # Production deployment
│   ├── PROJECT_STRUCTURE.md   # This file
│   └── CONTRIBUTING.md        # Contributor guidelines
│
├── scripts/                    # Utility scripts
│   ├── README.md              # Scripts documentation
│   ├── setup/                 # Database migrations & initial setup
│   ├── diagnostics/           # Database inspection & debugging
│   ├── deploy/                # Deployment automation
│   └── utils/                 # Utility functions
│
├── tests/                      # Unit & integration tests
│   ├── __init__.py
│   ├── manual_test.py
│   ├── test_core.py
│   ├── test_integration.py
│   ├── test_menu_intelligence.py
│   └── test_validation.py
│
├── backend/                    # FastAPI backend
│   ├── api/
│   │   ├── main.py           # FastAPI app
│   │   └── static/           # Served HTML/CSS/JS
│   ├── core/                 # Business logic
│   │   ├── auth.py
│   │   ├── engine.py
│   │   ├── manager.py
│   │   ├── menu_intelligence.py
│   │   ├── pipeline.py
│   │   └── blob_storage.py   # Azure Blob integration
│   ├── db/                   # Database layer
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schema.sql
│   │   └── migrations/
│   ├── ml-training/          # ML model training & data
│   │   ├── src/              # Training scripts
│   │   ├── data/             # Training datasets (CSVs)
│   │   └── models/           # Trained models (pkl)
│   ├── azca/
│   │   └── artifacts/        # Production models
│   ├── requirements.txt      # Backend dependencies
│   ├── notebooks_research/   # Jupyter notebooks (research)
│   └── pyproject.toml
│
└── frontend/                   # React/Vite SPA
    ├── src/
    │   ├── components/       # Reusable React components
    │   ├── views/           # Page-level components
    │   ├── services/        # API calls & auth
    │   ├── hooks/           # Custom React hooks
    │   ├── utils/           # Utilities
    │   ├── types/           # TypeScript types
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── public/              # Static assets
    ├── dist/                # Build output (git ignored)
    ├── package.json
    ├── vite.config.js       # Vite bundler config
    ├── tailwind.config.js   # CSS framework
    ├── postcss.config.js
    └── eslint.config.js
```

## Key Directories

### `backend/`
FastAPI backend with ML models, database ORM, and Azure integrations.
- Entry point: `backend/api/main.py`
- Models stored in: `backend/azca/artifacts/`
- Configuration: `.env` (required)

### `frontend/`
React Single Page Application (SPA) built with Vite.
- Entry point: `frontend/src/main.jsx`
- Dev server: `npm run dev` (proxies to http://127.0.0.1:8000)
- Build: `npm run build` → `dist/`

### `docs/`
Essential documentation for setup, API usage, and deployment.

### `scripts/`
Helper scripts for development and deployment.
- **db/**: Database migrations and utilities
- **deploy/**: Deployment automation
- **run/**: Server startup scripts
- **utils/**: Shared utilities

### `tests/`
Unit and integration tests for core functionality.

## Important Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `docs/SETUP.md` | Installation guide |
| `docs/API.md` | API endpoints reference |
| `docs/ARCHITECTURE.md` | System design |
| `config/nginx.conf` | Reverse proxy config |
| `.env.example` | Configuration template |

## Git Strategy

Files **NOT tracked** (in `.gitignore`):
- `.env` (credentials)
- `venv/` (virtual environment)
- `node_modules/` (npm packages)
- `.vite/`, `.pytest_cache/`, `__pycache__/`
- `*.log` (log files)

## Development Workflow

1. **Backend Setup**
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn api.main:app --reload
   ```

2. **Frontend Setup**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. **Running Tests**
   ```powershell
   pytest tests/
   ```

---

Last updated: 2026-03-17
