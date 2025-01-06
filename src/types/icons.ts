import * as LucideIcons from "lucide-react";

/**
 * IconName is a union of all the exported icon names from lucide-react,
 * ensuring type safety for your selected icon.
 */
export type IconName = keyof typeof LucideIcons;

export interface IconResponse {
  icons: IconName[];
  total: number;
  cache: {
    maxAge: number;
    staleWhileRevalidate: number;
  };
}

