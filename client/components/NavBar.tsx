import { Box, Button, Flex, Heading, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { DarkModeSwitch } from "./DarkModeSwitch";
import { useRouter } from "next/router";

const NavBar: React.FC<{}> = ({}) => {
    const router = useRouter();
    const [{ data, fetching }] = useMeQuery({ pause: isServer() }); // CSR
    const [{ fetching: logoutfetching }, logout] = useLogoutMutation();
    let body = null;
    if (fetching) {
        body = null;
    } else if (!data?.me) {
        body = (
            <Flex>
                <NextLink href="/login">
                    <Link color="white" mr="3">
                        Login
                    </Link>
                </NextLink>
                <NextLink href="/register">
                    <Link color="white">Register</Link>
                </NextLink>
            </Flex>
        );
    } else {
        body = (
            <Flex>
                <Box>{data.me.username}</Box>
                <Button
                    onClick={async () => {
                        await logout();
                        router.reload();
                    }}
                    isLoading={logoutfetching}
                    mx={3}
                    variant="link">
                    Logout
                </Button>
            </Flex>
        );
    }
    return (
        <Flex
            bg="tan"
            p={4}
            position="sticky"
            zIndex={1}
            top={0}
            justifyContent="center">
            <Flex flex="1" maxWidth="800px" alignItems="center">
                <NextLink href="/">
                    <Heading cursor="pointer" color="white">
                        LiReddit
                    </Heading>
                </NextLink>
                <Box ml={`auto`}>{body}</Box>
                <DarkModeSwitch />
            </Flex>
        </Flex>
    );
};

export default NavBar;
