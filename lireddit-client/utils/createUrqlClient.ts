import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { dedupExchange, fetchExchange, stringifyVariables } from "urql";
import { devtoolsExchange } from "@urql/devtools";
import {
    DeletePostMutationVariables,
    LoginMutation,
    LogoutMutation,
    MeDocument,
    MeQuery,
    RegisterMutation,
    VoteMutationVariables,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import gql from "graphql-tag";
import { isServer } from "./isServer";

//TODO: Better Global error Handling
// const errorExchange: Exchange = ({ forward }) => (ops$) => {
//     return pipe(
//         forward(ops$),
//         tap(({ error }) => {
//             if (error?.message.includes("not authenticated")) {
//                 Router.replace("/login");
//             }
//         })
//     );
// };

export const cursorPagination = (): Resolver => {
    return (_parent, fieldArgs, cache, info) => {
        const { parentKey: entityKey, fieldName } = info; //? Enitykey is "Query" and fieldname is "posts"

        const allFields = cache.inspectFields(entityKey); //? Returns all the Queries in the cache as entitykey is "Query"
        const fieldInfos = allFields.filter(
            (info) => info.fieldName === fieldName
        ); //? filtering out for the field we want i.e. fieldname(posts)

        const size = fieldInfos.length;
        if (size === 0) {
            //? No data(Cache Empty - Initial Network Request )
            return undefined;
        }

        const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
        const isInTheCache = cache.resolve(
            cache.resolve(entityKey, fieldKey) as string,
            "posts"
        ); //? (Cache Miss Or Hit)

        info.partial = !isInTheCache; //? If True: (Cache Miss & Network Request required)
        let hasMore = true;
        const results: string[] = [];
        fieldInfos.forEach((fi) => {
            const key = cache.resolve(entityKey, fi.fieldKey) as string;
            const data = cache.resolve(key, "posts") as string[];
            const _hasMore = cache.resolve(key, "hasMore");
            if (!_hasMore) {
                hasMore = _hasMore as boolean;
            }

            results.push(...data);
        }); //? Data in Cache

        return {
            __typename: "PaginatedPosts",
            hasMore,
            posts: results,
        };
    };
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
    let cookie = "";
    if (isServer()) {
        cookie = ctx?.req?.headers?.cookie;
    }
    return {
        url: "http://localhost:4000/graphql",
        fetchOptions: {
            credentials: "include" as const,
            headers: cookie
                ? {
                      cookie,
                  }
                : undefined,
        },
        exchanges: [
            devtoolsExchange,
            dedupExchange,
            cacheExchange({
                keys: {
                    PaginatedPosts: () => null,
                },
                resolvers: {
                    Query: {
                        posts: cursorPagination(),
                    },
                },
                updates: {
                    Mutation: {
                        deletePost: (_result, args, cache, info) => {
                            cache.invalidate({
                                __typename: "Post",
                                id: (args as DeletePostMutationVariables).id,
                            });
                        },
                        vote: (_result, args, cache, info) => {
                            const {
                                postId,
                                value,
                            } = args as VoteMutationVariables;
                            const data = cache.readFragment(
                                gql`
                                    fragment _ on Post {
                                        id
                                        points
                                        voteStatus
                                    }
                                `,
                                { id: postId } as any
                            );

                            if (data) {
                                if (data.voteStatus === value) {
                                    return;
                                }
                                const newPoints =
                                    (data.points as number) +
                                    (!data.voteStatus ? 1 : 2) * value;

                                cache.writeFragment(
                                    gql`
                                        fragment __ on Post {
                                            points
                                            voteStatus
                                        }
                                    `,
                                    {
                                        id: postId,
                                        points: newPoints,
                                        voteStatus: value,
                                    } as any
                                );
                            }
                        },
                        createPost: (_result, args, cache, info) => {
                            const allFields = cache.inspectFields("Query"); //? Returns all the Queries in the cache as entitykey is "Query"
                            const fieldInfos = allFields.filter(
                                (info) => info.fieldName === "posts"
                            );

                            fieldInfos.forEach((fi) => {
                                cache.invalidate(
                                    "Query",
                                    "posts",
                                    fi.arguments || {}
                                );
                            });
                        },
                        logout: (_result, args, cache, info) => {
                            betterUpdateQuery<LogoutMutation, MeQuery>(
                                cache,
                                { query: MeDocument },
                                _result,
                                () => ({ me: null })
                            );
                        },
                        login: (_result, args, cache, info) => {
                            betterUpdateQuery<LoginMutation, MeQuery>(
                                cache,
                                { query: MeDocument },
                                _result,
                                (result, query) => {
                                    if (result.login.errors) {
                                        return query;
                                    } else {
                                        return {
                                            me: result.login.user,
                                        };
                                    }
                                }
                            );
                        },
                        register: (_result, args, cache, info) => {
                            betterUpdateQuery<RegisterMutation, MeQuery>(
                                cache,
                                { query: MeDocument },
                                _result,
                                (result, query) => {
                                    if (result.register.errors) {
                                        return query;
                                    } else {
                                        return {
                                            me: result.register.user,
                                        };
                                    }
                                }
                            );
                        },
                    },
                },
            }),
            ssrExchange,
            fetchExchange,
        ],
    };
};
