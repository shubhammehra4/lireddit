import { User } from "../entities/User";
import { MyContext } from "../types";
import {
    Arg,
    Ctx,
    Field,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from "type-graphql";
import argon2 from "argon2";
import { cookieName } from "../constants";
import { RegisterInput } from "./register/RegisterInput";
import { LoginInput } from "./login/LoginInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { em }: MyContext
    ) {
        const user = await em.findOne(User, { email });
        if (!user) {
            return true;
        }
        const token = "hyfcauygdaciugiucds";
        await sendEmail(
            email,
            `<a href="http://localhost:3000/changepassword/${token}">reset password</a>`
        );

        return true;
    }

    @Query(() => User, { nullable: true })
    async me(@Ctx() { req, em }: MyContext) {
        if (!req.session.userId) {
            return null;
        }

        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("input") input: RegisterInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(input);

        if (errors) {
            return { errors };
        }
        const hashedPassword = await argon2.hash(input.password);
        const user = em.create(User, {
            username: input.username,
            email: input.email,
            password: hashedPassword,
        });
        // let user'
        try {
            // const result = await (em as EntityManager)
            //     .createQueryBuilder(User)
            //     .getKnexQuery()
            //     .insert({
            //         username: options.username,
            //         password: hashedPassword,
            //         created_at: new Date(),
            //         updated_at: new Date(),
            //     })
            //     .returning("*");
            // user = result[0];
            await em.persistAndFlush(user);
        } catch (err) {
            if (err.code === "23505") {
                //duplicate key
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
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("input") input: LoginInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(
            User,
            input.usernameOrEmail.includes("@")
                ? { email: input.usernameOrEmail }
                : { username: input.usernameOrEmail }
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
    logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                res.clearCookie(cookieName);
                if (err) {
                    console.log("Logout Error:", err); //!
                    resolve(false);
                    return;
                }
                resolve(true);
            })
        );
    }
}
