# BudgetFlow

BudgetFlow is a personal finance and budgeting web application that helps users track income and expenses, manage budgets, and understand their spending.

## Features

- User registration and login
- Email OTP verification during signup
- JWT-based authentication and protected API routes
- Dashboard with financial summaries
- Transaction management
- Budget management and progress tracking
- Analytics and financial insights
- Profile and settings
- Light and dark themes
- Monthly budget reset support
- Responsive React interface

## Tech Stack

### Frontend
- React
- Vite
- React Router
- JavaScript
- CSS / reusable UI components

### Backend
- Python
- FastAPI
- JWT authentication
- Pydantic

### Database
- PostgreSQL is intended for production; configure the database connection through environment variables.

## Project Structure

```text
Budget Flow/
├── frontend/       # React + Vite application
└── backend/        # FastAPI application and API routes
```

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.10+ (use the Python version supported by your dependencies)
- A configured database
- SMTP credentials for email OTP verification

### 1. Run the backend

Open a terminal:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
```

Install backend dependencies (if your project has a requirements file):

```bash
pip install -r requirements.txt
```

Create/configure your backend `.env` file with the required settings, then start the API:

```bash
python -m uvicorn main:app --reload
```

The API is typically available at `http://localhost:8000`. FastAPI's interactive API documentation is at `http://localhost:8000/docs`.

### 2. Run the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (commonly `http://localhost:5173`).

## Environment Configuration

Keep secrets out of source control. Configure the variables required by your backend, such as:

```env
DATABASE_URL=your_database_connection_string
JWT_SECRET_KEY=replace_with_a_secure_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=your_sender_email
```

Variable names and values should match the backend configuration. Do not commit `.env` files, database credentials, SMTP passwords, or JWT secrets.

## Security Notes

- Use a strong, unique JWT secret in production.
- Configure HTTPS for deployed environments.
- Store production credentials in your hosting provider's environment settings.
- Never commit access tokens or secrets to Git.
- Ensure user data is scoped to the authenticated account.

## Deployment

The intended deployment architecture is:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon PostgreSQL

Set the production environment variables and API base URL in the respective hosting platforms before deployment.

## Development

BudgetFlow is under active development. Test signup, email verification, login, protected routes, transaction operations, and budget calculations before releasing changes.

## License

No license has been specified yet.
