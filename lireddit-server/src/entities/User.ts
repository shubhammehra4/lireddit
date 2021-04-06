import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {
    @Field(() => ID)
    @PrimaryKey()
    id!: number;

    @Field()
    @Property({ type: "text", unique: true })
    username!: string;

    @Field()
    @Property({ type: "text", unique: true })
    email!: string;

    @Property({ type: "text" })
    password!: string;

    // @Property({ type: "text" })
    // firstName!: string;

    // @Property({ type: "text" })
    // lastName!: string;

    // @Field()
    // name(@Root() parent: User): string {
    //     return `${parent.firstName} ${parent.lastName}`;
    // }

    @Field(() => String)
    @Property({ type: "date" })
    createdAt = new Date();

    @Field(() => String)
    @Property({ type: "date", onUpdate: () => new Date() })
    updatedAt = new Date();
}
