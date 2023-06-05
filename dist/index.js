var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import bcrypt from 'bcrypt';
import crypto from "crypto";
import cookie from '@fastify/cookie';
import fastifyPlugin from "fastify-plugin";
import autologin from './autologin.js';
import changePassword from './changePassword.js';
import login from './login.js';
import register from './register.js';
import resetPassword from './resetPassword.js';
import setPassword from './setPassword.js';
import logout from './logout.js';
export default fastifyPlugin((app, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { prisma, cookies } = options;
    app.register(cookie, {
        secret: cookies.secret,
        hook: "onRequest",
        parseOptions: {} // options for parsing cookies
    });
    app.decorate('verifyPassword', (plainPassword, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () { return yield bcrypt.compare(plainPassword, hashedPassword); }));
    app.decorate('getPasswordHash', (password) => __awaiter(void 0, void 0, void 0, function* () { return yield bcrypt.hash(password, 12); }));
    app.decorate('createAccessToken', (userId) => __awaiter(void 0, void 0, void 0, function* () {
        return (yield prisma.auth.create({
            data: {
                token: crypto.randomBytes(20).toString('hex'),
                userId,
                dateCreated: new Date().toISOString()
            }
        })).token;
    }));
    const getCurrentUser = (token) => __awaiter(void 0, void 0, void 0, function* () { var _a; return (_a = (yield prisma.auth.findFirst({ where: { token }, include: { user: true } }))) === null || _a === void 0 ? void 0 : _a.user; });
    const authorize = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        let user;
        if (request.cookies.access_token) {
            const token = request.unsignCookie(request.cookies.access_token).value;
            user = token ? yield getCurrentUser(token.substring(token.indexOf(' ') + 1)) : null;
        }
        if (!user) {
            return reply.status(401).send({});
        }
        request.user = user;
    });
    app.decorate('authorize', authorize);
    app.decorate('authorizeAdmin', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        yield authorize(request, reply);
        if (!((_b = request.user) === null || _b === void 0 ? void 0 : _b.isAdmin)) {
            return reply.status(403).send({});
        }
    }));
    yield app.register(autologin, options);
    yield app.register(changePassword, options);
    yield app.register(login, options);
    yield app.register(register, options);
    yield app.register(resetPassword, options);
    yield app.register(setPassword, options);
    yield app.register(logout, options);
}));
