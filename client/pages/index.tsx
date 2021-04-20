import {
    Box,
    Button,
    Flex,
    Heading,
    IconButton,
    Link,
    Stack,
    Text,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { BiCommentDetail, BiEdit } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import UpdootSection from "../components/UpdootSection";
import Wrapper from "../components/Wrapper";
import {
    useDeletePostMutation,
    useMeQuery,
    usePostsQuery,
} from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { formatDistance } from "date-fns";

const Home: React.FC<{}> = ({}) => {
    const [pageVariables, setPageVariables] = useState({
        limit: 15,
        cursor: null as null | string,
    });
    const [{ data: meData }] = useMeQuery();
    const [{ data, fetching, stale, error }] = usePostsQuery({
        variables: pageVariables,
    });

    const [, deletePost] = useDeletePostMutation();

    if (!fetching && !data) {
        return <h1>Somthing went Wrong!</h1>;
    }

    const getDistance = (date: any) => {
        return formatDistance(new Date(date - 0), new Date(), {
            addSuffix: true,
        });
    };

    return (
        <Wrapper>
            <NextLink href="/create-post">
                <Link fontSize="xl" py={8} color="teal">
                    Create Post
                </Link>
            </NextLink>
            {!data ? (
                <div>Loading</div>
            ) : (
                <Stack spacing={8}>
                    {data.posts.posts.map((p) =>
                        !p ? null : (
                            <Flex
                                key={p.id}
                                p={4}
                                shadow="md"
                                borderWidth="1px">
                                <UpdootSection post={p} />
                                <Box ml={2} flex={1}>
                                    <NextLink
                                        href="/post/[id]"
                                        as={`/post/${p.id}`}>
                                        <Link>
                                            <Heading fontSize="xl">
                                                {p.title}
                                            </Heading>
                                        </Link>
                                    </NextLink>
                                    <Text pl="2">
                                        by {p.creator.username}{" "}
                                        {getDistance(p.createdAt)}
                                    </Text>
                                    <Flex alignItems="center">
                                        <Text flex={1} mt={4}>
                                            {p.textSnippet}
                                        </Text>
                                        {meData?.me?.id !==
                                        p.creator.id ? null : (
                                            <Box>
                                                <NextLink
                                                    href="/post/edit/[id]"
                                                    as={`/post/edit/${p.id}`}>
                                                    <IconButton
                                                        ml="auto"
                                                        as={BiEdit}
                                                        aria-label="Edit Post"
                                                        size="xs"
                                                        color="blue"
                                                        background="transparent"
                                                    />
                                                </NextLink>
                                                <IconButton
                                                    ml="auto"
                                                    as={MdDelete}
                                                    aria-label="Delete Post"
                                                    size="xs"
                                                    color="red"
                                                    background="transparent"
                                                    onClick={() => {
                                                        deletePost({
                                                            id: p.id,
                                                        });
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </Flex>
                                    <Box px="4" py="2">
                                        {p.commentCount ? (
                                            <Text>
                                                {p.commentCount}

                                                <BiCommentDetail
                                                    style={{
                                                        display: "inline-block",
                                                        marginLeft: "5px",
                                                    }}
                                                />
                                            </Text>
                                        ) : null}
                                    </Box>
                                </Box>
                            </Flex>
                        )
                    )}
                </Stack>
            )}
            {data && data.posts.hasMore ? (
                <Flex justifyContent="center">
                    <Button
                        onClick={() => {
                            setPageVariables({
                                limit: pageVariables.limit,
                                cursor:
                                    data.posts.posts[
                                        data.posts.posts.length - 1
                                    ].createdAt,
                            });
                        }}
                        my={8}
                        isLoading={stale}>
                        Load More
                    </Button>
                </Flex>
            ) : null}
        </Wrapper>
    );
};

//? withUrqlClient is a helper function in "next-urql" for ssr which can be
//? replaced by(not completely cache-exchange configuration changes required) getServerSideProps() which is built into Next.js
export default withUrqlClient(createUrqlClient, { ssr: true })(Home);
