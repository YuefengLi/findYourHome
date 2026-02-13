import type { Community } from "./types";

export function parseDateValue(dateStr?: string): number {
  if (!dateStr) return 0;
  const parsed = Date.parse(dateStr);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getNearestMetroDistance(community: Community): number | null {
  const metros = community.distance?.metro;
  if (!metros || metros.length === 0) return null;
  const values = metros
    .map((item) => Number(item.distance_m))
    .filter((num) => Number.isFinite(num) && num > 0);
  if (values.length === 0) return null;
  return Math.min(...values);
}

export function getNearestMetroLabel(community: Community): string {
  const metros = community.distance?.metro ?? [];
  if (metros.length === 0) return "-";
  const valid = metros.filter((m) => Number.isFinite(Number(m.distance_m)));
  if (valid.length === 0) return "-";
  const nearest = valid.reduce((a, b) =>
    Number(a.distance_m) <= Number(b.distance_m) ? a : b
  );
  const stationName = nearest.station || "未知站点";
  return `${stationName} ${formatDistanceWithTime(Number(nearest.distance_m))}`;
}

export function getBuildStartYear(community: Community): number | null {
  const range = community.build?.build_year_range;
  if (!range) return null;
  const match = range.match(/(\d{4})/);
  if (!match) return null;
  return Number(match[1]);
}

export function formatDistanceWithTime(distanceM?: number | null): string {
  if (!distanceM || !Number.isFinite(distanceM)) return "-";
  const walkMinutes = Math.round(distanceM / 80);
  const bikeMinutes = Math.round(distanceM / 250);
  return `${distanceM}m（步行约${walkMinutes}分钟 / 骑行约${bikeMinutes}分钟）`;
}

export function normalizeImagePath(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("../assets/")) {
    return path.replace("../assets/", "/assets/");
  }
  return path;
}

export function withBaseUrl(baseUrl: string, targetPath: string): string {
  const cleanBase = baseUrl === "/" ? "" : baseUrl.replace(/\/$/, "");
  const cleanPath = targetPath.replace(/^\//, "");
  return `${cleanBase}/${cleanPath}`;
}
