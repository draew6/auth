import { Options, FastifySwaggerSchema, FastifyInstanceWithHooks, FastifyRequestWithUser, User } from "./types";
import { FromSchema } from "json-schema-to-ts";
import { FastifyReply } from "fastify";


const body = {
    type: "object",
    required: ["token", "password"],
    properties: {
        token: {
            type: "string",
            description: "Reset Token is received by mail."
        },
        password: {
            type: "string",
            minLength: 6,
            maxLength: 35,
            description: "New password must be 6-35 characters long."
        }
    }
} as const

type Body = FromSchema<typeof body>

export default async (app: FastifyInstanceWithHooks, options: Options) => {
    const { prisma } = options
    app.post("/set_password", {
        schema: {
            description: "Set New Password after resseting password. Reset token is verified. Password is changed and Reset Token destroyed.",
            tags: ["user"],
            summary: "Send valid Reset Token and Set New Password after.",
            body
        } as FastifySwaggerSchema
    },
        async (request: FastifyRequestWithUser, reply: FastifyReply) => {
            const body = request.body as Body
            const { token, password } = body
            const resetToken = await prisma.reset.findUnique({
                where: {
                    token
                }
            })
            if (!resetToken) {
                return reply.status(404).send({})
            }
            const { userId } = resetToken
            const hashedPassword = await app.getPasswordHash(password)
            await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    password: hashedPassword
                }
            })
            await prisma.reset.deleteMany({
                where: {
                    userId
                }
            })
        }
    )
}
