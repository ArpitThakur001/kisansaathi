# KisanSaathi - Smart Farm Dashboard

KisanSaathi is a farm management web app built with HTML, CSS, JavaScript, Node.js, Express, and MySQL. It lets users manage farm records, view local weather, track expenses and crop history through APIs, and chat with an AI farming advisor using the selected farm's context.

## Project Structure

```text
New folder (2)/
|-- package.json
|-- package-lock.json
|-- setup.sql
|-- README.md
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

### 2. Configure MySQL

Open `public/server.js` and update the database credentials if needed:

```js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'kisansaathi',
  waitForConnections: true,
  connectionLimit: 10,
});
```

Also update the same credentials inside the `initDB()` connection if your setup is different.

### 3. Create tables

You can either:

- run the server and let it auto-create the database and tables, or
- run the SQL file manually:

```bash
mysql -u root -p < setup.sql
```

### 4. Start the project

If you want to use the AI advisor, set your Groq API key first:

```powershell
$env:GROQ_API_KEY="your_groq_api_key_here"
```

```bash
npm start
```

For development with auto-reload:

```bash
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
- The AI route reads the Groq key from `GROQ_API_KEY`.
