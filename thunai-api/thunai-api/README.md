# Thunai Culture OS API

A FastAPI-based REST API for managing team culture, moments, and engagement.

## Features

- **Users**: Team member management
- **Moments**: Personal celebrations (birthdays, anniversaries, LWD)
- **Greetings**: Team responses to moments
- **Accolades**: Recognition and achievements
- **Gossips**: Team announcements
- **Quests**: Team challenges
- **Thoughts**: Team insights

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the server:**
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   Or use: `start_api.bat`

3. **Access API documentation:**
   - Swagger UI: http://127.0.0.1:8000/docs
   - Health check: http://127.0.0.1:8000/health

## Database

Uses SQLite database located at: `../../database/thunai_culture.db`

## API Endpoints

### Users
- `GET /api/v1/users/` - List all users
- `GET /api/v1/users/{id}` - Get user by ID
- `GET /api/v1/users/email/{email}` - Get user by email
- `POST /api/v1/users/` - Create user
- `PUT /api/v1/users/{id}` - Update user

### Moments
- `GET /api/v1/moments/` - List all moments
- `POST /api/v1/moments/` - Create moment
- `GET /api/v1/moments/upcoming/{days}` - Get upcoming moments
- `PATCH /api/v1/moments/{id}/notify` - Mark as notified
- `PATCH /api/v1/moments/{id}/complete` - Mark as completed

### Greetings
- `GET /api/v1/greetings/` - List all greetings
- `POST /api/v1/greetings/` - Create greeting
- `GET /api/v1/greetings/moment/{id}` - Get greetings for moment

## Teams Bot Integration

Configured for Microsoft Teams bot integration on ports 3978.