import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import React from "react";
import VoteSection from "../../components/VoteSection";
import Wrapper from "../../components/Wrapper";
import { createUrqlClient } from "../../utils/createUrqlClient";
import useGetPostFromCustomUrl from "../../utils/useGetPostFromCustomUrl";
import { formatDistance } from "date-fns";

interface PostProps {}

const Post: React.FC<PostProps> = ({}) => {
    const [{ data, fetching, error }] = useGetPostFromCustomUrl();
    const getDistance = (date: any) => {
        return formatDistance(new Date(date), new Date(), {
            addSuffix: true,
        });
    };

    if (fetching) {
        return (
            <Wrapper>
                <h1>Loading...</h1>
            </Wrapper>
        );
    }

    if (error) {
        return <div>{error.message}</div>;
    }

    if (!data?.post) {
        return (
            <Wrapper>
                <Box>Post doesn't exist</Box>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <Flex>
                <VoteSection
                    id={data.post.id}
                    voteStatus={data.post.voteStatus}
                    points={data.post.points}
                />
                <Box ml={3}>
                    <Heading>{data.post.title}</Heading>
                    <Text fontStyle="italic">
                        by {data.post.creator.username}
                    </Text>
                    <Text>{data.post.text}</Text>
                </Box>
            </Flex>
            {data.post.commentCount ? (
                <Box mt={8}>
                    <Heading size="lg">Comments</Heading>
                    {data.post.comments.map((c) => (
                        <Box key={c.id} my={3}>
                            <Flex justifyContent="space-between">
                                <Heading size="sm">{c.user.username}</Heading>
                                {getDistance(c.createdAt)}
                            </Flex>
                            <Text>{c.comment}</Text>
                            {c.childComments?.map((ch) => (
                                <Box key={ch.id} ml={8}>
                                    <Flex justifyContent="space-between">
                                        <Heading size="sm">
                                            {ch.user.username}
                                        </Heading>
                                        {getDistance(ch.createdAt)}
                                    </Flex>
                                    <Text>{ch.comment}</Text>
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>
            ) : (
                <Heading size="md" mt={8}>
                    No Comments Yet
                </Heading>
            )}
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
