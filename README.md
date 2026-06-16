# Breakathon Frontend

Frontend for the Genda Phool Break-A-Thon app (React + Vite + Tailwind).

## Prerequisites

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create a `.env.local` file with the backend connection details:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_ID=default
```

`VITE_API_BASE_URL` should point at the running `breakathon-backend` server.
`VITE_APP_ID` is a path segment used by the backend's `/api/apps/:appId/*`
routes and can be left as `default` unless your backend expects a specific value.

## Run the app

```
npm run dev
```

The app runs on http://localhost:5173 by default.

## Build for production

```
npm run build
npm run preview
```
