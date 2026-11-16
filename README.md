# F26_3354_10 
Software Engineering Class Project 
Team Name: Hard Hat Team 
Team Number: 10

# Construction Safety

- Role-based construction site safety app for employees, supervisors, and safety officers.
- Employees can check in/out and view assigned tasks.
- Supervisors can assign tasks, review check-in logs, submit hazard/violation reports, and manage equipment safety concerns.
- Safety officers can manage safety announcements and equipment concerns.
- Built with React, Vite, and Supabase.

## Run locally

- Requires Node.js and a Supabase project configured for the app.
- Create `.env.local` with your Supabase project credentials:
  ```env
  VITE_SUPABASE_URL=your-supabase-project-url
  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
  ```
- Run `npm install`, then `npm run dev`.
- Run `npm test` for tests or `npm run build` to build the app.
