import {
  CalendarDays,
  Megaphone,
  Newspaper,
  Sparkles,
  Star,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

type PublicFeaturedUpdatesProps = {
  churchId: string;
  slug: string;
};

type FeaturedItem = {
  key: string;
  source: "publication" | "event";
  title: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  date: string | null;
};

const TEACHING_TYPES = new Set([
  "teaching",
  "video",
  "sermon",
  "message",
]);

function stringValue(
  value: unknown
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function booleanValue(
  value: unknown
) {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
}

function firstValue(
  row: Record<string, any>,
  keys: string[]
) {
  for (const key of keys) {
    const value =
      stringValue(row[key]);

    if (value) return value;
  }

  return "";
}

function publicPublication(
  row: Record<string, any>
) {
  const status =
    stringValue(row.status).toLowerCase();

  const visible =
    booleanValue(row.is_published) ||
    booleanValue(row.is_public) ||
    status === "published" ||
    status === "active";

  return (
    visible &&
    booleanValue(
      row.is_featured ??
        row.featured ??
        row.show_on_homepage
    )
  );
}

function publicEvent(
  row: Record<string, any>
) {
  const status =
    stringValue(row.status).toLowerCase();

  const hiddenStatuses =
    new Set([
      "draft",
      "archived",
      "cancelled",
      "canceled",
      "inactive",
      "deleted",
    ]);

  const featured =
    booleanValue(
      row.is_featured ??
        row.featured ??
        row.show_on_homepage ??
        row.show_on_public_page
    );

  const publicVisible =
    row.is_public === undefined ||
    row.is_public === null ||
    booleanValue(row.is_public);

  return (
    featured &&
    publicVisible &&
    !hiddenStatuses.has(status)
  );
}

function toDateValue(
  value: string | null
) {
  if (!value) return 0;

  const timestamp =
    new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

function formatDate(
  value: string | null
) {
  if (!value) return null;

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function categoryLabel(
  value: string,
  source: FeaturedItem["source"]
) {
  const normalized =
    value.toLowerCase();

  const labels:
    Record<string, string> = {
      announcement: "Annonce",
      news: "Actualité",
      actuality: "Actualité",
      actualite: "Actualité",
      event: "Événement",
      programme: "Programme",
      program: "Programme",
    };

  return (
    labels[normalized] ||
    (
      source === "event"
        ? "Événement"
        : "Actualité"
    )
  );
}

async function loadEventRows(
  admin: ReturnType<typeof createAdminClient>,
  churchId: string
) {
  for (
    const tableName of [
      "events",
      "church_events",
    ]
  ) {
    const {
      data,
      error,
    } = await admin
      .from(tableName)
      .select("*")
      .eq("church_id", churchId)
      .limit(40);

    if (!error && data) {
      return data;
    }
  }

  return [];
}

export default async function PublicFeaturedUpdates({
  churchId,
}: PublicFeaturedUpdatesProps) {
  const admin =
    createAdminClient();

  const [
    publicationsResult,
    eventRows,
  ] = await Promise.all([
    admin
      .from("church_publications")
      .select("*")
      .eq("church_id", churchId)
      .limit(40),

    loadEventRows(
      admin,
      churchId
    ),
  ]);

  const publications =
    (
      publicationsResult.data ||
      []
    )
      .filter(
        (
          row: Record<string, any>
        ) => {
          const type =
            firstValue(
              row,
              [
                "publication_type",
                "type",
                "category",
              ]
            ).toLowerCase();

          return (
            publicPublication(row) &&
            !TEACHING_TYPES.has(type)
          );
        }
      )
      .map(
        (
          row: Record<string, any>
        ): FeaturedItem => {
          const type =
            firstValue(
              row,
              [
                "publication_type",
                "type",
                "category",
              ]
            );

          return {
            key:
              `publication-${row.id}`,
            source:
              "publication",
            title:
              firstValue(
                row,
                [
                  "title",
                  "name",
                ]
              ) ||
              "Publication",

            description:
              firstValue(
                row,
                [
                  "description",
                  "excerpt",
                  "summary",
                  "content",
                ]
              ) ||
              null,

            category:
              categoryLabel(
                type,
                "publication"
              ),

            imageUrl:
              firstValue(
                row,
                [
                  "cover_image_url",
                  "image_url",
                  "thumbnail_url",
                ]
              ) ||
              null,

            date:
              firstValue(
                row,
                [
                  "published_at",
                  "event_date",
                  "start_date",
                  "starts_at",
                  "created_at",
                ]
              ) ||
              null,
          };
        }
      );

  const events =
    (eventRows || [])
      .filter(
        (
          row: Record<string, any>
        ) =>
          publicEvent(row)
      )
      .map(
        (
          row: Record<string, any>
        ): FeaturedItem => ({
          key:
            `event-${row.id}`,
          source:
            "event",
          title:
            firstValue(
              row,
              [
                "title",
                "name",
                "event_title",
              ]
            ) ||
            "Événement",

          description:
            firstValue(
              row,
              [
                "description",
                "summary",
                "details",
                "notes",
              ]
            ) ||
            null,

          category:
            "Événement",

          imageUrl:
            firstValue(
              row,
              [
                "cover_image_url",
                "image_url",
                "photo_url",
              ]
            ) ||
            null,

          date:
            firstValue(
              row,
              [
                "starts_at",
                "start_at",
                "start_date",
                "event_date",
                "date",
                "created_at",
              ]
            ) ||
            null,
        })
      );

  const items = [
    ...publications,
    ...events,
  ]
    .sort(
      (first, second) =>
        toDateValue(second.date) -
        toDateValue(first.date)
    )
    .slice(0, 6);

  if (items.length === 0) {
    return null;
  }

  const featured = items[0];
  const others =
    items.slice(1);

  const FeaturedIcon =
    featured.source === "event"
      ? CalendarDays
      : Megaphone;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 md:px-6">
      <div className="overflow-hidden rounded-[2rem] border border-[#DCEAF5] bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-[#DCEAF5] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <Newspaper className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2563EB]">
                À la une
              </p>

              <h2 className="text-2xl font-black text-[#03357A]">
                Actualités et événements
              </h2>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">
            <Sparkles className="h-4 w-4" />
            Contenus mis en vedette
          </span>
        </header>

        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] text-white">
            {featured.imageUrl && (
              <div className="aspect-video overflow-hidden bg-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.imageUrl}
                  alt={featured.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black ring-1 ring-white/20">
                  <Star className="h-3.5 w-3.5" />
                  En vedette
                </span>

                <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black ring-1 ring-white/20">
                  {featured.category}
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-black leading-tight">
                {featured.title}
              </h3>

              {featured.description && (
                <p className="mt-3 line-clamp-5 text-sm leading-7 text-blue-50">
                  {featured.description}
                </p>
              )}

              {formatDate(
                featured.date
              ) && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-100">
                  <FeaturedIcon className="h-4 w-4" />
                  {formatDate(
                    featured.date
                  )}
                </p>
              )}
            </div>
          </article>

          <div className="grid gap-3">
            {others.map(
              (item) => {
                const Icon =
                  item.source ===
                  "event"
                    ? CalendarDays
                    : Megaphone;

                return (
                  <article
                    key={item.key}
                    className="grid grid-cols-[76px_1fr] gap-3 rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-3"
                  >
                    <div className="relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon className="h-7 w-7" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide text-[#2563EB]">
                        {item.category}
                      </p>

                      <h3 className="mt-1 line-clamp-2 font-black text-[#03357A]">
                        {item.title}
                      </h3>

                      {formatDate(
                        item.date
                      ) && (
                        <p className="mt-2 text-xs font-bold text-slate-500">
                          {formatDate(
                            item.date
                          )}
                        </p>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
