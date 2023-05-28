import { PrismaClient } from '@prisma/client'
import { FastifyRequest, FastifyInstance } from 'fastify'
import { FastifySchema } from "fastify"

export type Options = {
  pwaEnabled: boolean,         // Optional. Indicates whether PWA (Progressive Web App) is enabled or not.
  prisma: PrismaClient,        // Required. An instance of the PrismaClient.
  register: {
    schema: {
      body: {
        type: "object",
        required: string[],
        properties: {
          [key: string]: {
          }
        }
      },    // Required. Specifies the schema for the register route.
    },
    create: (request: FastifyRequest) => {}
  },
  resetPassword: {
    mailPass: string        // Required. Specifies the password for the email account to use for sending reset password emails.
    mailFrom: string,        // Required. Specifies the email address to use as the sender for reset password emails.
    projectName: string,     // Required. Specifies the name of the project.
    projectUrl: string,      // Required. Specifies the URL of the project.
  },
  cookies: {
    secure: boolean,          // Optional. Specifies whether cookies should be set with the secure flag.
    secret: string,           // Required. Specifies the secret to use for signing cookies.
  },
  authEnabled: boolean,       // Optional. Indicates whether authentication is enabled or not.
}

export type FastifyRequestWithUser = FastifyRequest & {
  user?: User
}

export interface FastifyInstanceWithHooks extends FastifyInstance {
  verifyPassword: (oldPassword: string, user: string) => boolean,
  getPasswordHash: (newPassword: string) => string,
  authorize: () => void,
  authorizeAdmin: () => void,
  createAccessToken: (userId: number) => string,
}

export type FastifySwaggerSchema = FastifySchema

export type User = {
  id: number
  displayname: string
  username: string
  mail: string
  password: string
  dateJoined: Date | null
  isAdmin: boolean
  isTester: boolean
}