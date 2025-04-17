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
