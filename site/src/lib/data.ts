import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { Community } from "./types";
import { normalizeImagePath } from "./format";
import { validateCommunity } from "./validation";

let cachedCommunities: Community[] | null = null;

function getDataDir(): string {
  if (process.env.COMMUNITY_DATA_DIR) {
    return process.env.COMMUNITY_DATA_DIR;
  }
  return path.resolve(process.cwd(), "../data/communities");
}

function normalizeCommunity(fileName: string, raw: Record<string, unknown>): Community {
  const id = String(raw.id);
  const slug = typeof raw.slug === "string" && raw.slug.trim() ? raw.slug.trim() : undefined;
  const images = (raw.images as Record<string, unknown> | undefined) ?? {};
  const cover = normalizeImagePath(images.cover as string | undefined);
  const gallery = Array.isArray(images.gallery)
    ? (images.gallery as string[]).map((item) => normalizeImagePath(item)).filter(Boolean) as string[]
    : undefined;

  return {
    ...(raw as unknown as Community),
    id,
    slug,
    routeKey: slug || id,
    source_file: fileName,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    images: {
      cover,
      gallery
    }
  };
}

export function loadCommunities(): Community[] {
  if (cachedCommunities) return cachedCommunities;

  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    cachedCommunities = [];
    return cachedCommunities;
  }

  const allFiles = fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .sort();

  const errors: string[] = [];
  const communities: Community[] = [];

  for (const fileName of allFiles) {
    const fullPath = path.join(dataDir, fileName);
    const source = fs.readFileSync(fullPath, "utf8");
    const parsed = parse(source);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      errors.push(`[${fileName}] root: must be object; value=${JSON.stringify(parsed)}`);
      continue;
    }
    const raw = parsed as Record<string, unknown>;
    errors.push(...validateCommunity(fileName, raw));
    communities.push(normalizeCommunity(fileName, raw));
  }

  if (errors.length > 0) {
    throw new Error(`Community YAML validation failed:\n${errors.join("\n")}`);
  }

  cachedCommunities = communities;
  return communities;
}

export function findCommunityByKey(key: string): Community | undefined {
  return loadCommunities().find((community) => community.routeKey === key || community.id === key);
}
