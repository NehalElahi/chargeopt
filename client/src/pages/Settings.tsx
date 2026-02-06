import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useUser, useUpdateUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Sun, Battery, Car, MapPin } from "lucide-react";
import { z } from "zod";

// Create a schema that coerces strings to numbers for form inputs
const formSchema = insertUserSchema.omit({ password: true, username: true }).extend({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  systemKw: z.coerce.number(),
  panelDerate: z.coerce.number(),
  evCapacityKwh: z.coerce.number(),
  evMaxChargeKw: z.coerce.number(),
  homeBatteryCapacityKwh: z.coerce.number(),
  homeBatteryMaxChargeKw: z.coerce.number(),
  homeBatteryMaxDischargeKw: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Settings() {
  const { data: user, isLoading } = useUser();
  const { mutate: updateUser, isPending: isSaving } = useUpdateUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      latitude: 37.7749,
      longitude: -122.4194,
      systemKw: 5.0,
      panelDerate: 0.85,
      evCapacityKwh: 60.0,
      evMaxChargeKw: 7.0,
      hasHomeBattery: false,
      homeBatteryCapacityKwh: 13.5,
      homeBatteryMaxChargeKw: 5.0,
      homeBatteryMaxDischargeKw: 5.0,
    },
  });

  // Load user data into form
  useEffect(() => {
    if (user) {
      form.reset({
        latitude: user.latitude || 37.7749,
        longitude: user.longitude || -122.4194,
        systemKw: user.systemKw || 5.0,
        panelDerate: user.panelDerate || 0.85,
        evCapacityKwh: user.evCapacityKwh || 60.0,
        evMaxChargeKw: user.evMaxChargeKw || 7.0,
        hasHomeBattery: user.hasHomeBattery || false,
        homeBatteryCapacityKwh: user.homeBatteryCapacityKwh || 13.5,
        homeBatteryMaxChargeKw: user.homeBatteryMaxChargeKw || 5.0,
        homeBatteryMaxDischargeKw: user.homeBatteryMaxDischargeKw || 5.0,
      });
    }
  }, [user, form]);

  const onSubmit = (data: FormValues) => {
    updateUser(data);
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
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your energy system profile.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Tabs defaultValue="location" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="solar">Solar</TabsTrigger>
              <TabsTrigger value="ev">EV</TabsTrigger>
              <TabsTrigger value="battery">Battery</TabsTrigger>
            </TabsList>

            {/* LOCATION TAB */}
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
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" {...field} />
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
                          <Input type="number" step="0.0001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* SOLAR TAB */}
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
                          <Input type="number" step="0.1" {...field} />
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
                          <Input type="number" step="0.01" max="1" min="0" {...field} />
                        </FormControl>
                        <FormDescription>Efficiency loss (typical: 0.85)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* EV TAB */}
            <TabsContent value="ev">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-500" />
                    Electric Vehicle
                  </CardTitle>
                  <CardDescription>
                    Battery capacity and charging speed of your car.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="evCapacityKwh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Battery Capacity (kWh)</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" {...field} />
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
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* BATTERY TAB */}
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
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("hasHomeBattery") && (
                    <div className="grid gap-6 sm:grid-cols-3 animate-in fade-in slide-in-from-top-4">
                      <FormField
                        control={form.control}
                        name="homeBatteryCapacityKwh"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity (kWh)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="homeBatteryMaxChargeKw"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Charge (kW)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="homeBatteryMaxDischargeKw"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Discharge (kW)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
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
            <Button type="submit" size="lg" disabled={isSaving}>
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
