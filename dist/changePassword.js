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
};
export default (app, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { prisma } = options;
    app.post("/change_password", {
        preHandler: app.authorize,
        schema: {
            description: "Enter Old Password and if its valid then users password is updated to new_password parameter.",
            tags: ["user"],
            summary: "Change Password",
            body,
            security: [{ oauth: [] }]
        }
    }, (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const user = request.user;
        const { oldPassword, newPassword } = request.body;
        if (yield app.verifyPassword(oldPassword, user.password)) {
            yield prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    password: yield app.getPasswordHash(newPassword)
                }
            });
            yield prisma.reset.deleteMany({ where: { userId: user.id } });
        }
        else {
            reply.status(409).send({});
        }
    }));
});
