# Contributing Guidelines

Thank you for your interest in contributing to AZCA! This document outlines how to contribute code, documentation, and ideas.

## Code of Conduct

- Be respectful and professional in all interactions
- Focus on constructiveness and collaboration
- Report violations to the maintainers

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git
- Azure credentials (for backend)
- SQL database access

### Development Setup

**1. Fork & Clone**

```bash
git clone https://github.com/yourusername/lacuchara.git
cd lacuchara
```

**2. Backend Setup**

```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
pip install pytest black flake8 mypy  # dev tools
```

**3. Frontend Setup**

```bash
cd frontend
npm install
npm run dev
```

**4. Create `.env` file**

```bash
cp .env.example .env
# Fill in your Azure credentials
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or for bug fixes:
git checkout -b fix/issue-description
```

**Naming conventions:**

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code improvements
- `test/` - Test additions

### 2. Make Changes

**Backend:**

```bash
# Write code with type hints
def predict_service(restaurant_id: int, date: str) -> PredictionResult:
    """Predict daily service volume."""
    ...

# Format code
black backend/

# Run linter
flake8 backend/

# Type check
mypy backend/

# Run tests
pytest backend/tests/
```

**Frontend:**

```bash
# Format & lint
npm run lint

# Type check
npx tsc --noEmit

# Run tests
npm run test
```

### 3. Commit with Clear Messages

Follow conventional commits:

```bash
git commit -m "feat: add demand forecasting for special events"
git commit -m "fix: resolve weather API timeout issues"
git commit -m "docs: update architecture documentation"
git commit -m "test: add unit tests for feature pipeline"
git commit -m "refactor: simplify model loading logic"
```

### 4. Push & Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with:

- Clear title & description
- Link to related issues
- Summary of changes
- Test coverage information

---

## Code Quality Standards

### Backend Python

**Type Hints (Required)**

```python
# Good
def predict(restaurant_id: int, date: str) -> Dict[str, float]:
    pass

# Avoid
def predict(restaurant_id, date):
    pass
```

**Docstrings (Required)**

```python
def predict_service(restaurant_id: int, date: str) -> PredictionResult:
    """
    Predict daily service volume for a restaurant.

    Args:
        restaurant_id: Unique restaurant identifier
        date: Prediction date (ISO format: YYYY-MM-DD)

    Returns:
        PredictionResult with services count and confidence

    Raises:
        ValueError: If date is invalid or in past
        RestaurantNotFound: If restaurant_id doesn't exist
    """
```

**Code Style**

- Use Black formatter (80 chars line limit)
- PEP 8 compliance
- Avoid bare `except` clauses
- Use type hints throughout

### Frontend React

**Component Structure**

```typescript
// Good: Functional component with hooks
export interface RestaurantCardProps {
  restaurant_id: number;
  name: string;
}

export default function RestaurantCard({
  restaurant_id,
  name
}: RestaurantCardProps) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [restaurant_id]);

  return <div>{name}</div>;
}
```

**TypeScript (Required)**

```typescript
// Good
interface Prediction {
  services: number;
  confidence: number;
}

// Avoid
const prediction = {
  services: 95,
  confidence: 0.87,
};
```

**No Magic Numbers**

```typescript
// Good
const CACHE_TTL_HOURS = 24;
```

---

## Testing

### Backend Tests

```bash
# Run all tests
pytest backend/tests/ -v

# Run specific test
pytest backend/tests/test_engine.py::test_prediction -v

# With coverage
pytest backend/tests/ --cov=backend --cov-report=html

# Minimum coverage threshold: 80%
```

**Test Structure:**

```python
import pytest
from backend.core.engine import predict_service

def test_predict_service_typical():
    """Test prediction for normal Tuesday."""
    result = predict_service(restaurant_id=1, date="2026-04-01")
    assert result.services > 0
    assert 0 <= result.confidence <= 1

def test_predict_service_invalid_date():
    """Test prediction with past date raises error."""
    with pytest.raises(ValueError):
        predict_service(restaurant_id=1, date="2020-01-01")
```

### Frontend Tests

```bash
# Run Jest tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## Documentation

### When to Update Docs

- New feature? Update [FEATURES.md](FEATURES.md)
- API change? Update [API_REFERENCE.md](API_REFERENCE.md)
- Architecture change? Update [ARCHITECTURE.md](ARCHITECTURE.md)
- Setup issue? Update [SETUP.md](SETUP.md)

### Documentation Style

- Use clear, concise language
- Include code examples
- Reference related docs
- Keep TOC updated

### Building Docs Locally

Docs are markdown files in `docs/` folder.
Use any markdown viewer or:

```bash
# Option: GitHub markdown preview
# Option: VS Code markdown preview (Ctrl+Shift+V)
```

---

## Release Process

### Version Numbers

Follow semantic versioning: `MAJOR.MINOR.PATCH`

- `1.0.0` - Initial release
- `1.1.0` - New features (backward compatible)
- `1.0.1` - Bug fixes (backward compatible)
- `2.0.0` - Breaking changes

### Release Checklist

1. Update version in `package.json` & `setup.py`
2. Update `CHANGELOG.md`
3. Tag commit: `git tag v1.2.0`
4. Push: `git push origin main --tags`
5. Create GitHub release

---

## Performance & Optimization

### Backend Performance

- Profile with `py-spy`: `py-spy record -o profile.svg python -m uvicorn ...`
- Target: <500ms response time
- Connect DB pooling: 20 connections
- Cache weather data: 12 hours

### Frontend Performance

- Target: <3s initial load
- Use React.memo for expensive components
- Lazy load routes with dynamic imports
- Monitor with Lighthouse: `npm run build && npx serve dist`

---

## Security Considerations

### Before Committing

- [ ] No credentials in code
- [ ] No `.env` file committed
- [ ] No API keys in logs
- [ ] SQL parameterized queries (SQLAlchemy handles)
- [ ] Input validation on all endpoints

### Security Review Checklist

- HTTPS required in production
- SQL injection prevention
- XSS prevention in React
- CSRF tokens for state-changing requests
- Rate limiting on public endpoints

---

## Common Issues

### Python Import Errors

```bash
# Ensure venv is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r backend/requirements.txt --force-reinstall
```

### Port Already in Use

```bash
# Backend (8000)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Frontend (5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Database Connection Failed

- Check `.env` credentials
- Verify SQL Server firewall rules
- Test connection: `python scripts/db/test_connection.py`

### TypeScript Error

```bash
cd frontend
npm install --save-dev @types/react @types/node
```

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [XGBoost Guide](https://xgboost.readthedocs.io/)
- [Azure ML Documentation](https://docs.microsoft.com/azure/machine-learning/)
- [PEP 8 Style Guide](https://pep8.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Review Process

### Before Review

- [ ] Tests pass (`pytest backend/tests/`)
- [ ] Code formatted (`black backend/`, `npm run lint`)
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Commit messages are clear

### Review Criteria

- Does it solve the issue?
- Is code quality good?
- Are tests adequate?
- Is documentation complete?
- Are there any edge cases?

---

## Questions?

- Check documentation in `docs/`
- Open an issue for discussions
- Contact maintainers

---

**Thank you for contributing to AZCA!** 🎉
