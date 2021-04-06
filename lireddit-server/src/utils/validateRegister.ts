import { RegisterInput } from "src/resolvers/register/RegisterInput";

export const validateRegister = (input: RegisterInput) => {
    if (input.email.length <= 4 || !input.email.includes("@")) {
        return [
            {
                field: "email",
                message: "email is invalid",
            },
        ];
    }
    if (input.username.length <= 2 || input.username.includes("@")) {
        return [
            {
                field: "username",
                message: "username is invalid",
            },
        ];
    }

    if (input.password.length <= 2) {
        return [
            {
                field: "password",
                message: "password is too short",
            },
        ];
    }

    return null;
};
