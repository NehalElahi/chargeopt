import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertUserProfile } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/auth-utils";

export function useProfile() {
  return useQuery({
    queryKey: [api.profile.get.path],
    queryFn: async () => {
      const res = await fetch(api.profile.get.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("401: Unauthorized");
        if (res.status === 404) return null;
        throw new Error("Failed to fetch profile");
      }
      return res.json();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<InsertUserProfile>) => {
      const res = await fetch(api.profile.update.path, {
        method: api.profile.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("401: Unauthorized");
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message);
        }
        throw new Error("Failed to update settings");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profile.get.path] });
      toast({
        title: "Settings Saved",
        description: "Your configuration has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCarModels() {
  return useQuery({
    queryKey: [api.carModels.list.path],
    queryFn: async () => {
      const res = await fetch(api.carModels.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch car models");
      return res.json();
    },
  });
}

export function useWeeklySavings() {
  return useQuery({
    queryKey: [api.savings.weekly.path],
    queryFn: async () => {
      const res = await fetch(api.savings.weekly.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("401: Unauthorized");
        throw new Error("Failed to fetch savings data");
      }
      return res.json();
    },
  });
}

export function useOptimizationHistory() {
  return useQuery({
    queryKey: [api.savings.history.path],
    queryFn: async () => {
      const res = await fetch(api.savings.history.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("401: Unauthorized");
        throw new Error("Failed to fetch optimization history");
      }
      return res.json();
    },
  });
}

export { useProfile as useUser, useUpdateProfile as useUpdateUser };
