# Scripts Organization

Helper scripts for development, deployment, and database management.

## Directories

### `setup/`

**Initial database setup and migrations**

- `run_migrations.py` - Add/modify columns in Azure SQL
- `create_fact_logs_table.py` - Create prediction logs table

_Use once during initial setup or after schema changes._

### `diagnostics/`

**Database inspection and debugging**

- `check_table.py` - Inspect table structure (columns, types)
- `verify_logs.py` - Verify prediction logs are being saved

_Use for troubleshooting database issues._

### `deploy/`

**Deployment automation**

- `azure-deploy.sh` - Build and push Docker image to Azure Container Registry

_Use: `./scripts/deploy/azure-deploy.sh [acr-name] [image-name] [tag]`_

### `utils/`

**Utility and helper functions**

- `get_restaurant.py` - Query restaurant data from database

_Use for quick database queries or testing._

---

## Quick Start

### Database Setup (first time only)

```bash
# 1. Setup tables
python scripts/setup/run_migrations.py
python scripts/setup/create_fact_logs_table.py

# 2. Verify
python scripts/diagnostics/check_table.py
```

### Deployment to Azure

```bash
./scripts/deploy/azure-deploy.sh azcaregistry azcaapi latest
```

### Debugging

```bash
# Check database tables
python scripts/diagnostics/check_table.py

# Verify logs are saving
python scripts/diagnostics/verify_logs.py

# Get restaurant data
python scripts/utils/get_restaurant.py
```

---

**Important:** Always run scripts from project root directory.

```bash
cd C:\Users\adnan\Desktop\lacuchara
python scripts/setup/run_migrations.py
```


