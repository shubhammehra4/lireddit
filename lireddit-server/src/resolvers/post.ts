import {
    Arg,
    Ctx,
    FieldResolver,
    ID,
    Int,
    Mutation,
    Query,
    Resolver,
    Root,
    UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { Updoot } from "../entities/Updoot";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { PaginatedPosts } from "./post/PaginatedPosts";
import { PostInput } from "./post/PostInput";

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => String)
    textSnippet(@Root() root: Post) {
        if (root.text.length <= 50) {
            return root.text;
        }
        return root.text.slice(0, 50) + "...";
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg("postId", () => ID) postId: number,
        @Arg("value", () => Int) value: number,
        @Ctx() { req }: MyContext
    ) {
        const { userId } = req.session;

        if (value === 1 || value === -1) {
            const updoot = await Updoot.findOne({ where: { postId, userId } });

            if (updoot && updoot.value !== value) {
                await getConnection().transaction(async (tm) => {
                    await tm.query(
                        `
                    UPDATE updoot SET value = $1
                    WHERE "postId" = $2 and "userId" = $3
                `,
                        [value, postId, userId]
                    );

                    await tm.query(
                        `
                    UPDATE post SET points = points + $1 WHERE id = $2
                `,
                        [2 * value, postId]
                    );
                });
            } else if (!updoot) {
                await getConnection().transaction(async (tm) => {
                    await tm.query(
                        `
                INSERT INTO updoot ("userId", "postId", "value") 
                VALUES ($1,$2,$3)
                `,
                        [userId, postId, value]
                    );
                    await tm.query(
                        `
                    UPDATE post SET points = points + $1 WHERE id = $2
                `,
                        [value, postId]
                    );
                });
            }
        }

        return true;
    }

    @Query(() => PaginatedPosts)
    async posts(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
        @Ctx() { req }: MyContext
    ): Promise<PaginatedPosts> {
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;

        const replacements: any[] = [realLimitPlusOne];
        if (req.session.userId) {
            replacements.push(req.session.userId);
        }

        let cursorIdx = 2;
        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
            cursorIdx = replacements.length;
        }

        const posts = await getConnection().query(
            `
            SELECT p.*,
            json_build_object(
              'id', u.id,
              'username', u.username
              ) creator,
            ${
                req.session.userId
                    ? '(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"'
                    : 'null as "voteStatus"'
            }
            FROM post p
            INNER JOIN public.user u on u.id = p."creatorId"
            ${cursor ? `WHERE p."createdAt" < $${cursorIdx}` : ""}
            ORDER BY p."createdAt" DESC
            LIMIT $1
        `,
            replacements
        );
        // const qb = getConnection()
        //     .getRepository(Post)
        //     .createQueryBuilder("p")
        //     .innerJoinAndSelect("p.creator", "u", 'u.id =p."creatorId"')
        //     .orderBy('p."createdAt"', "DESC")
        //     .take(realLimitPlusOne);
        // if (cursor) {
        //     qb.where('p."createdAt"< :cursor', {
        //         cursor: new Date(parseInt(cursor)),
        //     });
        // }
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne,
        };
    }

    @Query(() => Post, { nullable: true })
    post(@Arg("id", () => ID) id: number): Promise<Post | undefined> {
        return Post.findOne(id, { relations: ["creator"] });
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") input: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {
        return Post.create({
            ...input,
            creatorId: req.session.userId,
        }).save();
    }

    @Mutation(() => Post, { nullable: true })
    @UseMiddleware(isAuth)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("title") title: string,
        @Arg("text") text: string,
        @Ctx() { req }: MyContext
    ): Promise<Post | null> {
        const result = await getConnection()
            .createQueryBuilder()
            .update(Post)
            .set({ title, text })
            .where('id = :id AND "creatorId"= :creatorId', {
                id,
                creatorId: req.session.userId,
            })
            .returning("*")
            .execute();

        return result.raw[0];
    }
    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
        @Arg("id", () => Int) id: number,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        await Post.delete({ id, creatorId: req.session.userId });
        return true;
    }
}
