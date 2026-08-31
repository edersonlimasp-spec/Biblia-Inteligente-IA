import { describe, expect, it } from "vitest";
import { DOWNLOAD_PUBLIC_ORIGIN, withDownloadMetadata } from "./download-metadata";

const template = `<!doctype html>
<html>
  <head>
    <meta name="description" content="old" />
    <meta property="og:title" content="old" />
    <meta property="og:description" content="old" />
    <meta property="og:image" content="/old.png" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta name="twitter:image" content="/old.png" />
    <title>old</title>
  </head>
</html>`;

describe("download page server metadata", () => {
  it("uses only the canonical deployment origin", () => {
    const html = withDownloadMetadata(template);

    expect(html).toContain(`${DOWNLOAD_PUBLIC_ORIGIN}/baixar`);
    expect(html).toContain(`${DOWNLOAD_PUBLIC_ORIGIN}/download-preview.png`);
  });

  it("cannot reflect malicious forwarded-host markup", () => {
    const maliciousForwardedHost = `attacker.example"><script>alert(1)</script>`;
    const html = withDownloadMetadata(template);

    expect(html).not.toContain(maliciousForwardedHost);
    expect(html).not.toContain("<script>");
    expect(html.match(/https:\/\/bibliainteligente\.replit\.app/g)?.length).toBeGreaterThanOrEqual(2);
  });
});