# Data Analyser

A full-stack web app that lets you **upload data files and ask questions about them in plain English**. Behind the scenes, a large language model turns each question into a SQL query, runs it against your data, and returns tables, charts, and natural-language summaries. You can save charts and assemble them into custom, drag-and-drop dashboards.

> Upload a CSV/Excel/JSON/SQLite file → ask *"what were the top 10 customers by revenue?"* → get the answer as a table or a chart, no SQL required.

---

## Features

- **Natural-language querying** — ask questions in English; an LLM (Google Gemini) generates and runs read-only SQL.
- **Multi-format upload** — CSV, Excel (`.xlsx`/`.xls`), JSON, and SQLite/DB files, converted into a queryable SQLite database per upload.
- **Chat or data mode** — the app routes each question to either a tabular SQL answer or a conversational summary.
- **Visualisation** — build bar/line/area charts from query results (Recharts) and save them.
- **Custom dashboards** — arrange saved charts into resizable, draggable dashboards; export to image/print.
- **Accounts & history** — JWT-based auth, per-user upload and query history.
- **Light/dark theming**.

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 19, TypeScript, Vite, Redux Toolkit, React Router, Recharts, react-grid-layout |
| Backend   | FastAPI, LangGraph + LangChain, Google Gemini (`gemini-2.5-flash`), pandas |
| Data      | MongoDB (metadata, users, history, GridFS for DB binaries) + per-upload SQLite |
| Auth      | JWT (HS256), bcrypt password hashing |
| Infra     | Docker / Docker Compose |

---


The NL→SQL pipeline lives in `backend/app/graph/` (backend/app/graph/): `route_intent` decides *data* vs *chat*, `generate_sql` drafts SQLite from the schema + question, `validate_sql` checks it, and `execute_sql` runs it on a **read-only** SQLite connection (writes are rejected at the engine level). It retries up to 3 times with the validator's feedback.

---

## Getting started

You need either **Docker** (easiest) or **Python 3.11+, Node 20+, and MongoDB** installed locally.

### Option A — Docker (one command)

```bash
# from the repo root
cp backend/.env.example backend/.env     # then add your GOOGLE_API_KEY + a JWT_SECRET
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API + docs: http://localhost:5000 and http://localhost:5000/api/openapi.json
- MongoDB data persists in the `mongo_data` volume across restarts.

### Option B — Run locally

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                              # fill in values
uvicorn app.main:app --reload --port 5000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env                              # VITE_API_URL=http://localhost:5000/api
npm run dev
```

Make sure MongoDB is running and `MONGODB_URI` in `backend/.env` points to it.

---

## Environment variables

### Backend (`backend/.env`) — see [`.env.example`](backend/.env.example)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | yes | `mongodb://localhost:27017` | MongoDB connection string |
| `JWT_SECRET` | yes (prod) | dev placeholder | Secret for signing JWTs; the server warns at startup if the insecure default is used |
| `ALLOWED_ORIGINS` | no | `http://localhost:5173,http://localhost:5174` | Comma-separated CORS origins |
| `GOOGLE_API_KEY` | yes | – | Google Gemini API key (NL→SQL) |
| `MAX_UPLOAD_MB` | no | `50` | Max upload size in MB |

### Frontend (`frontend/.env`) — see [`.env.example`](frontend/.env.example)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | no | `http://localhost:5000/api` | Backend API base URL |

---

## Project structure

```
backend/
  app/
    api/        # FastAPI routers: auth, upload, sandbox, analyze, history, dashboard, notes, data
    core/       # config & security (JWT, hashing)
    db/         # MongoDB connection
    graph/      # LangGraph NL→SQL pipeline (state, nodes, workflow)
    models/     # Pydantic models
    services/   # upload processing, LLM service
frontend/
  src/
    api/        # axios config
    components/ # Dashboard, GraphBuilder, CustomDashboard, AuthPage, ...
    features/   # Redux slices (auth, app)
    context/    # theme
docker-compose.yml
```

---

## Notes

- This is an academic project. Some production concerns (rate limiting, MongoDB indexes, automated tests/CI, component decomposition) are intentionally out of scope — see the enhancement roadmap.
- **Security:** never commit a real `.env`. If a credential is ever committed, rotate it — git history retains it even after deletion.
