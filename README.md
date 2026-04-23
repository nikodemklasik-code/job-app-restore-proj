# multivohub-jobapp

Product monorepo for the MultiVO Hub Job App.

## Local Development

1. Copy the example environment:
   ```bash
   cp .env.example .env
   ```
2. Start MySQL, wait for health, install dependencies, and prepare local setup:
   ```bash
   bash scripts/bootstrap-local.sh
   ```
3. Start the frontend and backend:
   ```bash
   npm run dev
   ```

### Quick verification

After bootstrapping, you can run these checks before starting work:

```bash
npm run test:backend
npm run test:frontend
npm run smoke:local
```

Default local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- MySQL: `127.0.0.1:3306`

## Notes

- Docker Desktop must be running before `scripts/bootstrap-local.sh`.
- Replace placeholder values in `.env` with real Clerk, OpenAI, and Stripe values before using protected product flows.
- The backend validates required environment variables through `lib/envSchema.mjs`.
