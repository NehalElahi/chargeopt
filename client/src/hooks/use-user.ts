import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertUser } from "@shared/schema";

export function useUser() {
  return useQuery({
    queryKey: [api.users.get.path],
    queryFn: async () => {
      const res = await fetch(api.users.get.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch user");
      }
      return api.users.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<InsertUser>) => {
      const validated = api.users.update.input.parse(updates);
      const res = await fetch(api.users.update.path, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
           const error = api.users.update.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to update settings");
      }
      
      return api.users.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.get.path] });
      toast({
        title: "Settings Saved",
        description: "Your configuration has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
