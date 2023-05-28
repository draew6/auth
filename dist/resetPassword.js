var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sgMail from '@sendgrid/mail';
import crypto from "crypto";
const body = {
    type: "object",
    required: ["mail"],
    properties: {
        mail: {
            type: "string",
            description: "Enter Valid Mail."
        }
    }
};
export default (app, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { prisma, resetPassword } = options; //resetPassword contains projectName, projectUrl, mailFrom, mailPass.
    sgMail.setApiKey(resetPassword.mailPass);
    app.post("/reset_password", {
        schema: {
            description: "Send Valid Mail and after validation request token is created. Then Mail is sent with reset token in link used for seting password.",
            tags: ["user"],
            summary: "Request Mail for Password Reset",
            body,
        }
    }, (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const body = request.body;
        const { mail } = body;
        const user = yield prisma.user.findUnique({
            where: {
                mail: mail.toLowerCase()
            },
            select: {
                id: true,
                mail: true
            }
        });
        if (user) {
            const token = crypto.randomBytes(20).toString('hex');
            yield prisma.reset.create({
                data: {
                    token,
                    userId: user.id,
                    dateCreated: new Date().toISOString()
                }
            });
            const msg = {
                to: user.mail,
                from: resetPassword.mailFrom,
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
            };
            sgMail
                .send(msg)
                .then((response) => {
                console.log(response[0].statusCode);
                console.log(response[0].headers);
            })
                .catch((error) => {
                console.error(error);
            });
        }
    }));
});
