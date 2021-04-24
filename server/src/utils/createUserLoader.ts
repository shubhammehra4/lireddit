import DataLoader from "dataloader";
import User from "../entities/User";

export const createUserLoader = () =>
    new DataLoader<number, User>(async (userIds) => {
        const users = await User.findByIds(userIds as number[], {
            select: ["id", "username"],
        });

        const userIdToUser: Record<number, User> = {};
        users.forEach((u) => {
            userIdToUser[u.id] = u;
        });
        return userIds.map((userId) => userIdToUser[userId]);
    });
