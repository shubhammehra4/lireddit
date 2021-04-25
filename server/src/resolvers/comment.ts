import {
    Arg,
    Ctx,
    FieldResolver,
    Int,
    Mutation,
    Resolver,
    Root,
    UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import Comment from "../entities/Comment";
import Post from "../entities/Post";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

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
