/** Public GitBook docs — https://rams-4.gitbook.io/rams-docs */
export const DOCS_URL = (
  process.env.NEXT_PUBLIC_DOCS_URL ?? "https://rams-4.gitbook.io/rams-docs"
).replace(/\/$/, "");

export const HOW_IT_WORKS_URL = `${DOCS_URL}/using-z-tor/how_it_works`;

/** Map friendly paths to GitBook page slugs (lowercase, underscores). */
const GITBOOK_SLUGS: Record<string, string> = {
  faq: "faq",
  "user-guide": "user_guide",
};

export function docsPath(segment: string): string {
  const key = segment.replace(/^\//, "");
  if (key === "how-it-works") return HOW_IT_WORKS_URL;
  const slug = GITBOOK_SLUGS[key] ?? key;
  return `${DOCS_URL}/${slug}`;
}