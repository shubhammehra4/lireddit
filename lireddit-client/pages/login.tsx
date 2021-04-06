import {
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    Button,
    InputRightElement,
    InputGroup,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Wrapper from "../components/Wrapper";
import { useLoginMutation } from "../generated/graphql";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";

interface loginProps {}

type loginInput = {
    usernameOrEmail: string;
    password: string;
};

const Login: React.FC<loginProps> = ({}) => {
    const router = useRouter();
    const [show, setShow] = useState(false);
    const handleClick = () => setShow(!show);
    const {
        handleSubmit,
        register,
        setError,
        clearErrors,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<loginInput>();

    const [, reg] = useLoginMutation();

    async function onSubmit(values: loginInput) {
        clearErrors();
        const response = await reg(values);
        if (response.data?.login.errors) {
            response.data.login.errors.map((err) => {
                if (err.field === "usernameOrEmail") {
                    setError("usernameOrEmail", {
                        type: "server",
                        message: err.message,
                    });
                } else if (err.field === "password") {
                    setError("password", {
                        type: "server",
                        message: err.message,
                    });
                }
            });
        } else if (response.data?.login.user) {
            router.push("/");
        }
    }

    return (
        <Wrapper variant="small">
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormControl
                    isInvalid={errors.usernameOrEmail?.message !== undefined}>
                    <FormLabel htmlFor="usernameOrEmail">
                        Username/Email
                    </FormLabel>
                    <Input
                        id="usernameOrEmail"
                        name="usernameOrEmail"
                        ref={register({
                            required: "Username/Email is Required",
                        })}
                    />
                    <FormErrorMessage>
                        {errors.usernameOrEmail &&
                            errors.usernameOrEmail.message}
                    </FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={errors.password?.message !== undefined}>
                    <FormLabel htmlFor="password">Password</FormLabel>
                    <InputGroup>
                        <Input
                            id="password"
                            name="password"
                            type={show ? "text" : "password"}
                            ref={register({
                                required: "Password is Required",
                            })}
                        />
                        <InputRightElement width="4.5rem">
                            <Button size="sm" onClick={handleClick}>
                                {show ? "Hide" : "Show"}
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>
                        {errors.password && errors.password.message}
                    </FormErrorMessage>
                </FormControl>
                <Button
                    mt={4}
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    w="full"
                    type="submit">
                    {isSubmitSuccessful ? `Logged in!` : `Log in`}
                </Button>
            </form>
        </Wrapper>
    );
};
export default withUrqlClient(createUrqlClient)(Login);
