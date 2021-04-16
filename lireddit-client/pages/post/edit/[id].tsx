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
import Wrapper from "../../../components/Wrapper";
import {
    PostInput,
    usePostQuery,
    useUpdatePostMutation,
} from "../../../generated/graphql";
import { createUrqlClient } from "../../../utils/createUrqlClient";
import { useIsAuth } from "../../../utils/useIsAuth";

const EditPost: React.FC<{}> = ({}) => {
    const router = useRouter();
    const postId = typeof router.query.id === "string" ? router.query.id : "-1";
    const [{ data, fetching, error }] = usePostQuery({
        pause: postId === "-1",
        variables: {
            id: postId,
        },
    });
    const [, updatePost] = useUpdatePostMutation();

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
                <div>Post doesn't exist</div>
            </Wrapper>
        );
    }
    useIsAuth();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<PostInput>({
        defaultValues: { text: data.post.text, title: data.post.title },
    });

    const onSubmit = async (values: PostInput) => {
        await updatePost({ id: parseInt(postId), ...values });
        router.back();
    };

    return (
        <Wrapper variant="small">
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormControl isInvalid={errors.title?.message !== undefined}>
                    <FormLabel htmlFor="title">Title</FormLabel>
                    <Input
                        id="title"
                        name="title"
                        ref={register({
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
                        name="text"
                        ref={register({
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
                    Update Post
                </Button>
            </form>
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(EditPost);
