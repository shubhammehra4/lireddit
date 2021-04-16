import { RegisterInput } from "src/resolvers/register/RegisterInput";

export const validateRegister = (input: RegisterInput) => {
    if (input.email.length <= 4 || !input.email.includes("@")) {
        return [
            {
                field: "email",
                message: "Email is Invalid",
            },
        ];
    }
    if (input.username.length <= 2 || input.username.includes("@")) {
        return [
            {
                field: "username",
                message: "Username is Invalid",
            },
        ];
    }

    if (input.password.length <= 2) {
        return [
            {
                field: "password",
                message: "Password is too short",
            },
        ];
    }

    return null;
};
