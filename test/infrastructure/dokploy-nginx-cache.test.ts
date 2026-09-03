/** @jest-environment node */

import { existsSync, readFileSync } from "node:fs";

const dockerfilePath = "infra/dokploy/nginx/Dockerfile";
const configPath = "infra/dokploy/nginx/nginx.conf";

function readRequiredFile(path: string): string {
  expect(existsSync(path)).toBe(true);
  return readFileSync(path, "utf8");
}

function cachedLocationDeclarations(config: string): string[] {
  const locations = [...config.matchAll(/^\s*(location\s+[^\r\n{]+)\s*\{/gmu)];

  return locations
    .filter((location, index) => {
      const start = location.index ?? 0;
      const end = locations[index + 1]?.index ?? config.length;
      return config.slice(start, end).includes("proxy_cache public_pages;");
    })
    .map((location) => location[1].trim());
}

function locationBlock(config: string, declaration: string, nextDeclaration?: string): string {
  const start = config.indexOf(`${declaration} {`);
  const end = nextDeclaration
    ? config.indexOf(`${nextDeclaration} {`, start + declaration.length)
    : config.length;

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return config.slice(start, end);
}

test("builds a pinned official Nginx edge image and validates its configuration", () => {
  const dockerfile = readRequiredFile(dockerfilePath);

  expect(dockerfile).toContain(
    "nginx:1.30.4-alpine@sha256:97d490c12ba55b4946b01546d1c3ed324e8d41ab1c9fcb2a616aa470620e5b46"
  );
  expect(dockerfile).toContain("COPY infra/dokploy/nginx/nginx.conf /etc/nginx/nginx.conf");
  expect(dockerfile).toMatch(/^RUN nginx -t$/mu);
  expect(dockerfile).toMatch(/^EXPOSE 8080$/mu);
  expect(dockerfile).toMatch(/^STOPSIGNAL SIGQUIT$/mu);
  expect(dockerfile).toContain('CMD ["nginx", "-g", "daemon off;"]');
});

test("uses one worker, bounded independent storage, and dynamic Docker DNS", () => {
  const config = readRequiredFile(configPath);

  expect(config).toMatch(/^worker_processes 1;$/mu);
  expect(config).toContain("resolver 127.0.0.11 valid=10s ipv6=off;");
  expect(config).toContain("keys_zone=public_pages:16m");
  expect(config).toContain("max_size=512m");
  expect(config).toContain('set $web_upstream "http://web:3000";');
  expect(config).toContain("proxy_pass $web_upstream;");
  expect(config).not.toMatch(/upstream\s+web\s*\{/u);
  expect(config).not.toContain("proxy_cache_use_stale");
});

test("caches only public documentation HTML and immutable Next.js assets", () => {
  const config = readRequiredFile(configPath);
  const cachedLocations = cachedLocationDeclarations(config);

  expect(cachedLocations).toEqual([
    "location = /docs",
    "location ~ ^/docs/(.+)$",
    "location ^~ /_next/static/",
  ]);

  const docs = locationBlock(config, "location = /docs", "location ~ ^/docs/(.+)$");
  const nestedDocs = locationBlock(config, "location ~ ^/docs/(.+)$", "location ^~ /_next/static/");

  for (const block of [docs, nestedDocs]) {
    expect(block).toContain('proxy_cache_key "$forwarded_proto|$host|$uri";');
    expect(block).toContain("proxy_cache_valid 200 60m;");
    expect(block).toContain("proxy_cache_lock on;");
    expect(block).toContain("proxy_cache_bypass $skip_request_cache;");
    expect(block).toContain("proxy_no_cache $skip_request_cache;");
    expect(block).toContain("proxy_no_cache $skip_private_response;");
    expect(block).toContain("proxy_no_cache $upstream_http_set_cookie;");
    expect(block).toContain("proxy_ignore_headers Cache-Control Expires;");
    expect(block).toContain("proxy_hide_header Cache-Control;");
    expect(block).toContain("proxy_hide_header Expires;");
    expect(block).toContain("add_header Cache-Control $public_document_cache_control always;");
  }
});

test("bypasses request and response variants that are unsafe for a pathname-only cache key", () => {
  const config = readRequiredFile(configPath);

  expect(config).toMatch(/map \$request_method \$skip_method/u);
  expect(config).toMatch(/map \$http_authorization \$skip_authorization/u);
  expect(config).toMatch(/map \$http_rsc \$skip_rsc/u);
  expect(config).toMatch(/map \$http_next_router_state_tree \$skip_router_state/u);
  expect(config).toMatch(/map \$http_next_router_prefetch \$skip_router_prefetch/u);
  expect(config).toMatch(/map \$http_next_router_segment_prefetch \$skip_router_segment_prefetch/u);
  expect(config).toMatch(/map \$http_next_action \$skip_next_action/u);
  expect(config).toMatch(/map "\$http_purpose\|\$http_sec_purpose" \$skip_prefetch/u);
  expect(config).toMatch(/map \$uri \$skip_next_data_path/u);
  expect(config).toMatch(/\\\.rsc/u);
  expect(config).toMatch(/\\\.segment\\\.rsc/u);
  expect(config).toMatch(
    /map "\$upstream_http_cache_control\|\$upstream_http_vary" \$skip_private_response/u
  );
  expect(config).toMatch(/map \$upstream_http_set_cookie \$upstream_sets_cookie/u);
  expect(config).toMatch(
    /map "\$upstream_cache_status:\$upstream_status:\$skip_private_response:\$upstream_sets_cookie" \$public_document_cache_control/u
  );
  expect(config).toMatch(/private\|no-cache\|no-store/u);
  expect(config).toMatch(/\\\|\\s\*\\\*/u);
  expect(config).toContain('default "private, no-store";');
  expect(config).toContain('~^(MISS|EXPIRED):200:0:0$ "public, max-age=0, s-maxage=3600";');
});

test("keeps generated documentation images and every non-allowlisted route proxy-only", () => {
  const config = readRequiredFile(configPath);
  const docsOg = locationBlock(config, "location ^~ /docs/og/", "location = /docs/opengraph-image");
  const openGraph = locationBlock(
    config,
    "location = /docs/opengraph-image",
    "location = /docs/twitter-image"
  );
  const twitter = locationBlock(config, "location = /docs/twitter-image", "location = /docs");
  const fallback = config.slice(config.lastIndexOf("location / {"));

  for (const block of [docsOg, openGraph, twitter, fallback]) {
    expect(block).toContain("proxy_pass $web_upstream;");
    expect(block).not.toContain("proxy_cache public_pages;");
    expect(block).toContain("add_header X-Edge-Cache BYPASS always;");
  }

  expect(fallback).toContain("proxy_no_cache 1;");
});

test("preserves proxy identity, normalizes compression, and exposes edge diagnostics", () => {
  const config = readRequiredFile(configPath);
  const locations = [...config.matchAll(/^\s*(location\s+[^\r\n{]+)\s*\{/gmu)];
  const proxyLocations = locations
    .map((location, index) => {
      const start = location.index ?? 0;
      const end = locations[index + 1]?.index ?? config.length;
      return config.slice(start, end);
    })
    .filter((block) => block.includes("proxy_pass $web_upstream;"));

  expect(proxyLocations).toHaveLength(7);
  for (const block of proxyLocations) {
    expect(block).toContain("proxy_set_header Host $host;");
    expect(block).toContain("proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;");
    expect(block).toContain("proxy_set_header X-Forwarded-Host $forwarded_host;");
    expect(block).toContain("proxy_set_header X-Forwarded-Proto $forwarded_proto;");
    expect(block).toContain("proxy_set_header X-Forwarded-Port $forwarded_port;");
    expect(block).toContain('proxy_set_header Accept-Encoding "";');
    expect(block).toMatch(/add_header X-Edge-Cache (?:\$edge_cache_status|BYPASS) always;/u);
    expect(block).toContain("add_header X-Edge-Replica $hostname always;");
  }

  expect(config).toMatch(/gzip_types[\s\S]*application\/javascript/u);
  expect(config).toMatch(
    /location = \/nginx-health[\s\S]*add_header Cache-Control "no-store" always;/u
  );
  expect(config).toMatch(/location = \/nginx-health[\s\S]*return 200 "ok\\n";/u);
});
