import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import LINE from "next-auth/providers/line";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import authConfig from "./auth.config";

// キーが設定済みのプロバイダーのみ追加（未設定時はスキップ）
const providers: Provider[] = [];

// 本部：Credentials + Cognito USER_PASSWORD_AUTH（カスタムフォーム用）
// ※ Cognitoアプリクライアントで ALLOW_USER_PASSWORD_AUTH を有効化すること
if (
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID &&
  process.env.COGNITO_CLIENT_SECRET &&
  process.env.NEXT_PUBLIC_AWS_REGION
) {
  providers.push(
    Credentials({
      id: "cognito",
      name: "本部スタッフ",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
        const clientSecret = process.env.COGNITO_CLIENT_SECRET!;
        const region = process.env.NEXT_PUBLIC_AWS_REGION!;
        const email = credentials.email as string;
        const password = credentials.password as string;

        // SECRET_HASH を計算（Web Crypto API 使用 → Edge/Node.js 両対応）
        const encoder = new TextEncoder();
        const key = await globalThis.crypto.subtle.importKey(
          "raw",
          encoder.encode(clientSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signature = await globalThis.crypto.subtle.sign(
          "HMAC",
          key,
          encoder.encode(email + clientId)
        );
        const secretHash = btoa(
          Array.from(new Uint8Array(signature))
            .map((b) => String.fromCharCode(b))
            .join("")
        );

        try {
          // Cognito InitiateAuth（USER_PASSWORD_AUTH フロー）
          const authRes = await fetch(
            `https://cognito-idp.${region}.amazonaws.com/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-amz-json-1.1",
                "X-Amz-Target":
                  "AmazonCognitoIdentityProviderService.InitiateAuth",
              },
              body: JSON.stringify({
                AuthFlow: "USER_PASSWORD_AUTH",
                ClientId: clientId,
                AuthParameters: {
                  USERNAME: email,
                  PASSWORD: password,
                  SECRET_HASH: secretHash,
                },
              }),
            }
          );

          if (!authRes.ok) {
            const err = await authRes.json().catch(() => ({}));
            console.error("[Cognito] AuthFailed:", err);
            return null;
          }

          const authData = await authRes.json();
          const accessToken = authData.AuthenticationResult?.AccessToken;
          if (!accessToken) return null;

          // GetUser でユーザー属性を取得
          const userRes = await fetch(
            `https://cognito-idp.${region}.amazonaws.com/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-amz-json-1.1",
                "X-Amz-Target":
                  "AmazonCognitoIdentityProviderService.GetUser",
              },
              body: JSON.stringify({ AccessToken: accessToken }),
            }
          );

          if (!userRes.ok) return null;

          const userData = await userRes.json();
          const attrs = userData.UserAttributes as {
            Name: string;
            Value: string;
          }[];

          const sub = attrs.find((a) => a.Name === "sub")?.Value;
          const userEmail = attrs.find((a) => a.Name === "email")?.Value;
          const name = attrs.find((a) => a.Name === "name")?.Value;

          if (!sub) return null;

          return {
            id: sub,
            email: userEmail ?? email,
            name: name ?? "本部スタッフ",
          };
        } catch (error) {
          console.error("[Cognito] Error:", error);
          return null;
        }
      },
    })
  );
}

// 便利屋：LINEログイン
if (process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET) {
  providers.push(
    LINE({
      clientId: process.env.LINE_CHANNEL_ID,
      clientSecret: process.env.LINE_CHANNEL_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Edge互換の基本設定（trustHost, pages, session strategy）を継承
  ...authConfig,

  // サインイン時に使うフルプロバイダー（authorize()含む）で上書き
  providers,

  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        let dbUser = null;

        if (account.provider === "cognito") {
          // user.id = Cognito sub（authorize()で返したid）
          const cognitoId = (user?.id as string) ?? token.sub;
          dbUser = await prisma.user.findUnique({
            where: { cognitoId },
          });
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                cognitoId: cognitoId!,
                email: (user?.email as string) ?? (token.email as string),
                name: (user?.name as string) ?? "本部スタッフ",
                role: "HEADQUARTERS",
              },
            });
          }
        }

        if (account.provider === "line") {
          dbUser = await prisma.user.findUnique({
            where: { lineUserId: token.sub },
          });
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                lineUserId: token.sub!,
                name: (token.name as string) ?? "便利屋ユーザー",
                role: "HANDYMAN",
              },
            });
          }
        }

        if (dbUser) {
          token.role = dbUser.role;
          token.dbId = dbUser.id;
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

  secret: process.env.AUTH_SECRET,
});
