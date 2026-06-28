import { ExternalLink, MapPin } from "lucide-react";
import type { Venue } from "@/lib/types/database";
import { getNaverMapUrl } from "@/lib/utils/venue-map";

interface VenueInfoProps {
  venue: Venue;
  className?: string;
  compact?: boolean;
}

export function VenueInfo({
  venue,
  className = "",
  compact = false,
}: VenueInfoProps) {
  const mapUrl = getNaverMapUrl(venue.address ?? "");

  return (
    <div className={`space-y-1 ${className}`}>
      <p
        className={`flex items-center gap-1.5 text-zinc-600 ${compact ? "text-xs" : "text-sm"}`}
      >
        <MapPin
          className={`shrink-0 text-emerald-600 ${compact ? "h-3 w-3" : "h-4 w-4"}`}
        />
        <span className="font-medium text-zinc-800">{venue.name}</span>
      </p>
      {venue.address && (
        <p className={`pl-5 text-zinc-500 ${compact ? "text-xs" : "text-sm"}`}>
          {venue.address}
        </p>
      )}
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 pl-5 font-medium text-emerald-700 hover:text-emerald-900 ${compact ? "text-xs" : "text-sm"}`}
      >
        지도에서 보기
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
