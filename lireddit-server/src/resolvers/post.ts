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
import { Post } from "../entities/Post";
import { Vote } from "../entities/Vote";
import { Comment } from "../entities/Comment";
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

    //? Alternative to inner join but requires data loaders
    // @FieldResolver(() => User)
    // creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    //     return userLoader.load(post.creatorId);
    // }

    // @FieldResolver(() => Int, { nullable: true })
    // async voteStatus(
    //     @Root() post: Post,
    //     @Ctx() { updootStatusLoader, req }: MyContext
    // ) {
    //     if (!req.session.userId) {
    //         return null;
    //     }
    //     const updoot = await updootStatusLoader.load({
    //         postId: post.id,
    //         userId: req.session.userId,
    //     });
    //     return updoot ? updoot.value : null;
    // }

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
                    ? '(select value FROM vote WHERE "userId" = $2 AND "postId" = p.id) "voteStatus"'
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
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne,
        };
    }

    @Query(() => Post, { nullable: true })
    async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
        return await getConnection()
            .createQueryBuilder()
            .select([
                "post",
                "creator.id",
                "creator.username",
                "comments.id",
                "comments.comment",
                "comments.createdAt",
                "comments.parentCommentId",
            ])
            .from(Post, "post")
            .where("post.id=:id", { id })
            .innerJoin("post.creator", "creator")
            .innerJoin("post.comments", "comments")
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
                        `
                        UPDATE vote SET value = $1
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
            } else if (!vote) {
                await getConnection().transaction(async (tm) => {
                    await tm.query(
                        `
                        INSERT INTO vote ("userId", "postId", "value") 
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
        @Arg("parentCommentId", { nullable: true })
        parentCommentId: number,
        @Ctx() { req }: MyContext
    ) {
        const { userId } = req.session;

        await getConnection()
            .createQueryBuilder()
            .insert()
            .into(Comment)
            .values({ comment, postId, userId, parentCommentId })
            .execute();

        return true;
    }
}
