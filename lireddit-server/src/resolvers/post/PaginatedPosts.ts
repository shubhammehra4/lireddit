import { Field, ObjectType } from "type-graphql";
import { Post } from "../../entities/Post";

// @ObjectType()
// export class PostsResponse extends BasePost {
//     @Field(() => String)
//     textSnippet(@Root() root: PostsResponse) {
//         if (root.text.length <= 50) {
//             return root.text;
//         }
//         return root.text.slice(0, 50) + "...";
//     }
// }

@ObjectType()
export class PaginatedPosts {
    @Field(() => [Post])
    posts: Post[];
    @Field()
    hasMore: boolean;
}
