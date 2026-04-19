# KisanSaathi - Smart Farm Dashboard

KisanSaathi is a farm management web app built with HTML, CSS, JavaScript, Node.js, Express, and MySQL. It lets users manage farm records, view local weather, track expenses and crop history through APIs, and chat with an AI farming advisor using the selected farm's context.

## Project Structure

```text
KisanSaathi/
|-- package.json
|-- package-lock.json
|-- setup.sql
|-- README.md
|-- .env.example
`-- public/
    |-- index.html
    |-- server.js
    |-- css/
    |   `-- style.css
    `-- js/
        |-- app.js
        `-- weather.js
```

## Features

- Dashboard with total farms, total area, crop count, and states covered
- Add and delete farm records
- Weather widget powered by Open-Meteo
- User registration and login APIs
- Expense tracking APIs
- Crop history APIs
- AI advisor chat for farm-specific guidance

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MySQL
- Weather API: Open-Meteo
- AI API: Groq Chat Completions

## Prerequisites

- Node.js 18 or newer
- MySQL running locally

## Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Use `.env.example` as a reference and set these variables in your terminal:

```powershell
$env:PORT="3000"
$env:DB_HOST="localhost"
$env:DB_USER="root"
$env:DB_PASSWORD=""
$env:DB_NAME="kisansaathi"
```

If you want to use the AI advisor, also set your Groq API key:

```powershell
$env:GROQ_API_KEY="your_groq_api_key_here"
```

### 3. Create tables

You can either:

- run the server and let it auto-create the database and tables, or
- run the SQL file manually:

```bash
mysql -u root -p < setup.sql
```

### 4. Start the project

Start the server:

```powershell
npm start
```

For development with auto-reload:

```powershell
npm run dev
```

### 5. Open the app

Visit `http://localhost:3000`

## API Endpoints

### Farmers

- `GET /api/farmers`
- `GET /api/farmers/:id`
- `POST /api/farmers`
- `PUT /api/farmers/:id`
- `DELETE /api/farmers/:id`

### Users

- `GET /api/users`
- `POST /api/users/register`
- `POST /api/users/login`
- `DELETE /api/users/:id`

### Expenses

- `GET /api/expenses/:farmer_id`
- `POST /api/expenses`
- `DELETE /api/expenses/:id`

### Crop History

- `GET /api/crop-history/:farmer_id`
- `POST /api/crop-history`
- `DELETE /api/crop-history/:id`

### AI Chat

- `POST /api/chat`

## Notes

- The backend entry file is `public/server.js`.
- Static frontend files are served from the `public` folder.
- Database configuration is read from environment variables.
- The AI route reads the Groq key from `GROQ_API_KEY`.
