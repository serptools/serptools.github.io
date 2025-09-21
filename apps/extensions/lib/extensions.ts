import extensionsData from '@serp-tools/app-core/data/extensions.json';
import categoriesData from '@/data/categories.json';
import topicsData from '@/data/topics.json';
import {
  Shield,
  Lock,
  CheckSquare,
  ShoppingCart,
  Coins,
  Moon,
  Bookmark,
  Palette,
  Code,
  Video,
  Clipboard,
  Gauge,
  Puzzle,
  Eye,
  Heart,
  Car,
  MessageCircle,
  GraduationCap,
  Music,
  Smile,
  Settings,
  Gamepad2,
  Home,
  Minimize,
  Trees,
  Newspaper,
  Users,
  Rocket,
  Wrench,
  MapPin,
  LucideIcon
} from "lucide-react";
import type { ProcessedExtension, Category, Topic } from '@/types';

// Icon mapping for extensions using slug
export const extensionIconMap: { [key: string]: LucideIcon } = {
  'ublock-origin': Shield,
  'lastpass': Lock,
  'grammarly': CheckSquare,
  'honey': ShoppingCart,
  'metamask': Coins,
  'dark-reader': Moon,
  'todoist': CheckSquare,
  'pocket': Bookmark,
  'colorpick-eyedropper': Palette,
  'wappalyzer': Code,
  'json-formatter': Code,
  'ghostery': Shield,
  'loom': Video,
  'notion-web-clipper': Clipboard,
  'momentum': Gauge,
};

// Icon mapping for categories
export const categoryIconMap: { [key: string]: LucideIcon } = {
  'Shield': Shield,
  'CheckSquare': CheckSquare,
  'Code': Code,
  'ShoppingCart': ShoppingCart,
  'Coins': Coins,
  'Moon': Moon,
  'Puzzle': Puzzle,
  'Eye': Eye,
  'Heart': Heart,
  'Palette': Palette,
  'Car': Car,
  'MessageCircle': MessageCircle,
  'GraduationCap': GraduationCap,
  'Music': Music,
  'Smile': Smile,
  'Settings': Settings,
  'Gamepad2': Gamepad2,
  'Home': Home,
  'Minimize': Minimize,
  'Trees': Trees,
  'Newspaper': Newspaper,
  'Users': Users,
  'Rocket': Rocket,
  'Wrench': Wrench,
  'MapPin': MapPin
};

// Get all active extensions
export function getAllExtensions(): ProcessedExtension[] {
  return extensionsData
    .filter((extension: any) => extension.isActive)
    .map((extension: any) => ({
      id: extension.id,
      slug: extension.slug,
      name: extension.name,
      description: extension.description,
      category: extension.category || 'other',
      topics: extension.topics || [],
      icon: extensionIconMap[extension.slug] || Puzzle,
      href: extension.chromeStoreUrl || extension.firefoxAddonUrl || extension.url,
      tags: extension.tags || [],
      isNew: extension.isNew || false,
      isPopular: extension.isPopular || false,
      rating: extension.rating,
      users: extension.users,
      url: extension.url,
      chromeStoreUrl: extension.chromeStoreUrl,
      firefoxAddonUrl: extension.firefoxAddonUrl,
    }));
}

// Get extensions by category
export function getExtensionsByCategory(category: string): ProcessedExtension[] {
  return getAllExtensions().filter(ext => ext.category === category);
}

// Get a single extension by ID
export function getExtensionById(id: string): ProcessedExtension | null {
  const extension = extensionsData.find((ext: any) => ext.id === id);

  if (!extension || !extension.isActive) {
    return null;
  }

  return {
    id: extension.id,
    slug: extension.slug,
    name: extension.name,
    description: extension.description,
    category: extension.category || 'other',
    topics: extension.topics || [],
    icon: extensionIconMap[extension.slug] || Puzzle,
    href: extension.chromeStoreUrl || extension.firefoxAddonUrl || extension.url,
    tags: extension.tags || [],
    isNew: extension.isNew || false,
    isPopular: extension.isPopular || false,
    rating: extension.rating,
    users: extension.users,
    url: extension.url,
    chromeStoreUrl: extension.chromeStoreUrl,
    firefoxAddonUrl: extension.firefoxAddonUrl,
  };
}

// Get related extensions (from same category)
export function getRelatedExtensions(extensionId: string, limit: number = 10): ProcessedExtension[] {
  const extension = getExtensionById(extensionId);
  if (!extension) return [];

  return getAllExtensions()
    .filter(ext => ext.category === extension.category && ext.id !== extensionId)
    .slice(0, limit);
}

// Get all categories with counts
export function getAllCategories() {
  const extensions = getAllExtensions();
  const categories = [];

  // Add "all" category
  categories.push({
    id: 'all',
    name: 'All Extensions',
    count: extensions.length
  });

  // Add specific categories from JSON
  categoriesData.forEach((category) => {
    const count = extensions.filter(ext => ext.category === category.id).length;
    if (count > 0) {
      categories.push({
        id: category.id,
        name: category.name,
        count
      });
    }
  });

  return categories;
}

// Get category by slug
export function getCategoryBySlug(slug: string): Category | null {
  return categoriesData.find(cat => cat.slug === slug) || null;
}

// Get category icon
export function getCategoryIcon(iconName: string): LucideIcon {
  return categoryIconMap[iconName] || Puzzle;
}

// Get all category slugs for static generation
export function getAllCategorySlugs(): string[] {
  return categoriesData.map(cat => cat.slug);
}

// Get all extension IDs for static generation
export function getAllExtensionIds(): string[] {
  return extensionsData
    .filter((extension: any) => extension.isActive)
    .map((extension: any) => extension.id);
}

// Get extensions by topic
export function getExtensionsByTopic(topicId: string): ProcessedExtension[] {
  return getAllExtensions().filter(ext => ext.topics?.includes(topicId));
}

// Get topic by slug
export function getTopicBySlug(slug: string): Topic | null {
  return topicsData.find((topic: Topic) => topic.slug === slug) || null;
}

// Get all topics with counts
export function getAllTopics() {
  const extensions = getAllExtensions();
  return topicsData.map((topic: Topic) => ({
    ...topic,
    count: extensions.filter(ext => ext.topics?.includes(topic.id)).length
  }));
}

// Get all topic slugs for static generation
export function getAllTopicSlugs(): string[] {
  return topicsData.map((topic: Topic) => topic.slug);
}