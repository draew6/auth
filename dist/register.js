var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const isInvalidMail = (val) => !val.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/);
const isInvalidUsername = (val) => (val.length < 3 || val.length > 15 || !val.match("^[a-zA-Z0-9@\\-_.]*$") || !isNaN(Number(val)));
export default (app, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { register, prisma, cookies } = options;
    const body = {
        type: "object",
        required: ["username", "mail", "password", ...register.schema.body.required],
        properties: Object.assign({ username: {
                type: "string",
                minLength: 3,
                maxLength: 15,
                description: "Username which cotains only valid characters and cant be only numerical."
            }, mail: {
                type: "string",
                minLength: 8,
                description: "valid mail"
            }, password: {
                type: "string",
                minLength: 6,
                maxLength: 35,
                description: "Must be 6-35 chars long."
            } }, register.schema.body.properties)
    };
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
    };
    const schema = {
        tags: ["user"],
        summary: "Register New User",
        body,
        response: {
            200: successResponse
        }
    };
    app.post("/register", {
        preHandler: options.register.disabled ? app.authorizeAdmin : () => { },
        schema
    }, (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const body = request.body;
        const mail = body.mail;
        const username = body.username;
        const password = body.password;
        if (isInvalidMail(mail)) {
            return reply.status(409).send({});
        }
        if (isInvalidUsername(username)) {
            return reply.status(409).send({});
        }
        try {
            const user = yield prisma.user.create({
                data: Object.assign({ displayname: username, username: username.toLowerCase(), mail: mail.toLowerCase(), password: yield app.getPasswordHash(password), dateJoined: new Date().toISOString(), isAdmin: false }, register.create(request))
            });
            const token = yield app.createAccessToken(user.id);
            reply.setCookie("access_token", token, {
                path: "/",
                httpOnly: true,
                secure: cookies.secure,
                sameSite: "none",
                maxAge: 60 * 60 * 24 * 360,
                signed: true,
                domain: cookies.domain
            });
            return { token, userId: user.id };
        }
        catch (error) {
            return reply.status(409).send({});
        }
    }));
});
