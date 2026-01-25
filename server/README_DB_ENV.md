MySQL Environment Variables
==========================

This file describes the environment variables used by `server/mysqlAdapter.js`.

Do not commit your real `.env` file to source control.

Variables (example values shown in `.env.example`):

- MYSQL_HOST - hostname or IP of your MySQL server (default: `localhost`)
- MYSQL_PORT - port number (default: `3306`)
- MYSQL_USER - database username (default: `root`)
- MYSQL_PASSWORD - database user password (default: `''`)
- MYSQL_DATABASE - database name (default: `moibook_db`)

Usage (PowerShell):

1. Copy `.env.example` to `.env` and edit values:

   copy .env.example .env

2. Start the server (npm script):

   npm run server

The server will load environment variables from `.env` (via `dotenv`).

Troubleshooting: Access denied for 'root'@'localhost'
---------------------------------------------------

- If `npm run server` logs "Access denied for user 'root'@'localhost'", your MySQL `root` password may be different than the one in `.env`.
- You can either reset the root password (init-file or skip-grant-tables methods) or create a dedicated application user with appropriate privileges and set `MYSQL_USER`/`MYSQL_PASSWORD` in `.env`.
- See the project root README and the developer chat for step-by-step PowerShell commands to reset root or create the `moibook` user.
