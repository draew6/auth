var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
};
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
};
export default (app, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { pwaEnabled, prisma, cookies } = options;
    app.post("/autologin", {
        preHandler: pwaEnabled ? app.optionalAuthorize : app.authorize,
        schema: Object.assign(Object.assign({ summary: "Verify Auth Token" + (pwaEnabled ? "and " + pwaNotificationsSchema.summary : ""), description: "Send auth token in Authorization header to verify if its valid and get username and userid. " +
                (pwaEnabled ? pwaNotificationsSchema.description : ""), tags: ["user"], security: [{ oauth: [] }] }, (pwaEnabled ? { body: pwaNotificationsSchema.body } : {})), { response: {
                200: successResponse
            } }),
    }, (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        let user = request.user;
        let token = request.authToken;
        let foundDevice;
        if (!user && pwaEnabled) {
            const { endpoint, p256dh, auth } = request.body;
            if (endpoint && p256dh && auth && endpoint.includes("apple")) {
                foundDevice = yield prisma.device.findFirst({
                    where: {
                        endpoint,
                        p256dh,
                        auth
                    },
                    include: {
                        user: {
                            include: {
                                auth: true
                            }
                        }
                    }
                });
                if (foundDevice) {
                    user = foundDevice.user;
                    token = (_b = (_a = foundDevice.user) === null || _a === void 0 ? void 0 : _a.auth) === null || _b === void 0 ? void 0 : _b.token;
                }
                else {
                    return reply.status(401).send({});
                }
            }
        }
        if (token) {
            reply.setCookie("access_token", token, {
                path: "/",
                httpOnly: true,
                secure: cookies.secure,
                sameSite: "none",
                maxAge: 60 * 60 * 24 * 360,
                signed: true,
                domain: cookies.domain
            });
        }
        if (pwaEnabled && !foundDevice) {
            const { endpoint, p256dh, auth } = request.body;
            const device = yield prisma.device.findFirst({
                where: {
                    endpoint
                }
            });
            try {
                if (!device) {
                    yield prisma.device.create({
                        data: {
                            endpoint,
                            p256dh,
                            auth,
                            userId: user.id
                        }
                    });
                }
            }
            catch (err) {
                console.log(err);
                console.log("NOT SUBSCRIBED");
            }
        }
        return { user: user.displayname, id: user.id };
    }));
});
