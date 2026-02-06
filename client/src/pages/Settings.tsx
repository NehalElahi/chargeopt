import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProfile, useUpdateProfile, useCarModels } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Sun, Battery, Car, MapPin, Navigation } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  systemKw: z.coerce.number(),
  panelDerate: z.coerce.number(),
  evCarModelId: z.coerce.number().nullable().optional(),
  evCapacityKwh: z.coerce.number(),
  evMaxChargeKw: z.coerce.number(),
  hasHomeBattery: z.boolean(),
  homeBatteryCapacityKwh: z.coerce.number(),
  homeBatteryMaxChargeKw: z.coerce.number(),
  homeBatteryMaxDischargeKw: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Settings() {
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();
  const { data: carModels, isLoading: carsLoading } = useCarModels();
  const { toast } = useToast();
  const [detectingLocation, setDetectingLocation] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      latitude: 37.7749,
      longitude: -122.4194,
      systemKw: 5.0,
      panelDerate: 0.85,
      evCarModelId: null,
      evCapacityKwh: 60.0,
      evMaxChargeKw: 7.0,
      hasHomeBattery: false,
      homeBatteryCapacityKwh: 13.5,
      homeBatteryMaxChargeKw: 5.0,
      homeBatteryMaxDischargeKw: 5.0,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        latitude: profile.latitude || 37.7749,
        longitude: profile.longitude || -122.4194,
        systemKw: profile.systemKw || 5.0,
        panelDerate: profile.panelDerate || 0.85,
        evCarModelId: profile.evCarModelId || null,
        evCapacityKwh: profile.evCapacityKwh || 60.0,
        evMaxChargeKw: profile.evMaxChargeKw || 7.0,
        hasHomeBattery: profile.hasHomeBattery || false,
        homeBatteryCapacityKwh: profile.homeBatteryCapacityKwh || 13.5,
        homeBatteryMaxChargeKw: profile.homeBatteryMaxChargeKw || 5.0,
        homeBatteryMaxDischargeKw: profile.homeBatteryMaxDischargeKw || 5.0,
      });
    }
  }, [profile, form]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not Supported", description: "Geolocation is not supported by your browser.", variant: "destructive" });
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", Number(position.coords.latitude.toFixed(4)));
        form.setValue("longitude", Number(position.coords.longitude.toFixed(4)));
        setDetectingLocation(false);
        toast({ title: "Location Detected", description: "Your coordinates have been updated." });
      },
      (error) => {
        setDetectingLocation(false);
        toast({ title: "Location Error", description: error.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCarModelSelect = (value: string) => {
    if (value === "custom") {
      form.setValue("evCarModelId", null);
      return;
    }
    const modelId = parseInt(value);
    const model = (carModels || []).find((m: any) => m.id === modelId);
    if (model) {
      form.setValue("evCarModelId", model.id);
      form.setValue("evCapacityKwh", model.batteryCapacityKwh);
      form.setValue("evMaxChargeKw", model.maxChargeKw);
    }
  };

  const onSubmit = (data: FormValues) => {
    updateProfile(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your energy system profile.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          <Tabs defaultValue="location" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="location" data-testid="tab-location">Location</TabsTrigger>
              <TabsTrigger value="solar" data-testid="tab-solar">Solar</TabsTrigger>
              <TabsTrigger value="ev" data-testid="tab-ev">EV</TabsTrigger>
              <TabsTrigger value="battery" data-testid="tab-battery">Battery</TabsTrigger>
            </TabsList>

            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Geographic Location
                  </CardTitle>
                  <CardDescription>
                    Used to fetch accurate weather and solar irradiance data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    data-testid="button-detect-location"
                  >
                    {detectingLocation ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4 mr-2" />
                    )}
                    {detectingLocation ? "Detecting..." : "Use My Current Location"}
                  </Button>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0001" data-testid="input-latitude" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0001" data-testid="input-longitude" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="solar">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-500" />
                    Solar PV System
                  </CardTitle>
                  <CardDescription>
                    Details about your solar panels for production forecasting.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="systemKw"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System Size (kW)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" data-testid="input-system-kw" {...field} />
                        </FormControl>
                        <FormDescription>Total rated capacity of your panels</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="panelDerate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Derate Factor (0-1)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" max="1" min="0" data-testid="input-derate" {...field} />
                        </FormControl>
                        <FormDescription>Efficiency loss (typical: 0.85)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ev">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-500" />
                    Electric Vehicle
                  </CardTitle>
                  <CardDescription>
                    Select your car model or enter battery specs manually.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <FormLabel>Car Model</FormLabel>
                    <Select
                      onValueChange={handleCarModelSelect}
                      value={form.watch("evCarModelId")?.toString() || "custom"}
                    >
                      <SelectTrigger className="mt-2" data-testid="select-car-model">
                        <SelectValue placeholder="Select your vehicle..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom / Manual Entry</SelectItem>
                        {!carsLoading && (carModels || []).map((m: any) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.year} {m.make} {m.model} ({m.batteryCapacityKwh} kWh)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Selecting a model auto-fills battery capacity and charge rate.
                    </p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="evCapacityKwh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Battery Capacity (kWh)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" data-testid="input-ev-capacity" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evMaxChargeKw"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Charge Rate (kW)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" data-testid="input-ev-charge-rate" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="battery">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Battery className="w-5 h-5 text-emerald-500" />
                    Home Battery Storage
                  </CardTitle>
                  <CardDescription>
                    Optional home battery configuration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="hasHomeBattery"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Home Battery</FormLabel>
                          <FormDescription>
                            Toggle if you have a stationary battery installed.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-home-battery"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {form.watch("hasHomeBattery") && (
                    <div className="grid gap-6 sm:grid-cols-3 animate-in fade-in slide-in-from-top-4">
                      <FormField control={form.control} name="homeBatteryCapacityKwh"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity (kWh)</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="homeBatteryMaxChargeKw"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Charge (kW)</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="homeBatteryMaxDischargeKw"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Discharge (kW)</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSaving} data-testid="button-save-settings">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
