export type AllowedImageType = "image/jpeg" | "image/png" | "image/webp";

const ALLOWED_TYPES: AllowedImageType[] = ["image/jpeg", "image/png", "image/webp"];

const EXT_BY_TYPE: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function asAllowedImageType(type: string): AllowedImageType | null {
  return ALLOWED_TYPES.includes(type as AllowedImageType) ? (type as AllowedImageType) : null;
}

export function extensionFor(type: AllowedImageType): string {
  return EXT_BY_TYPE[type];
}
