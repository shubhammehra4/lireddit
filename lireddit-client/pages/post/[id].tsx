import { Box, Heading } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import React from "react";
import Wrapper from "../../components/Wrapper";
import { createUrqlClient } from "../../utils/createUrqlClient";
import useGetPostFromCustomUrl from "../../utils/useGetPostFromCustomUrl";

interface PostProps {}

const Post: React.FC<PostProps> = ({}) => {
    const [{ data, fetching, error }] = useGetPostFromCustomUrl();

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
            <Heading>{data.post.title}</Heading>
            {data.post.text}
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
