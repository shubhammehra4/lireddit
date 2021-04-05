import { Box, Flex, Link } from "@chakra-ui/layout";
import React from "react";
import NextLink from "next/link";
import { DarkModeSwitch } from "./DarkModeSwitch";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { Button } from "@chakra-ui/button";
import { isServer } from "../utils/isServer";

interface navbarProps {}

const NavBar: React.FC<navbarProps> = ({}) => {
    const [{ data, fetching }] = useMeQuery({ pause: isServer() });
    const [{ fetching: logoutfetching }, logout] = useLogoutMutation();
    let body = null;
    if (fetching) {
        body = null;
    } else if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link color="white" mr="3">
                        Login
                    </Link>
                </NextLink>
                <NextLink href="/register">
                    <Link color="white">Register</Link>
                </NextLink>
            </>
        );
    } else {
        body = (
            <Flex>
                <Box>{data.me.username}</Box>
                <Button
                    onClick={() => logout()}
                    isLoading={logoutfetching}
                    mx={3}
                    variant="link">
                    Logout
                </Button>
            </Flex>
        );
    }
    return (
        <Flex bg="tan" p={4} ml="auto">
            <Box ml={`auto`}>{body}</Box>
            <DarkModeSwitch />
        </Flex>
    );
};

export default NavBar;
