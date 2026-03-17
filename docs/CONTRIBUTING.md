# Contributing to AZCA

Thank you for contributing! Please follow these guidelines to keep the project clean and maintainable.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd Azca
   ```

2. **Backend Setup**
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r backend/requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

## Code Guidelines

### Python
- Follow [PEP 8](https://pep8.org/)
- Use type hints for functions
- Keep functions focused and under 50 lines
- Add docstrings for classes and public methods

```python
def predict_demand(restaurant_id: int, date: str) -> dict:
    """Predict service volume for a restaurant on a given date.
    
    Args:
        restaurant_id: Restaurant identifier
        date: ISO format date (YYYY-MM-DD)
    
    Returns:
        dict with keys: predicted_volume, confidence, features_used
    """
    pass
```

### TypeScript/React
- Use meaningful component names
- Keep components under 200 lines (split if larger)
- Prefer functional components with hooks
- Add comments for complex logic

```typescript
interface Restaurant {
  id: number;
  name: string;
  capacity: number;
}

export const RestaurantCard: React.FC<{ restaurant: Restaurant }> = ({ restaurant }) => {
  return <div>{restaurant.name}</div>;
};
```

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add restaurant image loading from Azure Blob Storage
^--- Type
     ^----
          Description (present tense, max 72 chars)

Optional body (explain WHY not WHAT):
- Images fetched from restaurant-profiles container
- Fallback to placeholder if image missing
- Added console logging for debugging
```

### Commit Types
- **feat**: New feature
- **fix**: Bug fix
- **refactor**: Code restructuring (no behavior change)
- **docs**: Documentation updates
- **test**: Test additions/updates
- **chore**: Dependency updates, build config, etc.

## File Organization

**Never commit to root directory:**
- Configuration files → `config/`
- Scripts → `scripts/{db,deploy,run,utils}/`
- Tests → `tests/`
- Logs → `.gitignore` (never commit)

**Clean root to just:**
- README.md
- Dockerfile, docker-compose.yml
- requirements.txt, requirements-docker.txt
- .env.example, .gitignore, .dockerignore

## Testing

Before submitting a PR:

```bash
# Run unit tests
pytest tests/

# Check code style
pylint backend/

# Type checking
mypy backend/
```

## Git Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make changes** (commit regularly with clear messages)

3. **Push and create PR**
   ```bash
   git push origin feat/your-feature-name
   ```

4. **PR requirements:**
   - Clear description of changes
   - Tests added/updated
   - No failing tests
   - Clean commit history

## Documentation

Update relevant docs when making changes:

- **Feature added** → Update `docs/API.md` if REST endpoint
- **Architecture change** → Update `docs/ARCHITECTURE.md`
- **New deployment requirement** → Update `docs/DEPLOYMENT.md`
- **Directory structure change** → Update `docs/PROJECT_STRUCTURE.md`

## Security

⚠️ **Never commit:**
- `.env` file (use `.env.example` template)
- API keys, passwords, credentials
- Private certificates or keys
- Sensitive data in commit messages

## Questions?

- Check existing documentation in `docs/`
- Review architecture in `docs/ARCHITECTURE.md`
- Look at existing code patterns in similar files
- Ask in PR comments or create an issue

---

Happy coding! 🚀
