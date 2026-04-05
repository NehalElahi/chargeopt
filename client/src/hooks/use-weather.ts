import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiUrl } from "@/lib/api-url";

export function useWeather(lat: number | undefined, lon: number | undefined) {
  return useQuery({
    queryKey: [api.weather.get.path, lat, lon],
    queryFn: async () => {
      if (lat === undefined || lon === undefined) return null;
      
      const url = `${apiUrl(api.weather.get.path)}?lat=${lat}&lon=${lon}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) {
         if (res.status === 502) {
             const error = api.weather.get.responses[502].parse(await res.json());
             throw new Error(error.message);
         }
         throw new Error("Failed to fetch weather");
      }
      
      return api.weather.get.responses[200].parse(await res.json());
    },
    enabled: lat !== undefined && lon !== undefined,
  });
}
