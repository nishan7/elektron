# Electricity Monitor Application

A full-stack application for monitoring electricity consumption, device health, and generating alerts.

## How to Run

### Prerequisites

- Docker and Docker Compose installed on your system
- Git (for cloning the repository)

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ElectricityApp.git
cd ElectricityApp
```

2. Create a `.env` file in the root directory:
```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=electricity_monitor

# Backend
BACKEND_PORT=8000
REDIS_PORT=6379

# Frontend
FRONTEND_PORT=3000
REACT_APP_API_URL=http://localhost:8000

# Monitoring
GRAFANA_PORT=3001
PROMETHEUS_PORT=9090
```

3. Start the application:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

5. Login credentials:
- Username: admin
- Password: admin123

### Troubleshooting

If the database is not initializing:
```bash
docker-compose exec backend python -c "from app.core.init_db import init_db; init_db()"
```

To view logs:
```bash
docker-compose logs -f [service-name]
```

To restart services:
```bash
docker-compose restart [service-name]
```

To stop the application:
```bash
docker-compose down
```

## Repository Information

- **Repository URL**: [https://github.com/yourusername/ElectricityApp](https://github.com/yourusername/ElectricityApp)
- **Branch Structure**:
  - `main` - Production-ready code
  - `develop` - Development branch
  - `feature/*` - Feature branches
  - `bugfix/*` - Bug fix branches
  - `release/*` - Release branches

## Development Workflow

1. Create a new feature branch:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git add .
git commit -m "feat: description of your changes"
```

3. Push your changes:
```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request:
   - Go to GitHub repository
   - Click "New Pull Request"
   - Select `develop` as base branch
   - Select your feature branch as compare branch
   - Fill in the PR template

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

## Code Review Process

1. All code changes must go through a Pull Request
2. At least one reviewer must approve the changes
3. All automated tests must pass
4. Code must follow the project's style guide
5. Documentation must be updated if needed

## Deployment

### Production Deployment

1. Create a release branch:
```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.x.x
```

2. Update version numbers and changelog
3. Create a Pull Request to `main`
4. After approval, merge to `main`
5. Tag the release:
```bash
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x
```

### Staging Deployment

1. Merge `develop` into `staging`
2. Deploy to staging environment
3. Run integration tests
4. If tests pass, proceed to production deployment

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── public/
├── docker/
├── grafana/
└── docs/
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
