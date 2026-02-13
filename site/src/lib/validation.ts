import type { AreaRange } from "./types";

const ALLOWED_AREA_RANGES: AreaRange[] = ["80-90", "90-100", "100-120"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toPrintableValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function pushError(
  errors: string[],
  fileName: string,
  fieldPath: string,
  value: unknown,
  reason: string
): void {
  errors.push(
    `[${fileName}] ${fieldPath}: ${reason}; value=${toPrintableValue(value)}`
  );
}

export function validateCommunity(fileName: string, raw: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (!raw.id) {
    pushError(errors, fileName, "id", raw.id, "required");
  }
  if (!raw.name_zh) {
    pushError(errors, fileName, "name_zh", raw.name_zh, "required");
  }
  if (!Array.isArray(raw.tags)) {
    pushError(errors, fileName, "tags", raw.tags, "must be array");
  }
  if (typeof raw.updated_at !== "string" || !DATE_PATTERN.test(raw.updated_at)) {
    pushError(
      errors,
      fileName,
      "updated_at",
      raw.updated_at,
      "must match YYYY-MM-DD"
    );
  }

  const housingStock = raw.housing_stock as
    | { building_types?: Array<{ layouts?: Array<{ area_sqm_range?: unknown }> }> }
    | undefined;

  const buildingTypes = housingStock?.building_types ?? [];
  buildingTypes.forEach((buildingType, typeIndex) => {
    const layouts = buildingType.layouts ?? [];
    layouts.forEach((layout, layoutIndex) => {
      const areaRange = layout.area_sqm_range;
      if (typeof areaRange !== "string" || !ALLOWED_AREA_RANGES.includes(areaRange as AreaRange)) {
        pushError(
          errors,
          fileName,
          `housing_stock.building_types[${typeIndex}].layouts[${layoutIndex}].area_sqm_range`,
          areaRange,
          `must be one of ${ALLOWED_AREA_RANGES.join(", ")}`
        );
      }
    });
  });

  return errors;
}
