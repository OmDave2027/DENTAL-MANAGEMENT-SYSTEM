# Dental Management System

## Run locally

1. Create the MySQL database and tables:

   ```bash
   mysql -u root -p < Server-Side/database.sql
   ```

2. Update `Server-Side/.env` with the local MySQL password and non-placeholder
   JWT secrets.

3. Start the API:

   ```bash
   cd Server-Side
   npm install
   npm run dev
   ```

4. In a second terminal, start the frontend:

   ```bash
   cd Client-Side
   npm install
   npm run dev
   ```

The frontend uses `http://localhost:5020` for the API by default. Set
`VITE_BACKEND_BASE_URL` in `Client-Side/.env` if the API uses another local
origin. Sign-up, login, and appointment booking write to MySQL through the API.