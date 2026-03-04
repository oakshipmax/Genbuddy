import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import LINE from "next-auth/providers/line";
import { createHmac } from "crypto"; // Node.js組み込み（authorize()はNode.jsのみで実行）
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import authConfig from "./auth.config";

/**
 * AmplifyのAUTH_URL環境変数がlocalhostのままの場合のフォールバック。
 * Auth.jsはAUTH_URLをリダイレクトURL構築に使うため、
 * localhostのままだとエラー時に localhost:3000/login?error=... へリダイレクトされる。
 *
 * 【安全な理由】
 * クッキー名は auth.config.ts で明示設定済み（NODE_ENVに依存）。
 * AUTH_URLの値はクッキー名に影響しないため、このオーバーライドは安全。
 * Edge runtime（ミドルウェア）ではこのコードは実行されないが、
 * ミドルウェアはクッキー名を明示設定で読むため問題なし。
 *
 * 【恒久対処】AmplifyコンソールでAUTH_URLを削除または正しいURLに変更する。
 */
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_APP_URL &&
  (!process.env.AUTH_URL || process.env.AUTH_URL.includes("localhost"))
) {
  process.env.AUTH_URL = process.env.NEXT_PUBLIC_APP_URL;
}

// キーが設定済みのプロバイダーのみ追加（未設定時はスキップ）
const providers: Provider[] = [];

// 本部：Credentials + Cognito USER_PASSWORD_AUTH（カスタムフォーム用）
// ※ Cognitoアプリクライアントで ALLOW_USER_PASSWORD_AUTH を有効化すること
const cognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
const cognitoClientSecret = process.env.COGNITO_CLIENT_SECRET?.trim();
const cognitoRegion = process.env.NEXT_PUBLIC_AWS_REGION?.trim();

console.log("[Auth] Cognito env check:", {
  hasClientId: !!cognitoClientId,
  hasClientSecret: !!cognitoClientSecret,
  hasRegion: !!cognitoRegion,
  region: cognitoRegion ?? "not set",
});

if (cognitoClientId && cognitoClientSecret && cognitoRegion) {
  providers.push(
    Credentials({
      id: "cognito",
      name: "本部スタッフ",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;

        console.log("[Cognito authorize] called. email:", email ? "set" : "empty");

        if (!email || !password) {
          console.warn("[Cognito authorize] Missing email or password");
          return null;
        }

        try {
          // SECRET_HASH を計算（Node.js crypto モジュール使用）
          // authorize() は Node.js ランタイムでのみ実行されるため安全
          const secretHash = createHmac("SHA256", cognitoClientSecret)
            .update(email + cognitoClientId)
            .digest("base64");

          console.log("[Cognito authorize] SECRET_HASH calculated. Calling InitiateAuth...");

          // Cognito InitiateAuth（USER_PASSWORD_AUTH フロー）
          const authRes = await fetch(
            `https://cognito-idp.${cognitoRegion}.amazonaws.com/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-amz-json-1.1",
                "X-Amz-Target":
                  "AmazonCognitoIdentityProviderService.InitiateAuth",
              },
              body: JSON.stringify({
                AuthFlow: "USER_PASSWORD_AUTH",
                ClientId: cognitoClientId,
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
            console.error("[Cognito authorize] InitiateAuth failed. Status:", authRes.status, "Error:", JSON.stringify(err));
            return null;
          }

          const authData = await authRes.json();
          const accessToken = authData.AuthenticationResult?.AccessToken;
          if (!accessToken) {
            console.error("[Cognito authorize] No AccessToken in response");
            return null;
          }

          console.log("[Cognito authorize] InitiateAuth success. Calling GetUser...");

          // GetUser でユーザー属性を取得
          const userRes = await fetch(
            `https://cognito-idp.${cognitoRegion}.amazonaws.com/`,
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

          if (!userRes.ok) {
            console.error("[Cognito authorize] GetUser failed. Status:", userRes.status);
            return null;
          }

          const userData = await userRes.json();
          const attrs = userData.UserAttributes as {
            Name: string;
            Value: string;
          }[];

          const sub = attrs.find((a) => a.Name === "sub")?.Value;
          const userEmail = attrs.find((a) => a.Name === "email")?.Value;
          const name = attrs.find((a) => a.Name === "name")?.Value;

          if (!sub) {
            console.error("[Cognito authorize] No 'sub' in UserAttributes");
            return null;
          }

          console.log("[Cognito authorize] Success. sub:", sub);
          return {
            id: sub,
            email: userEmail ?? email,
            name: name ?? "本部スタッフ",
          };
        } catch (error) {
          console.error("[Cognito authorize] Unexpected error:", error);
          return null;
        }
      },
    })
  );
} else {
  console.error("[Auth] Cognito provider NOT registered. Missing env vars.");
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
