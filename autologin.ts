import { FastifyReply } from "fastify";
import { Options, FastifyInstanceWithHooks, FastifyRequestWithUser, FastifySwaggerSchema, User } from "./types";
import { FromSchema } from "json-schema-to-ts";


const pwaNotificationsSchema = {
    summary: "Subscribe to Notifications",
    description: "Send subscription object in body for PWA in accepted form.",
    body: {
        type: "object",
        required: ["endpoint", "p256dh", "auth"],
        properties: {
            endpoint: {
                type: "string",
                description: "URL"
            },
            p256dh: {
                type: "string",
                description: "One of the keys in subscription object"
            },
            auth: {
                type: "string",
                description: "One of the keys in subscription object"
            }
        }
    }
} as const

const successResponse = {
    type: "object",
    properties: {
        user: {
            type: "string",
            description: "Username"
        },
        id: {
            type: "number",
            description: "User ID"
        }
    },
    required: ["user", "id"]
} as const

type Body = FromSchema<typeof pwaNotificationsSchema.body>
type SuccessResponse = FromSchema<typeof successResponse>

export default async (app: FastifyInstanceWithHooks, options: Options) => {
    const { pwaEnabled, prisma, cookies } = options
    app.post("/autologin", {
        preHandler: app.authorize,
        schema: {
            summary: "Verify Auth Token" + (pwaEnabled ? "and " + pwaNotificationsSchema.summary : ""),
            description: "Send auth token in Authorization header to verify if its valid and get username and userid. " +
                (pwaEnabled ? pwaNotificationsSchema.description : ""),
            tags: ["user"],
            security: [{ oauth: [] }],
            ...(pwaEnabled ? { body: pwaNotificationsSchema.body } : {}),
            response: {
                200: successResponse
            }
        } as FastifySwaggerSchema,
    },
        async (request: FastifyRequestWithUser, reply: FastifyReply): Promise<SuccessResponse> => {
            const user = request.user as User
            if (request.authToken) {
                reply.setCookie("access_token", request.authToken, {
                    path: "/",
                    httpOnly: true,
                    secure: cookies.secure,
                    sameSite: "none",
                    maxAge: 60 * 60 * 24 * 360,
                    signed: true,
                    domain: cookies.domain
                })
            }

            if (pwaEnabled) {
                const { endpoint, p256dh, auth } = request.body as Body
                const device = await prisma.device.findFirst({
                    where: {
                        endpoint
                    }
                }
                )
                try {
                    if (!device) {
                        await prisma.device.create({
                            data: {
                                endpoint,
                                p256dh,
                                auth,
                                userId: user.id
                            }
                        })
                    }
                }
                catch (err) {
                    console.log(err)
                    console.log("NOT SUBSCRIBED")
                }
            }
            return { user: user.displayname, id: user.id }
        })
}
