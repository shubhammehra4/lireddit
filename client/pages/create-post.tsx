import {
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
    Textarea,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { useForm } from "react-hook-form";
import Wrapper from "../components/Wrapper";
import { PostInput, useCreatePostMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useIsAuth } from "../utils/useIsAuth";

const CretePost: React.FC<{}> = ({}) => {
    const router = useRouter();
    useIsAuth();
    const [, createPost] = useCreatePostMutation();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<PostInput>();

    const onSubmit = async (values: PostInput) => {
        const { error } = await createPost({ input: values });
        if (!error) {
            router.push("/");
        }
    };

    return (
        <Wrapper variant="small">
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormControl isInvalid={errors.title?.message !== undefined}>
                    <FormLabel htmlFor="title">Title</FormLabel>
                    <Input
                        id="title"
                        {...register("title", {
                            required: "Title Required",
                        })}
                    />
                    <FormErrorMessage>
                        {errors.title && errors.title.message}
                    </FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={errors.text?.message !== undefined}>
                    <FormLabel htmlFor="text">Body</FormLabel>
                    <Textarea
                        id="text"
                        {...register("text", {
                            required: "This field cannot be left blank",
                        })}
                    />

                    <FormErrorMessage>
                        {errors.text && errors.text.message}
                    </FormErrorMessage>
                </FormControl>
                <Button
                    mt={4}
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    w="full"
                    type="submit">
                    Create Post
                </Button>
            </form>
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient)(CretePost);
