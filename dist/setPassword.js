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
};
export default (app, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { prisma } = options;
    app.post("/set_password", {
        schema: {
            description: "Set New Password after resseting password. Reset token is verified. Password is changed and Reset Token destroyed.",
            tags: ["user"],
            summary: "Send valid Reset Token and Set New Password after.",
            body
        }
    }, (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const body = request.body;
        const { token, password } = body;
        const resetToken = yield prisma.reset.findUnique({
            where: {
                token
            }
        });
        if (!resetToken) {
            return reply.status(404).send({});
        }
        const { userId } = resetToken;
        const hashedPassword = yield app.getPasswordHash(password);
        yield prisma.user.update({
            where: {
                id: userId
            },
            data: {
                password: hashedPassword
            }
        });
        yield prisma.reset.deleteMany({
            where: {
                userId
            }
        });
    }));
});
