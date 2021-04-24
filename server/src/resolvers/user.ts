import argon2 from "argon2";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { getConnection } from "typeorm";
import { v4 } from "uuid";
import { cookieName, FORGOT_PASSWORD_PREFIX } from "../constants";
import User from "../entities/User";
import { MyContext } from "../types";
import { sendEmail } from "../utils/sendEmail";
import { validateRegister } from "../utils/validateRegister";
import { LoginInput } from "./inputs/LoginInput";
import { RegisterInput } from "./inputs/RegisterInput";
import { UserResponse } from "./responses/UserResponse";

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse)
    async register(
        @Arg("input") input: RegisterInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(input);

        if (errors) {
            return { errors };
        }
        const hashedPassword = await argon2.hash(input.password);
        let user: any;
        try {
            const result = await getConnection()
                .createQueryBuilder()
                .insert()
                .into(User)
                .values({
                    username: input.username,
                    email: input.email,
                    password: hashedPassword,
                })
                .returning("*")
                .execute();
            user = result.raw[0];
        } catch (err) {
            //? duplicate key
            if (err.code === "23505") {
                if (err.detail.includes("email")) {
                    return {
                        errors: [
                            {
                                field: "email",
                                message: "Email Already Registered!",
                            },
                        ],
                    };
                }
                return {
                    errors: [
                        {
                            field: "username",
                            message: "Username Already Taken!",
                        },
                    ],
                };
            }
        }
        //TODO: Confirmation Email
        if (user) {
            req.session.userId = user.id;
        }

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("input") input: LoginInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne(
            input.usernameOrEmail.includes("@")
                ? { where: { email: input.usernameOrEmail } }
                : { where: { username: input.usernameOrEmail } }
        );
        if (!user) {
            return {
                errors: [
                    {
                        field: "usernameOrEmail",
                        message: "Username/Email is not registered!",
                    },
                ],
            };
        }
        const valid = await argon2.verify(user.password, input.password);
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Incorrect Password!",
                    },
                ],
            };
        }
        req.session.userId = user.id;
        return { user };
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { redis }: MyContext
    ) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return true;
        }
        const token = v4();
        await redis.set(
            FORGOT_PASSWORD_PREFIX + token,
            user.id,
            "ex",
            1000 * 60 * 60 * 24
        ); //! 1 day
        await sendEmail(
            email,
            `<a href="http://localhost:3000/change-password/${token}">reset password</a>`,
            "Forgot Password"
        );

        return true;
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { redis, req }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 2) {
            return {
                errors: [
                    { field: "newPassword", message: "password is too short" },
                ],
            };
        }
        const key = FORGOT_PASSWORD_PREFIX + token;
        const userId = await redis.get(key);

        if (!userId) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "Token Expired",
                    },
                ],
            };
        }
        const uId = parseInt(userId);
        const user = await User.findOne(uId);

        if (!user) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "user no longer exists",
                    },
                ],
            };
        }

        const newHashedPassword = await argon2.hash(newPassword);
        await getConnection()
            .createQueryBuilder()
            .update(User)
            .set({ password: newHashedPassword })
            .where("id = :id", { id: uId })
            .execute();
        // await User.update(
        //     { id: uId },
        //     { password: await argon2.hash(newPassword) }
        // );
        await redis.del(key); //? Token can only be used once
        req.session.userId = user.id; //? log in automatically

        return { user };
    }

    @Query(() => User, { nullable: true })
    me(@Ctx() { req }: MyContext) {
        if (!req.session.userId) {
            return null;
        }
        return User.findOne(req.session.userId);
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                res.clearCookie(cookieName);
                if (err) {
                    console.log("Logout Error:", err);
                    resolve(false);
                    return;
                }
                resolve(true);
            })
        );
    }
}
