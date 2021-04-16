import DataLoader from "dataloader";
import { User } from "src/entities/User";

export const createUserLoader = () =>
    new DataLoader<number, User>(async (userIds) => {
        const users = await User.findByIds(userIds as number[]);

        const userIdToUser: Record<number, User> = {};
        users.forEach((u) => {
            userIdToUser[u.id] = u;
        });
        return userIds.map((userId) => userIdToUser[userId]);
    });
