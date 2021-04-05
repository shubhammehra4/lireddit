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
import { COOKIE_NAME } from "../constants";
import { RegisterInput } from "./register/RegisterInput";
import { LoginInput } from "./login/LoginInput";

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
        if (input.username.length <= 2) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "username is invalid",
                    },
                ],
            };
        }

        if (input.password.length <= 2) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "password is too short",
                    },
                ],
            };
        }
        const hashedPassword = await argon2.hash(input.password);
        const user = em.create(User, {
            username: input.username,
            firstName: input.firstName,
            lastName: input.lastName,
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
        const user = await em.findOne(User, { username: input.username });
        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Username is not registered!",
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
                res.clearCookie(COOKIE_NAME);
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
