# Front-End and Back-End Separation Calculator Front End

## Project Overview

This repository contains a native HTML, CSS, and JavaScript calculator client.
The front end collects user input, sends HTTP JSON requests, and renders results
from the backend. It does not evaluate expressions locally.

## Technology Stack

- HTML5
- CSS Grid and Flexbox
- Native JavaScript Fetch API
- No framework and no build step

## Features

- Arithmetic expression input and keypad
- Base conversion for bases 2, 8, 10, and 16
- History search and pagination
- Light and dark themes
- Key press feedback animation
- Responsive desktop and mobile layout

## Runtime Environment

- A modern Chromium, Firefox, or Safari browser
- Python 3 optional for serving static files locally
- A running backend API

## Installation

There are no third-party dependencies and no `npm install` step. Clone or
download this repository and start a static file server.

## Startup

Start the backend first:

```powershell
python -m app.server
```

Then start this front end from this repository directory:

```powershell
python -m http.server 5500
```

Open:

```text
http://127.0.0.1:5500
```

Do not open `index.html` directly through `file://`, because browser security
rules may block API requests.

## Configuration

`config.js` stores the backend base URL:

```javascript
window.APP_CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8000",
};
```

For an ECS deployment where Nginx serves both the front end and `/api/`, use
an empty string:

```javascript
window.APP_CONFIG = {
  API_BASE_URL: "",
};
```

Do not append a trailing slash.

## Front-End and Back-End Connection

- `POST /api/calculations` evaluates an expression.
- `POST /api/conversions/base` converts a number base.
- `GET /api/history` loads history with search and pagination.
- `DELETE /api/history/{id}` deletes a record.

If the backend is unavailable, the interface remains usable, but new
calculations cannot produce valid results.

## Database Initialization

The front end does not create or modify the database. The backend initializes
the SQLite table. The front end only reads and updates history through the API.

## Browser Testing

- Verify arithmetic, parentheses, unary signs, and decimals.
- Verify invalid expressions and division by zero.
- Verify base conversion.
- Verify history search with the search button and 10 records per page.
- Verify theme switching and key animation.
- Verify history remains after a page refresh.
- Verify the layout at a 390 x 844 mobile viewport.
