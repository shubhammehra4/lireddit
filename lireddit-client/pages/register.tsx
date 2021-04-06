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
import { useRegisterMutation } from "../generated/graphql";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";

interface registerProps {}

type registerInput = {
    username: string;
    password: string;
    email: string;
};

const Register: React.FC<registerProps> = ({}) => {
    const router = useRouter();
    const [show, setShow] = useState(false);
    const handleClick = () => setShow(!show);
    const {
        handleSubmit,
        register,
        setError,
        clearErrors,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<registerInput>();

    const [, reg] = useRegisterMutation();

    async function onSubmit(values: registerInput) {
        clearErrors();
        const response = await reg(values);
        if (response.data?.register.errors) {
            response.data.register.errors.map((err) => {
                if (err.field === "username") {
                    setError("username", {
                        type: "server",
                        message: err.message,
                    });
                } else if (err.field == "email") {
                    setError("email", {
                        type: "server",
                        message: err.message,
                    });
                }
            });
        } else if (response.data?.register.user) {
            router.push("/");
        }
    }

    return (
        <Wrapper variant="small">
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormControl isInvalid={errors.email?.message !== undefined}>
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <Input
                        id="email"
                        name="email"
                        ref={register({
                            required: "Email is Required",
                            maxLength: {
                                value: 255,
                                message: "Email is too long!",
                            },
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid Email",
                            },
                        })}
                    />
                    <FormErrorMessage>
                        {errors.email && errors.email.message}
                    </FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={errors.username?.message !== undefined}>
                    <FormLabel htmlFor="username">Username</FormLabel>
                    <Input
                        id="username"
                        name="username"
                        ref={register({
                            required: "Username is Required",
                            minLength: {
                                value: 2,
                                message: "Username is too short!",
                            },
                            maxLength: {
                                value: 50,
                                message: "Username is too long!",
                            },
                            pattern: {
                                value: /^[A-Za-z0-9]+(?:[_.-][A-Za-z0-9]+)*$/,
                                message: "Username is Invalid",
                            },
                        })}
                    />
                    <FormErrorMessage>
                        {errors.username && errors.username.message}
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
                    {isSubmitSuccessful ? `Registered!` : `Register`}
                </Button>
            </form>
        </Wrapper>
    );
};
export default withUrqlClient(createUrqlClient)(Register);
