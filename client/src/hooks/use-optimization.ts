import { useMutation } from "@tanstack/react-query";
import { api, type OptimizeRequest, type DecisionOutcome } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useOptimization() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: OptimizeRequest) => {
      // Validate input before sending
      const validated = api.optimize.run.input.parse(data);
      
      const res = await fetch(api.optimize.run.path, {
        method: api.optimize.run.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.optimize.run.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Optimization failed");
      }

      return api.optimize.run.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
