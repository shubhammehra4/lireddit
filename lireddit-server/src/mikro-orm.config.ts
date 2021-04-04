import path from "path";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

export default {
    migrations: {
        path: path.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/,
    },
    entities: [Post, User],
    dbName: "lireddit",
    type: "postgresql",
    user: "postgres",
    password: "qwerty",
    debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];
