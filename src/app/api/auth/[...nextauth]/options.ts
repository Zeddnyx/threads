import { prisma } from "@/utils/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import type { ISODateString, NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
export interface CustomSession {
  user?: CustomUser;
  expires: ISODateString;
}
export interface CustomUser {
  id?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
}
export const authOptions: NextAuthOptions = {
  // This is a temporary fix for prisma client.
  // @see https://github.com/prisma/prisma/issues/16117
  adapter: PrismaAdapter(prisma) as any,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      
      profile(profile, tokens) {
        return {
          id: profile.sub,
          email: profile.email,
          username: profile.name, // Add username field here
          name: profile.name,
          image: profile.picture,
        }; 
      }
    }),
    CredentialsProvider({
      name: "Sign in",
      id: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
      
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });
      
        if (!user || !(await compare(credentials.password, user.password!))) {
          return null;
        }
      
        return {
          id: user.id,
          email: user.email,
          username: user.username, // Add username field here
          name: user.name,
          role: user.role,
          image: user.image,
          randomKey: "Hey cool",
        };
      },
      
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          image: token.picture,
          id: token.id,
          randomKey: token.randomKey,
          role: token.role,
        },
      };
    },
    jwt: ({ token, user, trigger, session }) => {
      if (trigger === "update" && session?.image) {
        token.picture = session.image;
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      if (user) {
        const u = user as unknown as any;
        return {
          ...token,
          id: u.id,
          picture: u.image,
          randomKey: u.randomKey,
          role: u.role,
        };
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getAuthSession = () => getServerSession(authOptions);
