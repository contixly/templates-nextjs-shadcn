import { ImageResponse } from "next/og";
import { size } from "@/src/app/opengraph-image";
import { cache } from "react";
import { Metadata } from "next";
import { GlobalMetadata } from "@lib/metadata";

const categoryColor = "#2563eb";

export const buildMetadataOGImage = cache(async (metadata: Metadata, categoryName?: string) => {
  const title = metadata.title as string;
  const description = metadata.description as string;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        padding: "40px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          paddingBottom: "32px",
          borderBottom: "1.5px dashed #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 24px",
            borderRadius: "24px",
            border: `1.5px solid ${categoryColor}`,
            backgroundColor: `${categoryColor}15`,
          }}
        >
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: categoryColor,
            }}
          />
          <span
            style={{
              fontSize: "26px",
              fontWeight: "600",
              color: categoryColor,
            }}
          >
            {categoryName?.toUpperCase() ?? "TEMPLATE"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px", color: "#64748b", fontWeight: "500" }}>
            Build on a neutral foundation
          </span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        <h1
          style={{
            fontSize: "60px",
            fontWeight: "900",
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-0.05em",
            color: "#0f172a",
            wordBreak: "break-word",
            maxHeight: "4em",
          }}
        >
          {title || "A template for your next service"}
        </h1>
        <p
          style={{
            fontSize: "36px",
            color: "#64748b",
            marginTop: "20px",
            lineHeight: 1.4,
            maxWidth: "1200px",
          }}
        >
          {description ||
            "A neutral starting point with authentication, shared UI, and reusable application patterns."}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
          paddingTop: "48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span
            style={{
              fontSize: "36px",
              fontWeight: "900",
              color: "#2563eb",
            }}
          >
            {GlobalMetadata.applicationName}
          </span>
          <span style={{ fontSize: "36px", color: "#64748b", fontWeight: "400" }}>Template</span>
        </div>
        <div
          style={{
            fontSize: "26px",
            color: "#94a3b8",
            fontWeight: "500",
          }}
        >
          example.com
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
});
