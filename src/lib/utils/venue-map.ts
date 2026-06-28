/** 네이버 지도 검색 URL */
export function getNaverMapUrl(venueName: string, address?: string | null): string {
  const query = [venueName, address].filter(Boolean).join(" ");
  return `https://map.naver.com/v5/search/${encodeURIComponent(query)}`;
}
