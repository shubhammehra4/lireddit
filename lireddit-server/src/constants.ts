export const __prod__ = process.env.NODE_ENV === "production";
export const port = process.env.PORT!;
export const redisHost = process.env.REDIS_HOST!;
export const redisPort = parseInt(process.env.REDIS_PORT!);
export const redisPassword = process.env.REDIS_PASSWORD!;
export const clientURL = process.env.CLIENT_URL!;
export const sessionSecret = process.env.SESSION_SECRET!;
export const cookieName = process.env.COOKIE_NAME!;
