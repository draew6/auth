var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
};
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
};
export default (app, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { prisma, cookies } = options;
    const getUser = (username) => __awaiter(void 0, void 0, void 0, function* () { return yield prisma.user.findFirst({ where: { username }, include: { auth: true } }); });
    const authenticateUser = (username, password) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield getUser(username);
        return user && (yield app.verifyPassword(password, user.password)) ? user : null;
    });
    app.post("/login", {
        schema: {
            description: "Auth Token is needed to authentice for protected endpoints. Use Authorization header with this token.",
            tags: ["user"],
            summary: "Use credentials to receive auth token",
            body,
            response: {
                200: successResponse
            }
        }
    }, (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { username, password } = request.body;
        const user = yield authenticateUser(username.toLowerCase(), password);
        if (!user) {
            return reply.status(401).send({});
        }
        const access_token = ((_a = user.auth) === null || _a === void 0 ? void 0 : _a.token) ? user.auth.token : yield app.createAccessToken(user.id);
        reply.setCookie("access_token", access_token, {
            path: "/",
            httpOnly: true,
            secure: cookies.secure,
            sameSite: "none",
            maxAge: 60 * 60 * 24 * 360,
            signed: true,
            domain: cookies.domain
        });
        return { access_token, "token_type": "bearer", "userId": user.id };
    }));
});
