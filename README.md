# Horax

This is a React application transformed from the original vanilla HTML/JS Time Manager, now evolved into **Horax**.

## Features

- **Dashboard**: View daily/weekly progress, remaining time, and upcoming tasks.
- **Tasks**: Create, edit, delete tasks with overlap detection and suggested time slots.
- **Analytics**: Visualize time usage by task and category, and weekly overview.
- **Notifications**: Get notified when tasks are about to start.
- **Data Persistence**: All data is saved to LocalStorage.
- **Database Ready**: Configured for Neon database connection.

## Tech Stack

- React
- Vite
- Chart.js (react-chartjs-2)
- React Icons
- Vanilla CSS (ported from original)
- @neondatabase/serverless (for database connection)

## Running the App

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Database (Optional):
   - Copy `.env.example` to `.env`
   - Add your Neon connection string to `VITE_DATABASE_URL`

3. Run development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```
