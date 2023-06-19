import { FastifyReply } from "fastify"
import { Options, FastifyInstanceWithHooks, FastifySwaggerSchema, FastifyRequestWithUser, User } from "./types"
import { FromSchema } from "json-schema-to-ts";


const isInvalidMail = (val: string) => !val.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/)
const isInvalidUsername = (val: string) => (val.length < 3 || val.length > 15 || !val.match("^[a-zA-Z0-9@\\-_.]*$") || !isNaN(Number(val)))



export default async (app: FastifyInstanceWithHooks, options: Options) => {
    const { register, prisma, cookies } = options

    const body = {
        type: "object",
        required: ["username", "mail", "password", ...register.schema.body.required],
        properties: {
            username: {
                type: "string",
                minLength: 3,
                maxLength: 15,
                description: "Username which cotains only valid characters and cant be only numerical."
            },
            mail: {
                type: "string",
                minLength: 8,
                description: "valid mail"
            },
            password: {
                type: "string",
                minLength: 6,
                maxLength: 35,
                description: "Must be 6-35 chars long."
            },
            ...register.schema.body.properties
        }
    } as const

    const successResponse = {
        description: "User Registered.",
        type: "object",
        properties: {
            token: {
                type: "string",
                description: "Access Token."
            },
            userId: {
                type: "number",
                description: "User Id."
            }
        },
        required: ["token", "userId"]
    } as const


    type Body = FromSchema<typeof body>
    type SuccessResponse = FromSchema<typeof successResponse>

    const schema = {
        tags: ["user"],
        summary: "Register New User",
        body,
        response: {
            200: successResponse
        }
    } as FastifySwaggerSchema

    app.post("/register", {
        preHandler: options.register.disabled ? app.authorizeAdmin : () => { },
        schema
    },
        async (request: FastifyRequestWithUser, reply: FastifyReply): Promise<SuccessResponse> => {
            const body = request.body as Body
            const mail = body.mail as string
            const username = body.username as string
            const password = body.password as string
            if (isInvalidMail(mail)) {
                return reply.status(409).send({})
            }
            if (isInvalidUsername(username)) {
                return reply.status(409).send({})
            }
            try {
                const user = await prisma.user.create({
                    data: {
                        displayname: username,
                        username: username.toLowerCase(),
                        mail: mail.toLowerCase(),
                        password: await app.getPasswordHash(password),
                        dateJoined: new Date().toISOString(),
                        isAdmin: false,
                        ...register.create(request)
                    } as any
                }) as any
                const token = await app.createAccessToken(user.id)
                if (!options.register.disabled) {
                    reply.setCookie("access_token", token, {
                        path: "/",
                        httpOnly: true,
                        secure: cookies.secure,
                        sameSite: "none",
                        maxAge: 60 * 60 * 24 * 360,
                        signed: true,
                        domain: cookies.domain
                    })
                }
                return { token, userId: user.id }
            }
            catch (error) {
                return reply.status(409).send({})
            }
        }
    )
}
