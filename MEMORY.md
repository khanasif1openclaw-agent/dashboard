# MEMORY.md

## Ongoing: Kanban task dashboard + daily email (requested 2026-03-16)
- Build and maintain a Kanban board to track tasks the user assigns.
- Columns: **To Do**, **In Progress**, **Done**.
- New tasks will be explicitly prefixed by the user with: **"New Task"**.
- If user doesn’t specify a due date, treat as **no due date**.
- User will prompt new requests; only treat messages as new tasks when prefixed with "New Task".
- Publish the board to the web via **GitHub Pages (public)**.
- Send a **daily email report at 10:00 AM AEDT (Australia/Sydney)** with:
  - current board status
  - tasks due today (only those with an explicit due date matching today)
- For all future “send an email” actions: use **gog** to email **khanasif1@gmail.com** by default (unless user overrides).
