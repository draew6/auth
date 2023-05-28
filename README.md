import auth from 'auth'
import {prisma} from './client.js'

await app.register(auth, {
  pwaEnabled: false,
  prisma,
  register: {
    schema: {
      body: {
        type: "object",
        properties: {
          name: {
            type: "string"
          }
        },
        required: ["name"]
      }
    }
  },
  resetPassword: {
    mailPass: "string",
    mailFrom: "string",
    projectName: "string",
    projectUrl: "string",
  },
  create: (request) => ({name:request.firstName + request.lastName})
})