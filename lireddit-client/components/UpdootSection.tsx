import { Flex, IconButton, Text } from "@chakra-ui/react";
import React from "react";
import { ImArrowUp, ImArrowDown } from "react-icons/im";
import { PostSinppetFragment, useVoteMutation } from "../generated/graphql";

interface UpdootSectionProps {
    post: PostSinppetFragment;
}

const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
    const [, vote] = useVoteMutation();
    return (
        <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            p={2}>
            <IconButton
                as={ImArrowUp}
                aria-label="upvote"
                size="xs"
                color={post.voteStatus === 1 ? "green" : undefined}
                background="transparent"
                onClick={() => {
                    if (post.voteStatus === 1) {
                        return;
                    }
                    vote({ postId: post.id, value: 1 });
                }}
            />
            <Text>{post.points}</Text>
            <IconButton
                as={ImArrowDown}
                aria-label="downvote"
                size="xs"
                background="transparent"
                color={post.voteStatus === -1 ? "tomato" : undefined}
                onClick={() => {
                    if (post.voteStatus === -1) {
                        return;
                    }
                    vote({ postId: post.id, value: -1 });
                }}
            />
        </Flex>
    );
};

export default UpdootSection;
