import { LucideIcon } from "lucide-react";

export interface ProcessedExtension {
  id: string;
  slug: string;
  name: string;
  description: string;
  overview?: string; // Longer description
  category: string;
  topics?: string[]; // Topics/use-cases this extension relates to
  icon: LucideIcon;
  logoUrl?: string; // Actual logo from Chrome Web Store
  href: string | null;
  tags: string[];
  isNew: boolean;
  isPopular: boolean;
  rating?: number;
  users?: string;
  url?: string;
  chromeStoreUrl?: string;
  firefoxAddonUrl?: string;
  // New rich data fields
  version?: string;
  lastUpdated?: string;
  size?: string;
  developer?: {
    name: string;
    verified: boolean;
    website?: string;
  };
  permissions?: string[];
  languages?: string[];
  screenshots?: string[];
  features?: string[];
  reviews?: {
    total: number;
    average: number;
    distribution: Record<number, number>;
  };
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface CategoryWithCount extends Category {
  count: number;
}

export interface TopicWithCount extends Topic {
  count: number;
}