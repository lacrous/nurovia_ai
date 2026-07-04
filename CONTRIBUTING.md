# Contributing to Nurovia AI

Thanks for wanting to help! Nurovia AI is a personal product, not an open source community project — but if you find a bug or want to suggest something, please open an issue.

## Development

```bash
git clone https://github.com/lacrous/nurovia_ai.git
cd nurovia_ai
npm install
cp api/.env.example api/.env
# fill in DATABASE_URL + ENCRYPTION_KEY
npm run db:push
npm run dev
```

the app runs on `http://localhost:3001`.

## Testing

```bash
npm test              # both frontend + backend
npm run typecheck     # tsc --noEmit on both
```

## Pull requests

1. open an issue first describing the change
2. fork the repo, make the change on a branch
3. make sure tests pass + typecheck clean
4. open a PR with a clear description

## Bug reports

use [GitHub Issues](https://github.com/lacrous/nurovia_ai/issues) — include:
- what you did
- what you expected
- what happened instead
- browser + OS
- console errors (DevTools → Console)
- network errors if relevant (DevTools → Network)
