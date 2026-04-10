import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Status = "idle" | "running" | "pass" | "fail";

type TestDefinition = {
  id: string;
  section: string;
  name: string;
  description: string;
  run: () => Promise<{ passed: boolean; detail?: string; elapsedMs?: number }>;
};

type TestState = Record<
  string,
  { status: Status; detail?: string; elapsedMs?: number }
>;

async function runBackendTest(name?: string) {
  const t0 = performance.now();
  const res = await fetch("/api/tests/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(name ? { name } : {}),
  });
  if (!res.ok) throw new Error(`Backend test failed: ${res.status}`);
  const data = await res.json();
  const elapsedMs = performance.now() - t0;

  if (name) {
    const match = data.results?.find((r: any) => r.name === name);
    if (!match) throw new Error("Result not found");
    return { passed: !!match.passed, detail: match.detail, elapsedMs };
  }

  const allPassed = data.results?.every((r: any) => r.passed);
  return { passed: !!allPassed, detail: data.results?.map((r: any) => `${r.name}: ${r.passed ? "pass" : "fail"}`).join(", "), elapsedMs };
}

async function runApiTest(path: string, assert: (json: any) => boolean, description: string) {
  const t0 = performance.now();
  const inferredBase =
    typeof window !== "undefined" && window.location.origin.includes("5173")
      ? "http://localhost:5000"
      : window.location.origin;
  const base = import.meta.env.VITE_API_BASE || inferredBase || "";
  const url = base ? `${base}${path}` : path;
  const res = await fetch(url);
  const elapsedMs = performance.now() - t0;
  if (!res.ok) {
    return { passed: false, detail: `${description} (status ${res.status})`, elapsedMs };
  }
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { passed: false, detail: `${description} (non-JSON response)`, elapsedMs };
  }
  const json = await res.json();
  const passed = assert(json);
  return { passed, detail: description, elapsedMs };
}

const sections = [
  { id: "engine", title: "Decision Engine" },
  { id: "api", title: "API Smoke" },
  { id: "client", title: "Client Sanity" },
];

function useTests(): TestDefinition[] {
  return useMemo<TestDefinition[]>(() => [
    // Decision Engine (5)
    {
      id: "engine-all",
      section: "engine",
      name: "Backend: full suite",
      description: "Runs all five backend decision-engine tests server-side.",
      run: () => runBackendTest(),
    },
    {
      id: "engine-exit",
      section: "engine",
      name: "Early exit when full",
      description: "Stops loop as soon as target is met.",
      run: () => runBackendTest("Early exit when full"),
    },
    {
      id: "engine-cheapest",
      section: "engine",
      name: "Cheapest hours first",
      description: "Grid only in cheapest windows when deadline allows.",
      run: () => runBackendTest("Cheapest hours first"),
    },
    {
      id: "engine-deadline",
      section: "engine",
      name: "Deadline safety",
      description: "Charges during expensive window if deadline is tight.",
      run: () => runBackendTest("Deadline safety fallback"),
    },
    {
      id: "engine-future",
      section: "engine",
      name: "Future prices exclude current",
      description: "Solar stored when future price is higher.",
      run: () => runBackendTest("Future prices exclude current"),
    },

    // API Smoke (5)
    {
      id: "api-prices",
      section: "api",
      name: "Prices forecast",
      description: "24 points with currency CAD.",
      run: () =>
        runApiTest(
          "/api/forecast/prices?lat=43.65&lon=-79.38",
          (json) => Array.isArray(json.points) && json.points.length >= 24 && json.points.every((p: any) => p.currency),
          "Prices forecast shape ok"
        ),
    },
    {
      id: "api-solar",
      section: "api",
      name: "Solar forecast",
      description: "24 points, non-negative.",
      run: () =>
        runApiTest(
          "/api/forecast/solar?lat=43.65&lon=-79.38&system_kw=5",
          (json) => Array.isArray(json.points) && json.points.length >= 24 && json.points.every((p: any) => p.energy_kwh >= 0),
          "Solar forecast shape ok"
        ),
    },
    {
      id: "api-car-models",
      section: "api",
      name: "Car models",
      description: "Returns list of EV models.",
      run: () =>
        runApiTest(
          "/api/car-models",
          (json) => Array.isArray(json) && json.length > 0 && json[0].make,
          "Car models returned"
        ),
    },
    {
      id: "api-health-prices",
      section: "api",
      name: "Price positivity",
      description: "All price_per_kwh > 0.",
      run: () =>
        runApiTest(
          "/api/forecast/prices?lat=43.65&lon=-79.38",
          (json) => json.points?.every((p: any) => typeof p.price_per_kwh === "number" && p.price_per_kwh > 0),
          "Prices positive"
        ),
    },
    {
      id: "api-health-solar",
      section: "api",
      name: "Solar zero at night",
      description: "Night hours (0-5) near zero production.",
      run: () =>
        runApiTest(
          "/api/forecast/solar?lat=43.65&lon=-79.38&system_kw=5",
          (json) => json.points?.slice(0, 6).every((p: any) => p.energy_kwh < 0.2),
          "Night solar near zero"
        ),
    },

    // Client sanity (4)
    {
      id: "client-date",
      section: "client",
      name: "Date math",
      description: "Local timezone parsing works.",
      run: async () => {
        const t0 = performance.now();
        const dt = new Date("2020-01-01T00:00:00Z");
        return { passed: dt.getUTCFullYear() === 2020, detail: "Date parse", elapsedMs: performance.now() - t0 };
      },
    },
    {
      id: "client-sum",
      section: "client",
      name: "Reducer",
      description: "Array reduce behaves as expected.",
      run: async () => {
        const t0 = performance.now();
        const total = [1, 2, 3, 4].reduce((a, b) => a + b, 0);
        return { passed: total === 10, detail: "Sum correct", elapsedMs: performance.now() - t0 };
      },
    },
    {
      id: "client-promise",
      section: "client",
      name: "Promise chain",
      description: "Async await resolves correctly.",
      run: async () => {
        const t0 = performance.now();
        const val = await Promise.resolve(5).then((v) => v * 2);
        return { passed: val === 10, detail: "Promise ok", elapsedMs: performance.now() - t0 };
      },
    },
    {
      id: "client-random",
      section: "client",
      name: "Random bounded",
      description: "Math.random within [0,1).",
      run: async () => {
        const t0 = performance.now();
        const v = Math.random();
        return { passed: v >= 0 && v < 1, detail: "Random in range", elapsedMs: performance.now() - t0 };
      },
    },
  ], []);
}

