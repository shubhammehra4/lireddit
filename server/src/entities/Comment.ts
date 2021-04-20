import { Field, ObjectType } from "type-graphql";
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
import { Post } from "./Post";
import { User } from "./User";

@ObjectType()
@Entity()
export class Comment extends BaseEntity {
    @Field()
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

    @Field({ nullable: true })
    @Column({ nullable: true })
    parentCommentId: number;

    @Field(() => [Comment])
    childComments: Comment[];

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
}
