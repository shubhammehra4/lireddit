import {
    Box,
    Button,
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
    InputGroup,
    InputRightElement,
    Link,
} from "@chakra-ui/react";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Wrapper from "../../components/Wrapper";
import { useChangePasswordMutation } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";

type newPassword = {
    newPassword: string;
};

const ChangePassword: NextPage = () => {
    const router = useRouter();
    const [, changePassword] = useChangePasswordMutation();
    const [show, setShow] = useState(false);
    const [tokenError, setTokenError] = useState("");
    const {
        handleSubmit,
        register,
        setError,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<newPassword>();

    async function onSubmit(values: newPassword) {
        const response = await changePassword({
            token:
                typeof router.query.token === "string"
                    ? router.query.token
                    : "",
            newPassword: values.newPassword,
        });

        if (response.data?.changePassword.errors) {
            response.data.changePassword.errors.map((err) => {
                if (err.field == "newPassword") {
                    setError("newPassword", {
                        type: "server",
                        message: err.message,
                    });
                }
                if (err.field == "token") {
                    setTokenError(err.message);
                }
            });
        } else if (response.data?.changePassword.user) {
            router.push("/");
        }
    }
    return (
        <Wrapper variant="small">
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormControl
                    isInvalid={errors.newPassword?.message !== undefined}>
                    <FormLabel htmlFor="newPassword">New Password</FormLabel>
                    <InputGroup>
                        <Input
                            id="newPassword"
                            type={show ? "text" : "password"}
                            {...register("newPassword", {
                                required: "Password is Required",
                                minLength: {
                                    value: 7,
                                    message: "Password is too short!",
                                },
                                maxLength: {
                                    value: 255,
                                    message: "Password is too long!",
                                },
                            })}
                        />
                        <InputRightElement width="4.5rem">
                            <Button
                                size="sm"
                                onClick={() => setShow((prev) => !prev)}>
                                {show ? "Hide" : "Show"}
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>
                        {errors.newPassword && errors.newPassword.message}
                    </FormErrorMessage>
                </FormControl>
                {tokenError ? (
                    <Flex justifyContent="space-between">
                        <Box color="red">{tokenError}</Box>
                        <NextLink href="/forgot-password">
                            <Link color="blue">Try Again</Link>
                        </NextLink>
                    </Flex>
                ) : null}
                <Button
                    mt={4}
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    w="full"
                    type="submit">
                    {isSubmitSuccessful && !tokenError
                        ? `Successful`
                        : `Change Password`}
                </Button>
            </form>
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient)(ChangePassword);
