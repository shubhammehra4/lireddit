import { Flex, IconButton, Text } from "@chakra-ui/react";
import { Maybe } from "graphql/jsutils/Maybe";
import React from "react";
import { ImArrowUp, ImArrowDown } from "react-icons/im";
import { PostSinppetFragment, useVoteMutation } from "../generated/graphql";

interface VoteSectionProps {
    voteStatus: Maybe<number> | undefined;
    id: number;
    points: number;
}

const VoteSection: React.FC<VoteSectionProps> = ({
    id,
    voteStatus,
    points,
}) => {
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
                color={voteStatus === 1 ? "green" : undefined}
                background="transparent"
                onClick={() => {
                    if (voteStatus === 1) {
                        return;
                    }
                    vote({ postId: id, value: 1 });
                }}
            />
            <Text>{points}</Text>
            <IconButton
                as={ImArrowDown}
                aria-label="downvote"
                size="xs"
                background="transparent"
                color={voteStatus === -1 ? "tomato" : undefined}
                onClick={() => {
                    if (voteStatus === -1) {
                        return;
                    }
                    vote({ postId: id, value: -1 });
                }}
            />
        </Flex>
    );
};

export default VoteSection;
