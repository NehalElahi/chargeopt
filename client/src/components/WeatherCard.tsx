import { useWeather } from "@/hooks/use-weather";
import { Cloud, Wind, Thermometer, Droplets } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherCardProps {
  lat?: number;
  lon?: number;
}

export function WeatherCard({ lat, lon }: WeatherCardProps) {
  const { data, isLoading, error } = useWeather(lat, lon);

  if (isLoading) {
    return <Skeleton className="w-full h-32 rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-red-600">
        Unable to load weather data.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl shadow-blue-500/20 relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h3 className="text-blue-100 font-medium mb-1">Current Weather</h3>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold font-display">{data.temperature}°C</span>
            <Cloud className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-1">
            <Wind className="w-5 h-5 text-blue-200" />
            <span className="text-sm font-medium">{data.windspeed} km/h</span>
            <span className="text-xs text-blue-200">Wind</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div 
              style={{ transform: `rotate(${data.winddirection}deg)` }}
              className="transition-transform duration-500"
            >
              <Wind className="w-5 h-5 text-blue-200" />
            </div>
            <span className="text-sm font-medium">{data.winddirection}°</span>
            <span className="text-xs text-blue-200">Direction</span>
          </div>
        </div>
      </div>
    </div>
  );
}
