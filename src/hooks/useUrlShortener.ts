import type { Url } from "@/types/dashboard";
import { apiPath } from "@/lib/paths";
import { apiJson } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateUrlData {
  originalUrl: string;
  customAlias?: string;
  expiryDate?: string;
}

export function useUrlShortener() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateUrlData) => {
      const resData = await apiJson<{ success: true; data: Url }>(
        apiPath("/api/urls"),
        {
          method: "POST",
          body: data,
          credentials: "include",
        }
      );
      return resData.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.urls.stats });
      await queryClient.invalidateQueries({ queryKey: queryKeys.urls.recent });
      await queryClient.invalidateQueries({ queryKey: ["urls", "list"] });
    },
  });

  return {
    shortUrl: mutation.data?.shortUrl ?? "",
    error: mutation.error instanceof Error ? mutation.error.message : "",
    creating: mutation.isPending,
    createShortUrl: async (data: CreateUrlData) => mutation.mutateAsync(data),
    resetState: () => {
      mutation.reset();
    },
  };
}
