"use client";

import common from "@messages/common.json";
import React from "react";
import { ErrorComponent } from "@components/errors/error-component";

export default function GlobalErrorPage({ error }: { error: Error & { digest?: string } }) {
  return (
    <ErrorComponent
      title={common.errors.globalError.title}
      subTitle={common.errors.globalError.subTitle}
      description={common.errors.globalError.description}
      error={error}
    />
  );
}
