import { Field, InputType } from "type-graphql";

@InputType()
export class RegisterInput {
    @Field()
    username: string;

    @Field()
    password: string;

    @Field()
    firstName: string;

    @Field()
    lastName: string;
}
