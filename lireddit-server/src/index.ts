import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });
import { MikroORM } from "@mikro-orm/core";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from "cors";
import {
    clientURL,
    cookieName,
    port,
    redisHost,
    redisPassword,
    redisPort,
    sessionSecret,
    __prod__,
} from "./constants";
// import { User } from "./entities/User";

const main = async () => {
    const orm = await MikroORM.init(mikroConfig);
    // await orm.em.nativeDelete(User, {});
    await orm.getMigrator().up();

    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
    });
    redisClient.on("error", function (err) {
        throw err;
    });

    app.use(
        cors({
            origin: clientURL,
            credentials: true,
        })
    );

    app.use(
        session({
            name: cookieName,
            store: new RedisStore({
                client: redisClient,
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
        context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
    });

    apolloServer.applyMiddleware({
        app,
        cors: false,
    });

    app.listen(port, () => {
        console.log(`🚀 Server Running.....`);
    });
};

main().catch((err) => {
    console.error(err);
});
