import React, { ChangeEventHandler, InputHTMLAttributes } from "react";
import {
    FormControl,
    FormLabel,
    FormErrorMessage,
    Input,
    Textarea,
} from "@chakra-ui/react";

const InputField = ({
    label,
    name,
    type,
    onChange,
    onBlur,
    ref,
    textarea,
    error,
    message,
}: any) => {
    let InputOrTextarea: any = Input;
    if (textarea) {
        InputOrTextarea = Textarea;
    }
    return (
        <FormControl isInvalid={error}>
            <FormLabel htmlFor={name}>{label}</FormLabel>
            <InputOrTextarea
                name={name}
                type={type}
                ref={ref}
                onChange={onChange}
                onBlur={onBlur}
            />
            {error && <FormErrorMessage>{message}</FormErrorMessage>}
        </FormControl>
    );
};

export default InputField;
