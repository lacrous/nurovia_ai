/**
 * Vercel serverless entry — wraps the Hono app for Vercel.
 *
 * Vercel's `@vercel/node` adapter expects either:
 *   (a) a default export of `(req, res) => Promise<Response>` (Node-style), OR
 *   (b) a default export of `{ fetch }` (Web-style — what Hono provides)
 *
 * Hono's `hono/vercel` adapter wraps the app for Vercel automatically.
 */
import { handle } from "hono/vercel";
import app from "./src/index";

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);

export default app;