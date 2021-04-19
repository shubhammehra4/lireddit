import {
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import React from "react";
import { useForm } from "react-hook-form";
import Wrapper from "../components/Wrapper";
import { useForgotPasswordMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const ForgotPassword: React.FC<{}> = ({}) => {
    const [, forgotPassword] = useForgotPasswordMutation();
    const {
        handleSubmit,
        register,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<{ email: string }>();

    async function onSubmit(values: { email: string }) {
        await forgotPassword(values);
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
                            required: "Email Required",
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
                <Button
                    mt={4}
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    w="full"
                    type="submit">
                    {isSubmitSuccessful ? `Successful` : `Forgot Password`}
                </Button>
                {isSubmitSuccessful
                    ? "Please check your mail for changing the password"
                    : null}
            </form>
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
