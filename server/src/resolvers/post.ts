import {
    Arg,
    Ctx,
    FieldResolver,
    Int,
    Mutation,
    Query,
    Resolver,
    Root,
    UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import Comment from "../entities/Comment";
import Post from "../entities/Post";
import User from "../entities/User";
import Vote from "../entities/Vote";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { PostInput } from "./inputs/PostInput";
import { PaginatedPosts } from "./post/PaginatedPosts";

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => String)
    textSnippet(@Root() root: Post) {
        if (root.text.length <= 50) {
            return root.text;
        }
        return root.text.slice(0, 50) + "...";
    }

    @FieldResolver(() => User)
    creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
        return userLoader.load(post.creatorId);
    }

    @FieldResolver(() => Int, { nullable: true })
    async voteStatus(
        @Root() post: Post,
        @Ctx() { voteStatusLoader, req }: MyContext
    ) {
        if (!req.session.userId) return null;

        const vote = await voteStatusLoader.load({
            postId: post.id,
            userId: req.session.userId,
        });
        return vote ? vote.value : null;
    }

    @FieldResolver(() => [Comment], { nullable: true })
    async comments(@Root() post: Post) {
        return await getConnection().query(
            `
            SELECT c.id,
                c.comment,
                c."createdAt",
                c."userId",
                CASE
                    WHEN COUNT(r.id) > 0 THEN(
                        json_agg(
                            json_build_object(
                                'id',
                                r.id,
                                'comment',
                                r.comment,
                                'createdAt',
                                r."createdAt",
                                'userId',
                                r."userId"
                            )
                        )
                    )
                    ELSE NULL
                END AS "childComments"
            FROM "comment" AS c
                LEFT JOIN comment AS r ON r."parentCommentId" = c.id
            WHERE c."postId" = $1
                AND c."parentCommentId" IS NULL
            GROUP BY c.id,
                c.comment,
                c."createdAt",
                c."userId"
            ORDER BY c."createdAt" DESC
        `,
            [post.id]
        );
    }

    @Query(() => PaginatedPosts)
    async posts(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null
    ): Promise<PaginatedPosts> {
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;

        const parameters: any[] = [realLimitPlusOne];
        if (cursor) {
            parameters.push(new Date(parseInt(cursor)));
        }

        const posts = await getConnection().query(
            `
            SELECT p.*
            FROM post p 
            ${cursor ? `WHERE p."createdAt" < $2` : ""}
            ORDER BY
                p."createdAt" DESC LIMIT $1
        `,
            parameters
        );
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne,
        };
    }

    @Query(() => Post, { nullable: true })
    async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
        return await getConnection()
            .createQueryBuilder()
            .select(["post", "creator.id", "creator.username"])
            .from(Post, "post")
            .where("post.id=:id", { id })
            .leftJoin("post.creator", "creator")
            .getOne();
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg("postId", () => Int) postId: number,
        @Arg("value", () => Int) value: number,
        @Ctx() { req }: MyContext
    ) {
        const { userId } = req.session;

        if (value === 1 || value === -1) {
            const vote = await Vote.findOne({ where: { postId, userId } });

            if (vote && vote.value !== value) {
                await getConnection().transaction(async (tm) => {
                    await tm.query(
                        `UPDATE vote SET value = $1 WHERE "postId" = $2 and "userId" = $3`,
                        [value, postId, userId]
                    );

                    await tm.query(
                        `UPDATE post SET points = points + $1 WHERE id = $2`,
                        [2 * value, postId]
                    );
                });
            } else if (!vote) {
                await getConnection().transaction(async (tm) => {
                    await tm.query(
                        `INSERT INTO vote ("userId", "postId", "value") VALUES ($1,$2,$3)`,
                        [userId, postId, value]
                    );
                    await tm.query(
                        `UPDATE post SET points = points + $1 WHERE id = $2`,
                        [value, postId]
                    );
                });
            }
        }
        return true;
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") input: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {
        const newPost = await getConnection()
            .createQueryBuilder()
            .insert()
            .into(Post)
            .values({
                ...input,
                creatorId: req.session.userId,
            })
            .returning(["id", "title", "text"])
            .execute();

        return newPost.raw[0];
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

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async createComment(
        @Arg("comment") comment: string,
        @Arg("postId", () => Int) postId: number,
        @Arg("parentCommentId", () => Int, { nullable: true })
        parentCommentId: number | null,
        @Ctx() { req }: MyContext
    ) {
        const { userId } = req.session;

        await getConnection().transaction(async (tm) => {
            if (parentCommentId) {
                await tm.insert(Comment, {
                    comment,
                    postId,
                    userId,
                    parentCommentId,
                });
            } else {
                await tm.insert(Comment, {
                    comment,
                    postId,
                    userId,
                });
            }

            await tm.increment(Post, { id: postId }, "commentCount", 1);
        });

        return true;
    }
}

@Resolver(Comment)
export class CommentResolver {
    @FieldResolver()
    user(@Root() comment: Comment, @Ctx() { userLoader }: MyContext) {
        return userLoader.load(comment.userId);
    }

    //? Work Around for SQL query returning Date as string and graphql throwing an error
    //? for the comments(childComments) field resolver in Post
    @FieldResolver()
    createdAt(@Root() comment: Comment) {
        if (typeof comment.createdAt === "string")
            return new Date(comment.createdAt);

        return comment.createdAt;
    }
}

// SELECT
//                 c.id,
//                 c.comment,
//                 c."createdAt",
//                 json_build_object('username', u.username ) "user",
//                 json_agg( json_build_object('id', r.id, 'comment', r.comment, 'createdAt' , r."createdAt"::TIMESTAMP, 'user', json_build_object('username', ur.username)) ) AS "childComments"
//             FROM
//                 "comment" AS c
//                 LEFT JOIN
//                     comment AS r
//                     ON r."parentCommentId" = c.id
//                 INNER JOIN
//                     "user" AS u
//                     ON u.id = c."userId"
//                 INNER JOIN
//                     "user" AS ur
//                     ON ur.id = r."userId"
//             WHERE
//                 c."postId" = $1
//                 AND c."parentCommentId" IS NULL
//             GROUP BY
//                 c.id,
//                 c.comment,
//                 c."createdAt",
//                 u.id
//             ORDER BY
//                 c."createdAt" DESC
