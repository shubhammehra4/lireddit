import { Field, Int, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import Post from "./Post";
import User from "./User";

@ObjectType()
@Entity()
export default class Comment extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column({ type: "text" })
    comment: string;

    @PrimaryColumn()
    userId: number;

    @PrimaryColumn()
    postId: number;

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.comments)
    user: User;

    @ManyToOne(() => Post, (post) => post.comments, { onDelete: "CASCADE" })
    post: Post;

    @Field(() => Int, { nullable: true })
    @Column({ nullable: true, type: "int" })
    parentCommentId: number;

    @Field(() => [Comment], { nullable: true })
    childComments: Partial<Comment>[];

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
}
