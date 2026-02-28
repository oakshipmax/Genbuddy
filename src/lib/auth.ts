import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";
import LINE from "next-auth/providers/line";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // 本部ログイン：Amazon Cognito（メール/パスワード）
    Cognito({
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "",
      clientSecret: process.env.COGNITO_CLIENT_SECRET ?? "",
      issuer: process.env.COGNITO_ISSUER ?? "",
    }),
    // 便利屋・エンドユーザーログイン：LINE
    LINE({
      clientId: process.env.LINE_CHANNEL_ID ?? "",
      clientSecret: process.env.LINE_CHANNEL_SECRET ?? "",
    }),
  ],

  callbacks: {
    // JWTにロールを追加
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // DBからユーザー情報を取得してロールをトークンに埋め込む
        let user = null;

        if (account.provider === "cognito") {
          user = await prisma.user.findUnique({
            where: { cognitoId: token.sub },
          });
          if (!user) {
            // 初回ログイン時はHEADQUARTERSとして登録
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
            // 初回ログイン時はHANDYMANとして登録（後で変更可能）
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

    // セッションにロールを追加
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
});
