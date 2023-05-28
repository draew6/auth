import { Options, FastifyInstanceWithHooks, FastifySwaggerSchema, FastifyRequestWithUser } from "./types";
import { FromSchema } from "json-schema-to-ts";
import { FastifyReply } from "fastify";

const body = {
    type: "object",
    required: ["username", "password"],
    properties: {
        username: {
            type: "string",
            description: "Username is case insensitive. Must be 3-15 chars long. Must contain non numerical characters. Only valid characters."
        },
        password: {
            type: "string",
            description: "Password must be 6-35 chars long"
        }
    }
} as const

const successResponse = {
    type: "object",
    properties: {
        access_token: {
            type: "string",
        },
        token_type: {
            type: "string",
        },
        userId: {
            type: "number",
        }
    },
    required: ["access_token", "token_type", "userId"]
} as const

type Body = FromSchema<typeof body>
type SuccessResponse = FromSchema<typeof successResponse>

export default async (app: FastifyInstanceWithHooks, options: Options) => {
    const { prisma, cookies } = options


    const getUser = async (username: string) => await prisma.user.findFirst({ where: { username }, include: { auth: true } })
    const authenticateUser = async (username: string, password: string) => {
        const user = await getUser(username)
        return user && await app.verifyPassword(password, user.password) ? user : null
    }
    app.post("/login", {
        schema: {
            description: "Auth Token is needed to authentice for protected endpoints. Use Authorization header with this token.",
            tags: ["user"],
            summary: "Use credentials to receive auth token",
            body,
            response: {
                200: successResponse
            }
        } as FastifySwaggerSchema
    },
        async (request: FastifyRequestWithUser, reply: FastifyReply): Promise<SuccessResponse> => {
            const { username, password } = request.body as Body
            const user = await authenticateUser(username.toLowerCase(), password)
            if (!user) {
                return reply.status(401).send({})
            }
            const access_token = user.auth?.token ? user.auth.token : await app.createAccessToken(user.id)
            reply.setCookie("access_token", access_token, {
                path: "/",
                httpOnly: true,
                secure: cookies.secure,
                sameSite: "none",
                maxAge: 60 * 60 * 24 * 360,
                signed: true
            })

            return { access_token, "token_type": "bearer", "userId": user.id }
        }
    )
}
