type ToolsLinkHubProps = {
  relatedTools?: Array<{
    title: string;
    href: string;
  }>;
};

const allTools = {
  "Image Converters": [
    { title: "JPG to PNG", href: "/tools/jpg-to-png" },
    { title: "PNG to JPG", href: "/tools/png-to-jpg" },
    { title: "HEIC to JPG", href: "/tools/heic-to-jpg" },
    { title: "WebP to PNG", href: "/tools/webp-to-png" },
    { title: "AVIF to JPG", href: "/tools/avif-to-jpg" },
    { title: "BMP to JPG", href: "/tools/bmp-to-jpg" },
    { title: "GIF to JPG", href: "/tools/gif-to-jpg" },
    { title: "ICO to PNG", href: "/tools/ico-to-png" },
  ],
  "Modern Formats": [
    { title: "AVIF to PNG", href: "/tools/avif-to-png" },
    { title: "AVIF to JPEG", href: "/tools/avif-to-jpeg" },
    { title: "HEIF to JPG", href: "/tools/heif-to-jpg" },
    { title: "HEIF to PNG", href: "/tools/heif-to-png" },
    { title: "HEIC to PNG", href: "/tools/heic-to-png" },
    { title: "HEIC to JPEG", href: "/tools/heic-to-jpeg" },
    { title: "WebP to PNG", href: "/tools/webp-to-png" },
    { title: "JPEG to WebP", href: "/tools/jpeg-to-webp" },
  ],
  "PDF Tools": [
    { title: "PDF to JPG", href: "/tools/pdf-to-jpg" },
    { title: "PDF to PNG", href: "/tools/pdf-to-png" },
    { title: "JPG to PDF", href: "/tools/jpg-to-pdf" },
    { title: "PNG to PDF", href: "/tools/png-to-pdf" },
    { title: "HEIC to PDF", href: "/tools/heic-to-pdf" },
    { title: "HEIF to PDF", href: "/tools/heif-to-pdf" },
    { title: "JFIF to PDF", href: "/tools/jfif-to-pdf" },
    { title: "JPEG to PDF", href: "/tools/jpeg-to-pdf" },
  ],
  "RAW Formats": [
    { title: "CR2 to JPG", href: "/tools/cr2-to-jpg" },
    { title: "CR3 to JPG", href: "/tools/cr3-to-jpg" },
    { title: "ARW to JPG", href: "/tools/arw-to-jpg" },
    { title: "DNG to JPG", href: "/tools/dng-to-jpg" },
    { title: "AI to PNG", href: "/tools/ai-to-png" },
    { title: "AI to SVG", href: "/tools/ai-to-svg" },
    { title: "JPG to SVG", href: "/tools/jpg-to-svg" },
  ],
  "Data Tools": [
    { title: "JSON to CSV", href: "/tools/json-to-csv" },
    { title: "CSV Combiner", href: "/tools/csv-combiner" },
    { title: "Character Counter", href: "/tools/character-counter" },
  ],
  "Legacy Formats": [
    { title: "JFIF to JPG", href: "/tools/jfif-to-jpg" },
    { title: "JFIF to JPEG", href: "/tools/jfif-to-jpeg" },
    { title: "JFIF to PNG", href: "/tools/jfif-to-png" },
    { title: "BMP to PNG", href: "/tools/bmp-to-png" },
    { title: "GIF to PNG", href: "/tools/gif-to-png" },
    { title: "GIF to WebP", href: "/tools/gif-to-webp" },
  ],
  "Utility Tools": [
    { title: "JPEG to JPG", href: "/tools/jpeg-to-jpg" },
    { title: "JPEG to PNG", href: "/tools/jpeg-to-png" },
    { title: "JPG to WebP", href: "/tools/jpg-to-webp" },
    { title: "PNG to WebP", href: "/tools/png-to-webp" },
    { title: "PNG Optimizer", href: "/tools/png-to-png" },
  ],
};

export function ToolsLinkHub({ relatedTools }: ToolsLinkHubProps) {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-100 to-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          All Conversion Tools
        </h2>
        
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-10">
          {Object.entries(allTools).map(([category, tools]) => (
            <div key={category}>
              <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {tools.map((tool) => (
                  <li key={tool.href}>
                    <a
                      href={tool.href}
                      className="text-sm text-gray-700 hover:text-blue-600 transition-colors duration-150 hover:underline"
                    >
                      {tool.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Can't find what you're looking for?
            </p>
            <a
              href="/tools"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Browse All Tools
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}