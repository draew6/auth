import { Options, FastifyInstanceWithHooks, FastifySwaggerSchema, FastifyRequestWithUser, User } from "./types";
import { FromSchema } from "json-schema-to-ts";
import { FastifyReply } from "fastify";


const body = {
    type: "object",
    required: ["oldPassword", "newPassword"],
    properties: {
        oldPassword: {
            type: "string",
            description: "Enter Old Password."
        },
        newPassword: {
            type: "string",
            minLength: 6,
            maxLength: 35,
            description: "New password must be 6-35 chars long."
        }
    }
} as const

type Body = FromSchema<typeof body>

export default async (app: FastifyInstanceWithHooks, options: Options) => {
    const { prisma } = options
    app.post("/change_password", {
        preHandler: app.authorize,
        schema: {
            description: "Enter Old Password and if its valid then users password is updated to new_password parameter.",
            tags: ["user"],
            summary: "Change Password",
            body,
            security: [{ oauth: [] }]
        } as FastifySwaggerSchema
    },
        async (request: FastifyRequestWithUser, reply: FastifyReply) => {
            const user = request.user as User
            const { oldPassword, newPassword } = request.body as Body
            if (await app.verifyPassword(oldPassword, user.password)) {
                await prisma.user.update({
                    where: {
                        id: user.id
                    },
                    data: {
                        password: await app.getPasswordHash(newPassword)
                    }
                })
                await prisma.reset.deleteMany({ where: { userId: user.id } })
            } else {
                reply.status(409).send({})
            }
        })
}