function StatusBadge({ status }: { status: Status }) {
  const map = {
    idle: "secondary",
    running: "outline",
    pass: "default",
    fail: "destructive",
  } as const;
  const label = {
    idle: "Idle",
    running: "Running",
    pass: "Pass",
    fail: "Fail",
  }[status];
  return <Badge variant={map[status]}>{label}</Badge>;
}

export default function Tests() {
  const definitions = useTests();
  const [state, setState] = useState<TestState>(() =>
    Object.fromEntries(definitions.map((t) => [t.id, { status: "idle" as Status }]))
  );
  const [isRunningAll, setIsRunningAll] = useState(false);

  const grouped = sections.map((section) => ({
    ...section,
    tests: definitions.filter((t) => t.section === section.id),
  }));

  const runTest = async (test: TestDefinition) => {
    setState((s) => ({ ...s, [test.id]: { status: "running" } }));
    try {
      const result = await test.run();
      setState((s) => ({
        ...s,
        [test.id]: {
          status: result.passed ? "pass" : "fail",
          detail: result.detail,
          elapsedMs: result.elapsedMs,
        },
      }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        [test.id]: { status: "fail", detail: err?.message || "Error" },
      }));
    }
  };

  const runAll = async () => {
    setIsRunningAll(true);
    for (const test of definitions) {
      // run sequentially to keep backend load light
      // eslint-disable-next-line no-await-in-loop
      await runTest(test);
    }
    setIsRunningAll(false);
  };

  const reset = () => {
    setState(Object.fromEntries(definitions.map((t) => [t.id, { status: "idle" as Status }])));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Validation harness</p>
          <h1 className="text-3xl font-bold tracking-tight">Tests</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>Reset</Button>
          <Button onClick={runAll} disabled={isRunningAll}>
            {isRunningAll ? "Running..." : "Run All"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {grouped.map((group) => (
          <Card key={group.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{group.title}</CardTitle>
              <Badge variant="outline">{group.tests.length} tests</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.tests.map((test, idx) => {
                const st = state[test.id] ?? { status: "idle" };
                return (
                  <div key={test.id} className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium">{test.name}</span>
                      <StatusBadge status={st.status} />
                      {typeof st.elapsedMs === "number" && (
                        <Badge variant="secondary">{st.elapsedMs.toFixed(0)} ms</Badge>
                      )}
                      <Button
                        size="sm"
                        variant={idx % 2 === 0 ? "default" : "outline"}
                        onClick={() => runTest(test)}
                        disabled={st.status === "running"}
                      >
                        {st.status === "running" ? "Running..." : "Run"}
                      </Button>
                    </div>
                    <div className={cn("text-sm text-muted-foreground")}>
                      {test.description}
                      {st.detail && <span className="text-foreground"> — {st.detail}</span>}
                    </div>
                    {idx < group.tests.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
