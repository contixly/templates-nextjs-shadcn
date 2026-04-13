"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { CommonError } from "@components/errors/common-error";

export const AccountErrorPage = () => {
  const error = useSearchParams().get("error");

  if (!error) return <CommonError />;
  return <CommonError description={error.trim().replaceAll("_", " ")} />;
};
