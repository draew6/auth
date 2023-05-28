var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default (app, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { prisma } = options;
    app.delete("/logout", {
        preHandler: app.authorize,
        schema: {
            description: "Destroy Auth Token, so its no valid anymore and every device has to login again to get new one.",
            tags: ["user"],
            summary: "Destroys Auth Token",
            security: [{ oauth: [] }]
        },
    }, (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const user = request.user;
        yield prisma.auth.deleteMany({ where: { userId: user.id } });
    }));
});
