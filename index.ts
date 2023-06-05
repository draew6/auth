import bcrypt from 'bcrypt'
import crypto from "crypto"
import cookie from '@fastify/cookie'
import fastifyPlugin from "fastify-plugin";

import autologin from './autologin.js'
import changePassword from './changePassword.js'
import login from './login.js'
import register from './register.js'
import resetPassword from './resetPassword.js'
import setPassword from './setPassword.js'
import logout from './logout.js'

import { FastifyInstance, FastifyReply } from "fastify";
import { Options, FastifyRequestWithUser, User } from "./types";


export default fastifyPlugin(async (app: FastifyInstance, options: Options) => {
    const { prisma, cookies } = options

    app.register(cookie, {
        secret: cookies.secret, // for cookies signature
        hook: "onRequest",
        parseOptions: {}     // options for parsing cookies
    })


    app.decorate('verifyPassword', async (plainPassword: string, hashedPassword: string) => await bcrypt.compare(plainPassword, hashedPassword))
    app.decorate('getPasswordHash', async (password: string) => await bcrypt.hash(password, 12))
    app.decorate('createAccessToken', async (userId: number) => (await prisma.auth.create({
        data: {
            token: crypto.randomBytes(20).toString('hex'),
            userId,
            dateCreated: new Date().toISOString()
        }
    })).token)

    const getCurrentUser = async (token: string) => (await prisma.auth.findFirst({ where: { token }, include: { user: true } }))?.user

    const authorize = async (request: FastifyRequestWithUser, reply: FastifyReply) => {
        let user: User | null | undefined
        if (request.cookies.access_token) {
            const token = request.unsignCookie(request.cookies.access_token).value
            user = token ? await getCurrentUser(token.substring(token.indexOf(' ') + 1)) : null
        }
        if (!user) {
            return reply.status(401).send({})
        }
        request.user = user
    }


    app.decorate('authorize', authorize)

    app.decorate('authorizeAdmin', async (request: FastifyRequestWithUser, reply: FastifyReply) => {
        await authorize(request, reply)
        if (!request.user?.isAdmin) {
            return reply.status(403).send({})
        }
    })

    await app.register(autologin as any, options)
    await app.register(changePassword as any, options)
    await app.register(login as any, options)
    await app.register(register as any, options)
    await app.register(resetPassword as any, options)
    await app.register(setPassword as any, options)
    await app.register(logout as any, options)

})