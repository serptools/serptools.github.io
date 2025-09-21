"use client";

import { useState, useRef } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@serp-tools/ui/components/card";
import { LucideIcon, Star, Users } from "lucide-react";

interface ExtensionCardProps {
  extension: {
    id: string;
    name: string;
    description: string;
    href: string;
    icon: LucideIcon;
    rating?: number;
    users?: string;
    isPopular?: boolean;
    isNew?: boolean;
  };
}

const colors = [
  "rgb(239, 68, 68)",   // red-500
  "rgb(245, 158, 11)",  // amber-500
  "rgb(34, 197, 94)",   // green-500
  "rgb(59, 130, 246)",  // blue-500
  "rgb(168, 85, 247)",  // purple-500
  "rgb(236, 72, 153)",  // pink-500
  "rgb(20, 184, 166)",  // teal-500
  "rgb(251, 146, 60)",  // orange-500
  "rgb(99, 102, 241)",  // indigo-500
  "rgb(244, 63, 94)",   // rose-500
  "rgb(14, 165, 233)",  // sky-500
  "rgb(163, 230, 53)",  // lime-400
];

export function ExtensionCard({ extension }: ExtensionCardProps) {
  const [borderColor, setBorderColor] = useState<string>("");
  const colorIndexRef = useRef(0);
  const Icon = extension.icon;

  const handleMouseEnter = () => {
    // Cycle through colors sequentially instead of random
    colorIndexRef.current = (colorIndexRef.current + 1) % colors.length;
    const color = colors[colorIndexRef.current];
    if (color) {
      setBorderColor(color);
    }
  };

  const handleMouseLeave = () => {
    setBorderColor("");
  };

  return (
    <a href={extension.href} target="_blank" rel="noopener noreferrer">
      <Card
        className="group h-full transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-2"
        style={{
          borderColor: borderColor || undefined,
          transition: "all 0.3s ease, border-color 0.2s ease",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CardHeader>
          <div className="flex items-start gap-3 mb-2">
            <Icon
              className="h-6 w-6 mt-0.5 transition-colors duration-300"
              style={{ color: borderColor || undefined }}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {extension.name}
              </CardTitle>
              <div className="flex items-center gap-3 mt-1">
                {extension.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">{extension.rating}</span>
                  </div>
                )}
                {extension.users && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-600">{extension.users}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <CardDescription className="line-clamp-2">
            {extension.description}
          </CardDescription>
          {(extension.isPopular || extension.isNew) && (
            <div className="flex gap-2 mt-2">
              {extension.isPopular && (
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  Popular
                </span>
              )}
              {extension.isNew && (
                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                  New
                </span>
              )}
            </div>
          )}
        </CardHeader>
      </Card>
    </a>
  );
}