import sgMail from '@sendgrid/mail'
import crypto from "crypto"

import { FastifyReply } from "fastify";
import { Options, FastifySwaggerSchema, FastifyRequestWithUser, FastifyInstanceWithHooks, User } from "./types";
import { FromSchema } from "json-schema-to-ts";

const body = {
    type: "object",
    required: ["mail"],
    properties: {
        mail: {
            type: "string",
            description: "Enter Valid Mail."
        }
    }
} as const

type Body = FromSchema<typeof body>

export default async (app: FastifyInstanceWithHooks, options: Options) => {
    const { prisma, resetPassword } = options //resetPassword contains projectName, projectUrl, mailFrom, mailPass.
    sgMail.setApiKey(resetPassword.mailPass)
    app.post("/reset_password", {
        schema: {
            description: "Send Valid Mail and after validation request token is created. Then Mail is sent with reset token in link used for seting password.",
            tags: ["user"],
            summary: "Request Mail for Password Reset",
            body,
        } as FastifySwaggerSchema
    },
        async (request: FastifyRequestWithUser, reply: FastifyReply) => {
            const body = request.body as Body
            const { mail } = body
            const user = await prisma.user.findUnique({
                where: {
                    mail: mail.toLowerCase()
                },
                select: {
                    id: true,
                    mail: true
                }
            }) as User

            if (user) {
                const token = crypto.randomBytes(20).toString('hex')
                await prisma.reset.create({
                    data: {
                        token,
                        userId: user.id,
                        dateCreated: new Date().toISOString()
                    }
                })
                const msg = {
                    to: user.mail, // Change to your recipient
                    from: resetPassword.mailFrom, // Change to your verified sender
                    subject: resetPassword.projectName + ' Password Reset',
                    //text: 'and easy to do anywhere, even with Node.js',
                    html: `
                    <html>
                    <head>
                        <meta charset="UTF-8">
                    </head>
                        <body style="margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif;">
                        <div style="width: 100%; background: #efefef; border-radius: 10px; padding: 10px;">
                          <div style="margin: 0 auto; width: 90%; text-align: center;">
                            <h1 style="background-color: rgba(0, 53, 102, 1); padding: 5px 10px; border-radius: 5px; color: white;">${resetPassword.projectName + ' reset hesla'}</h1>
                            <div style="margin: 30px auto; background: white; width: 40%; border-radius: 10px; padding: 50px; text-align: center;">
                              <h3 style="margin-bottom: 100px; font-size: 24px;">Stlačením tlačítka dole si zresetuješ heslo</h3>
                              <p style="margin-bottom: 30px;">Ak si si nevyžiadal resetovať svoje heslo tak túto spravu ignoruj.</p>
                              <a style="display: block; margin: 0 auto; border: none; background-color: rgba(255, 214, 10, 1); color: white; width: 200px; line-height: 24px; padding: 10px; font-size: 24px; border-radius: 10px; cursor: pointer; text-decoration: none;"
                                href=${resetPassword.projectUrl + '/changepassword/' + token}
                                target="_blank"
                              >
                                Reset
                              </a>
                            </div>
                          </div>
                        </div>
                        </body>
                    </html>
                           `
                }

                sgMail
                    .send(msg)
                    .then((response) => {
                        console.log(response[0].statusCode)
                        console.log(response[0].headers)
                    })
                    .catch((error) => {
                        console.error(error)
                    })
            }
        }
    )
}
