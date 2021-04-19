import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import { Redis } from "ioredis";
import { createUserLoader } from "./utils/createUserLoader";
import { createVoteStatusLoader } from "./utils/createVoteStatusLoader";

export type MyContext = {
    req: Request & {
        session: Session & Partial<SessionData> & { userId?: number };
    };
    res: Response;
    redis: Redis;
    userLoader: ReturnType<typeof createUserLoader>;
    voteStatusLoader: ReturnType<typeof createVoteStatusLoader>;
};
