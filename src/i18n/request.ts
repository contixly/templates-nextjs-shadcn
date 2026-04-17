import { getRequestConfig } from "next-intl/server";
import { loadI18nMessagesConfig } from "@/src/i18n/messages";

export default getRequestConfig(async () => loadI18nMessagesConfig());
