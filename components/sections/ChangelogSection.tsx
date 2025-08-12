import { Separator } from "@/components/ui/separator";

type ChangelogEntry = {
  date: string;
  changes: string[];
};

type ChangelogSectionProps = {
  changelog: ChangelogEntry[];
};

export function ChangelogSection({ changelog }: ChangelogSectionProps) {
  if (!changelog || changelog.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Changelog
        </h2>
        <div className="space-y-8">
          {changelog.map((entry, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center justify-center mb-6">
                <span className="bg-gray-100 px-4 py-2 rounded-full text-sm font-semibold text-gray-700">
                  {entry.date}
                </span>
              </div>
              <div className="space-y-3">
                {entry.changes.map((change, changeIdx) => (
                  <div
                    key={changeIdx}
                    className="flex items-start justify-center"
                  >
                    <div className="flex items-start max-w-2xl">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-600 text-sm">{change}</span>
                    </div>
                  </div>
                ))}
              </div>
              {idx < changelog.length - 1 && (
                <Separator className="mt-8 mx-auto w-24" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}