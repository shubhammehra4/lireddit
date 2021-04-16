import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import pino from "pino";
import {
    clientURL,
    cookieName,
    port,
    redisHost,
    sessionSecret,
    __prod__,
} from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { MyContext } from "./types";
import { Updoot } from "./entities/Updoot";

const main = async () => {
    //TODO: Move to ormconfig
    const conn = await createConnection({
        type: "postgres",
        database: "lireddit2",
        username: "postgres",
        password: "qwerty",
        logging: "all",
        synchronize: true,
        maxQueryExecutionTime: 250,
        migrations: [path.join(__dirname, "./migrations/*")],
        entities: [Post, User, Updoot],
    });

    await conn.runMigrations();

    // await Post.delete({});

    const app = express();

    const RedisStore = connectRedis(session); //? Setup Redis Store with session
    const redis = new Redis(redisHost); //? connects to upstash
    redis.on("error", function (err) {
        throw err;
    });

    app.use(cors({ origin: clientURL, credentials: true })); //? CORS Setup

    app.use(
        session({
            name: cookieName,
            store: new RedisStore({
                client: redis,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365,
                httpOnly: true,
                sameSite: "lax",
                secure: __prod__,
            },
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }): MyContext => ({ req, res, redis }),
    });

    //? Base Resolver time to resolve
    if (!__prod__) {
        const logger = pino({
            prettyPrint: true,
        });

        app.use("/graphql", (req, res, next) => {
            const startHrTime = process.hrtime();

            res.on("finish", () => {
                if (req.body && req.body.operationName) {
                    const elapsedHrTime = process.hrtime(startHrTime);
                    const elapsedTimeInMs =
                        elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
                    if (req.body.operationName !== "IntrospectionQuery") {
                        logger.info({
                            type: "Time Tracing",
                            name: req.body.operationName,
                            ms: elapsedTimeInMs,
                        });
                    }
                }
            });

            next();
        });
    }

    apolloServer.applyMiddleware({ app, cors: false });

    app.listen(port, () => {
        console.log(`🚀 Server Running.........`);
        console.log(`http://localhost:4000/graphql`);
    });
};

main().catch((err) => {
    console.error(err);
});
