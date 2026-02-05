import type { Session } from "@/types/dashboard";
import { apiPath } from "@/lib/paths";
import { apiJson } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.session,
    queryFn: async () => {
      const data = await apiJson<Session | null>(apiPath("/api/auth/session"), {
        credentials: "include",
      });
      return data ?? null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const setSession = (value: Session | null) => {
    queryClient.setQueryData(queryKeys.session, value);
  };

  const checkSession = async () => {
    await query.refetch();
  };

  return {
    session: query.data ?? null,
    loading: query.isLoading,
    checkSession,
    setSession,
  };
}
