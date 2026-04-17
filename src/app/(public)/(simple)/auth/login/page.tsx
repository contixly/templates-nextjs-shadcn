import { LoginForm } from "@features/accounts/components/forms/login-form";
import Image from "next/image";
import { getFromCookie } from "@lib/cookies";
import { LAST_LOGIN_METHOD_KEY } from "@lib/environment";
import { buildPageMetadata, SITE_NAME } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";
import routes from "@features/routes";
import Link from "@components/ui/custom/animated-link";
import { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.login);

export default function LoginPage() {
  const getLastLoginPromise = getFromCookie(LAST_LOGIN_METHOD_KEY);

  return (
    <div className="bg-muted flex flex-1 flex-col items-center justify-center gap-6 px-6 md:px-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href={routes.application.pages.home.path()}
          className="flex items-center gap-2 self-center font-medium"
        >
          <Image
            src="/img/branding/web-app-manifest-192x192.png"
            alt={SITE_NAME}
            width={32}
            height={32}
          />
          {SITE_NAME}
        </Link>
        <LoginForm getLastLoginPromise={getLastLoginPromise} />
      </div>
    </div>
  );
}
