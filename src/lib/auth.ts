import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";
import LINE from "next-auth/providers/line";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

// キーが設定済みのプロバイダーのみ追加（未設定時はスキップ）
const providers = [];

if (
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID &&
  process.env.COGNITO_CLIENT_SECRET &&
  process.env.COGNITO_ISSUER
) {
  providers.push(
    Cognito({
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      clientSecret: process.env.COGNITO_CLIENT_SECRET,
      issuer: process.env.COGNITO_ISSUER,
    })
  );
}

if (process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET) {
  providers.push(
    LINE({
      clientId: process.env.LINE_CHANNEL_ID,
      clientSecret: process.env.LINE_CHANNEL_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,

  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        let user = null;

        if (account.provider === "cognito") {
          user = await prisma.user.findUnique({
            where: { cognitoId: token.sub },
          });
          if (!user) {
            user = await prisma.user.create({
              data: {
                cognitoId: token.sub!,
                email: token.email as string,
                name: (token.name as string) ?? "本部スタッフ",
                role: "HEADQUARTERS",
              },
            });
          }
        }

        if (account.provider === "line") {
          user = await prisma.user.findUnique({
            where: { lineUserId: token.sub },
          });
          if (!user) {
            user = await prisma.user.create({
              data: {
                lineUserId: token.sub!,
                name: (token.name as string) ?? "便利屋ユーザー",
                role: "HANDYMAN",
              },
            });
          }
        }

        if (user) {
          token.role = user.role;
          token.dbId = user.id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as Role;
        session.user.dbId = token.dbId as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.AUTH_SECRET,
});
