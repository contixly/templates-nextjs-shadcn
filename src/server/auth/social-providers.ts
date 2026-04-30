import "server-only";

import { SocialProvider, socialsProviders } from "@typings/auth";

type SocialProviderEnvironment = Partial<Record<string, string | undefined>>;

const socialProviderEnvKeys: Partial<Record<SocialProvider["id"], readonly string[]>> = {
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  github: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
  gitlab: ["GITLAB_CLIENT_ID", "GITLAB_CLIENT_SECRET"],
  vk: ["VK_CLIENT_ID"],
  yandex: ["YANDEX_CLIENT_ID", "YANDEX_CLIENT_SECRET"],
};

const isEnvValueConfigured = (value: string | undefined) => Boolean(value?.trim());

export const getConfiguredSocialProviders = (
  env: SocialProviderEnvironment = process.env
): SocialProvider[] =>
  socialsProviders.filter((provider) =>
    socialProviderEnvKeys[provider.id]?.every((key) => isEnvValueConfigured(env[key]))
  );

export const getConfiguredSocialProviderIds = (
  env: SocialProviderEnvironment = process.env
): SocialProvider["id"][] => getConfiguredSocialProviders(env).map((provider) => provider.id);
