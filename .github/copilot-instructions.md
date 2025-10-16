This repository (PAMS) is a full-stack, opinionated monorepo: an Express + MongoDB backend (in `/backend`) and a Vite + React frontend (in `/frontend`). The notes below surface the minimal, concrete knowledge an AI coding assistant needs to be productive in pull-request sized tasks.

Keep guidance short and actionable. Prefer edits that are small, reversible, and covered by tests or manual smoke checks.

1. Big-picture architecture

- Backend: `backend/index.js` is the entrypoint. It connects to MongoDB using `backend/config/db.js`, wires fixed admin/dev users (`backend/middleware/fixedUsers.js`) and exposes routes under `/auth`, `/admin`, `/common`, `/team`.
- Frontend: `frontend/src` is feature-organized (auth, admin, mentor, student). API client is `frontend/src/services/axios.js` and expects backend at `http://localhost:5000` by default.

2. Auth & security patterns (important)

- Backend uses JWT stored in an HttpOnly cookie and also accepts `Authorization: Bearer <token>`; token logic is in `backend/middleware/authenticate.js`. When editing endpoints, preserve the cookie clearing behavior on token errors.
- Role checks use `backend/middleware/authorizeRoles.js`. Routes typically stack `authenticate` then `authorizeRoles(...)` — follow the same order.

3. Key environment variables

- `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL`, `ADMIN_PASS`, `DEFAULT_PASS` are required at startup (see `backend/index.js`). Use `.env.example` as a template in local dev.

4. Data model and domain conventions (examples)

- `User` roles: `student`, `mentor`, `admin`, `sub-admin`, `dev`. Role-specific subdocuments live at `backend/models/User.js` (e.g., `studentData.currentTeam`, `mentorData.assignedTeams`).
- `Team` codes are 6 uppercase alphanumeric strings (see `backend/models/Team.js` validator). Team workflows (create/join/leave/accept) are implemented in `backend/routes/common.js` and `backend/routes/team.js` — review these when changing team logic.
- `ProjectBank` documents have a TTL on rejected projects and virtual `isAvailable` (see model and index usage in `backend/models/ProjectBank.js`). Prefer querying `isApproved` + `assignedTeams.length < maxTeams` as code reads the virtual only after .lean/populate.

5. File uploads & limits

- Weekly status and PDFs use Multer (configured in `backend/routes/team.js`). Zip-only uploads for weekly-status, 50MB limit. When changing upload behavior, update the disk path under `backend/uploads/*` and the multer fileFilter/limits accordingly.

6. Dev / test workflows (concrete commands)

- Backend: from `/backend` run `npm install` then `npm run dev` (uses nodemon). Useful test commands: `npm run test` (runs internal test harness `test/runTests.js`) and `npm run test:ttl`.
- Frontend: from `/frontend` run `npm install` then `npm run dev` (Vite default port 5173). Axios baseURL points to `http://localhost:5000` in `frontend/src/services/axios.js`.

7. Conventions for API edits

- Keep response shapes consistent: error handler in `backend/middleware/errorManager.js` returns `{ message, stack }` (stack only in non-production). Use same shape for new endpoints.
- Populate only necessary fields (controllers use `.select()` and `.populate(...)` heavily to avoid large payloads). Follow existing patterns when returning user/team/project objects.

8. Common pitfalls and quick checks

- Always check `firstLogin` semantics: fixed users created by `fixedUsers()` are `firstLogin: true` and require password change flows.
- When editing DB connection or startup logic, preserve the env validation in `backend/index.js` (missing envs cause early exit).
- If touching mentor allocation, verify `mentor.currentPreference` logic in `backend/routes/common.js` (teams filter by current preference when fetching mentor-approval lists).

9. Where to look first for change impact

- Routes: `backend/routes/*.js`
- Models: `backend/models/*.js` (User, Team, ProjectBank)
- Middleware: `backend/middleware/*.js` (authenticate, authorizeRoles, errorManager, fixedUsers)
- Dev scripts: `backend/package.json` and `frontend/package.json`

10. When proposing changes to the frontend

- Modify `frontend/src/services/axios.js` only to adjust baseURL or global interceptors. For auth flows, front-end uses httpOnly cookie login — do not assume token is returned in JSON.

If anything above is unclear or you want the file to include extra examples (common PR checklist, preferred test snippets to run), tell me which area to expand and I will iterate.
