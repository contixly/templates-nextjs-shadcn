import { GenericOAuthConfig } from "better-auth/plugins";
import { User } from "better-auth";

export type YandexSocialProvider = "yandex";

const GenericOAuthConfigDefault: Partial<GenericOAuthConfig> = {
  authorizationUrl: "https://oauth.yandex.ru/authorize",
  tokenUrl: "https://oauth.yandex.ru/token",
  userInfoUrl: "https://login.yandex.ru/info",
};

export const YandexOAuth2ClientConfig: GenericOAuthConfig = {
  providerId: "yandex",
  clientId: process.env.YANDEX_CLIENT_ID as string,
  clientSecret: process.env.YANDEX_CLIENT_SECRET as string,
  ...GenericOAuthConfigDefault,
  scopes: ["login:email", "login:info", "login:avatar"],
  requireIssuerValidation: true,
  getUserInfo: async (token) => {
    const response = await fetch(GenericOAuthConfigDefault.userInfoUrl as string, {
      headers: {
        Authorization: `OAuth ${token.accessToken}`,
      },
    });
    return response.json();
  },
  mapProfileToUser: (profile) =>
    ({
      id: profile.id,
      name: profile.display_name,
      emailVerified: true,
      email: profile.default_email,
    }) as User,
};
