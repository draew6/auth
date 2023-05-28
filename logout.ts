import { Options, FastifyInstanceWithHooks, FastifySwaggerSchema, FastifyRequestWithUser, User } from "./types";
import { FastifyReply } from "fastify";

export default async (app: FastifyInstanceWithHooks, options: Options) => {
    const { prisma } = options
    app.delete("/logout", {
        preHandler: app.authorize,
        schema: {
            description: "Destroy Auth Token, so its no valid anymore and every device has to login again to get new one.",
            tags: ["user"],
            summary: "Destroys Auth Token",
            security: [{ oauth: [] }]
        } as FastifySwaggerSchema,
    },
        async (request: FastifyRequestWithUser, reply: FastifyReply) => {
            const user = request.user as User
            await prisma.auth.deleteMany({ where: { userId: user.id } })
        }
    )
}
