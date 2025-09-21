import { LucideIcon } from "lucide-react";

export interface ProcessedExtension {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  topics?: string[]; // Topics/use-cases this extension relates to
  icon: LucideIcon;
  href: string | null;
  tags: string[];
  isNew: boolean;
  isPopular: boolean;
  rating?: number;
  users?: string;
  url?: string;
  chromeStoreUrl?: string;
  firefoxAddonUrl?: string;
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