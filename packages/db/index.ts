import { prisma } from "./lib/prisma";

function main() {
    let userId;
    const user = prisma.user.findFirst({
        where: {
            userId,
            
        }
    })
}