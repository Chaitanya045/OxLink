import type { Url } from "@/types/dashboard";
import { apiPath } from "@/lib/paths";
import { apiJson } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export function useRecentUrls() {
  const query = useQuery({
    queryKey: queryKeys.urls.recent,
    queryFn: async () => {
      return apiJson<{ data: Url[]; pagination: { totalCount: number } }>(
        apiPath("/api/urls?page=1&limit=3&sortBy=date&sortOrder=desc"),
        {
          credentials: "include",
        }
      );
    },
    enabled: false,
  });

  const recentUrls = query.data?.data ?? [];
  const totalUrlCount = query.data?.pagination?.totalCount ?? 0;

  return {
    recentUrls,
    totalUrlCount,
    loading: query.isFetching,
    fetchRecentUrls: async () => {
      await query.refetch();
    },
  };
}
