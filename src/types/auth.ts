import { SocialProviderList } from "better-auth";
import {
  Icon,
  IconBrandGithub,
  IconBrandGitlab,
  IconBrandGoogle,
  IconBrandVk,
  IconBrandYandex,
} from "@tabler/icons-react";
import type { YandexSocialProvider } from "@server/auth/yandex-oauth2-client";

type CustomSocialProvider = YandexSocialProvider;
export type SocialProviderType = "default" | "oauth2";

export type SocialProvider = {
  id: SocialProviderList[number] | CustomSocialProvider;
  name: string;
  icon: Icon;
  type: SocialProviderType;
};

export const socialsProviders: SocialProvider[] = [
  { id: "google", name: "Google", icon: IconBrandGoogle, type: "default" },
  { id: "github", name: "GitHub", icon: IconBrandGithub, type: "default" },
  { id: "gitlab", name: "GitLab", icon: IconBrandGitlab, type: "default" },
  { id: "vk", name: "VK", icon: IconBrandVk, type: "default" },
  { id: "yandex", name: "Yandex", icon: IconBrandYandex, type: "oauth2" },
] as const;

export const getSocialProvidersByIds = (ids: readonly string[]): SocialProvider[] => {
  const enabledProviderIds = new Set(ids);

  return socialsProviders.filter((provider) => enabledProviderIds.has(provider.id));
};
