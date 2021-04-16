import { Field, ID, Int, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Updoot } from "./Updoot";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    title!: string;

    @Field()
    @Column("text")
    text!: string;

    @Field(() => Int)
    @Column({ type: "int", default: 0 })
    points!: number;

    @Field(() => Int, { nullable: true })
    voteStatus: number | null;

    @Field()
    @Column()
    creatorId: number;

    @Field()
    @ManyToOne(() => User, (user) => user.posts)
    creator: User;

    @OneToMany(() => Updoot, (updoot) => updoot.user)
    updoots: Updoot[];

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}

// @ObjectType()
// export class BasePost {
//     @Field(() => ID)
//     id!: number;

//     @Field()
//     title!: string;

//     @Field()
//     text!: string;

//     @Field(() => Int)
//     points!: number;

//     @Field(() => BaseUser)
//     creator: BaseUser;

//     @Field(() => String)
//     createdAt: Date;

//     @Field(() => String)
//     updatedAt: Date;
// }
