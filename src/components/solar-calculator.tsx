"use client";

import { useState, useCallback } from "react";
import {
  Sun,
  SunMedium,
  Home,
  Factory,
  Plus,
  Trash2,
  Zap,
  Battery,
  DollarSign,
  Gauge,
  Calculator,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

// Types
interface LoadEntry {
  id: string;
  name: string;
  quantity: number;
  power: number;
  hours: number;
}

interface SystemParams {
  sunshineHours: number;
  systemVoltage: number;
  backupDays: number;
  panelWattage: number;
  batteryCapacity: number;
  batteryVoltage: number;
  batteryDoD: number;
  systemEfficiency: number;
  inverterEfficiency: number;
}

interface CalculationResults {
  totalPeakLoad: number;
  totalDailyConsumptionWh: number;
  totalDailyConsumptionKWh: number;
  totalMonthlyConsumptionKWh: number;
  requiredSolarCapacity: number;
  numberOfPanels: number;
  panelArea: number;
  requiredStorageWh: number;
  usableStorageWh: number;
  totalBatteries: number;
  seriesBatteries: number;
  parallelBatteries: number;
  actualTotalBatteries: number;
  totalStoredEnergy: number;
  inverterCapacity: number;
  recommendedInverter: number;
  chargeControllerCurrent: number;
  recommendedController: number;
  controllerType: string;
  panelCost: number;
  batteryCost: number;
  inverterCost: number;
  controllerCost: number;
  accessories: number;
  totalCost: number;
}

// Default load presets
const residentialDefaults: LoadEntry[] = [
  { id: "1", name: "مصابيح LED", quantity: 10, power: 10, hours: 8 },
  { id: "2", name: "ثلاجة", quantity: 1, power: 150, hours: 24 },
  { id: "3", name: "تكييف", quantity: 1, power: 1500, hours: 8 },
  { id: "4", name: "تلفاز", quantity: 1, power: 100, hours: 6 },
  { id: "5", name: "غسالة", quantity: 1, power: 500, hours: 2 },
  { id: "6", name: "مروحة", quantity: 2, power: 75, hours: 8 },
];

const industrialDefaults: LoadEntry[] = [
  { id: "1", name: "محرك كهربائي", quantity: 2, power: 3000, hours: 8 },
  { id: "2", name: "إنارة المصنع", quantity: 20, power: 40, hours: 12 },
  { id: "3", name: "ضاغط هواء", quantity: 1, power: 5000, hours: 6 },
  { id: "4", name: "لحام كهربائي", quantity: 1, power: 4000, hours: 4 },
];

// Number formatter with Arabic locale
function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString("ar-SA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatUSD(num: number): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

let idCounter = 100;
function generateId(): string {
  return String(++idCounter);
}

export default function SolarCalculator() {
  const [loadType, setLoadType] = useState<"residential" | "industrial">("residential");
  const [loads, setLoads] = useState<LoadEntry[]>(residentialDefaults);
  const [params, setParams] = useState<SystemParams>({
    sunshineHours: 6,
    systemVoltage: 48,
    backupDays: 2,
    panelWattage: 550,
    batteryCapacity: 200,
    batteryVoltage: 12,
    batteryDoD: 70,
    systemEfficiency: 80,
    inverterEfficiency: 95,
  });
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Handle load type switch
  const handleLoadTypeChange = useCallback((type: "residential" | "industrial") => {
    setLoadType(type);
    setLoads(type === "residential" ? [...residentialDefaults] : [...industrialDefaults]);
    setResults(null);
    setShowResults(false);
  }, []);

  // Update a load entry
  const updateLoad = useCallback((id: string, field: keyof LoadEntry, value: string | number) => {
    setLoads((prev) =>
      prev.map((load) => {
        if (load.id !== id) return load;
        const numValue = typeof value === "string" ? (field === "name" ? value : Number(value) || 0) : value;
        return { ...load, [field]: numValue };
      })
    );
  }, []);

  // Add a new load entry
  const addLoad = useCallback(() => {
    setLoads((prev) => [
      ...prev,
      { id: generateId(), name: "", quantity: 1, power: 0, hours: 1 },
    ]);
  }, []);

  // Remove a load entry
  const removeLoad = useCallback((id: string) => {
    setLoads((prev) => prev.filter((load) => load.id !== id));
  }, []);

  // Update system parameter
  const updateParam = useCallback(<K extends keyof SystemParams>(key: K, value: SystemParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Calculate results
  const calculate = useCallback(() => {
    // Load Summary
    const totalPeakLoad = loads.reduce((sum, l) => sum + l.quantity * l.power, 0);
    const totalDailyConsumptionWh = loads.reduce(
      (sum, l) => sum + l.quantity * l.power * l.hours,
      0
    );
    const totalDailyConsumptionKWh = totalDailyConsumptionWh / 1000;
    const totalMonthlyConsumptionKWh = totalDailyConsumptionKWh * 30;

    // Solar Panels
    const requiredSolarCapacity =
      totalDailyConsumptionWh / (params.sunshineHours * (params.systemEfficiency / 100));
    const numberOfPanels = Math.ceil(requiredSolarCapacity / params.panelWattage);
    const panelArea = numberOfPanels * 2.2;

    // Battery Bank
    const requiredStorageWh = totalDailyConsumptionWh * params.backupDays;
    const usableStorageWh = requiredStorageWh / (params.batteryDoD / 100);
    const batteryCapacityWh = params.batteryCapacity * params.batteryVoltage;
    const totalBatteries = Math.ceil(usableStorageWh / batteryCapacityWh);
    const seriesBatteries = params.systemVoltage / params.batteryVoltage;
    const parallelBatteries = Math.ceil(totalBatteries / seriesBatteries);
    const actualTotalBatteries = seriesBatteries * parallelBatteries;
    const totalStoredEnergy = (actualTotalBatteries * batteryCapacityWh) / 1000;

    // Inverter
    const inverterCapacity = totalPeakLoad;
    const recommendedInverter =
      Math.ceil((inverterCapacity * 1.25) / 500) * 500;

    // Charge Controller
    const chargeControllerCurrent = Math.ceil(
      (numberOfPanels * params.panelWattage) / params.systemVoltage
    );
    const recommendedController =
      Math.ceil((chargeControllerCurrent * 1.25) / 10) * 10;
    const controllerType = recommendedController > 30 ? "MPPT" : "PWM/MPPT";

    // Cost Estimates
    const panelCost = numberOfPanels * params.panelWattage * 0.4;
    const batteryCost = actualTotalBatteries * params.batteryCapacity * 1.5;
    const inverterCost = recommendedInverter * 0.2;
    const controllerCost = recommendedController * 15;
    const accessories =
      0.15 * (panelCost + batteryCost + inverterCost + controllerCost);
    const totalCost = panelCost + batteryCost + inverterCost + controllerCost + accessories;

    setResults({
      totalPeakLoad,
      totalDailyConsumptionWh,
      totalDailyConsumptionKWh,
      totalMonthlyConsumptionKWh,
      requiredSolarCapacity,
      numberOfPanels,
      panelArea,
      requiredStorageWh,
      usableStorageWh,
      totalBatteries,
      seriesBatteries,
      parallelBatteries,
      actualTotalBatteries,
      totalStoredEnergy,
      inverterCapacity,
      recommendedInverter,
      chargeControllerCurrent,
      recommendedController,
      controllerType,
      panelCost,
      batteryCost,
      inverterCost,
      controllerCost,
      accessories,
      totalCost,
    });
    setShowResults(true);

    // Scroll to results
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [loads, params]);

  // Compute totals for display
  const totalPeakLoad = loads.reduce((sum, l) => sum + l.quantity * l.power, 0);
  const totalDailyEnergy = loads.reduce((sum, l) => sum + l.quantity * l.power * l.hours, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-l from-amber-500 via-orange-500 to-amber-600">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="absolute -inset-3 animate-pulse rounded-full bg-yellow-300/30" />
              <div className="relative flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm sm:size-20">
                <Sun className="size-10 text-yellow-100 animate-spin-slow sm:size-12" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
                حاسبة المنظومة الشمسية
              </h1>
              <p className="mt-2 text-base text-amber-100 sm:text-lg">
                احسب مكونات منظومتك الشمسية بدقة واحترافية
              </p>
            </div>
            <div className="flex gap-3">
              <Badge className="border-amber-300/30 bg-white/10 text-amber-100 backdrop-blur-sm">
                <Sparkles className="size-3" />
                حساب دقيق
              </Badge>
              <Badge className="border-amber-300/30 bg-white/10 text-amber-100 backdrop-blur-sm">
                <Zap className="size-3" />
                نتائج فورية
              </Badge>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l from-yellow-300 via-amber-300 to-orange-400" />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        {/* Load Type Selection */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">نوع الأحمال</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => handleLoadTypeChange("residential")}
              className={`group relative overflow-hidden rounded-xl border-2 p-5 text-right transition-all duration-300 ${
                loadType === "residential"
                  ? "border-amber-500 bg-amber-50 shadow-lg shadow-amber-200/50"
                  : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
              }`}
            >
              {loadType === "residential" && (
                <div className="absolute inset-0 bg-gradient-to-l from-amber-100/50 to-transparent" />
              )}
              <div className="relative flex items-center gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    loadType === "residential"
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-600"
                  }`}
                >
                  <Home className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">أحمال منزلية</h3>
                  <p className="text-sm text-gray-500">
                    أجهزة منزلية مثل الإنارة والثلاجة والتكييف
                  </p>
                </div>
              </div>
              {loadType === "residential" && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-amber-500 text-white">محدد</Badge>
                </div>
              )}
            </button>

            <button
              onClick={() => handleLoadTypeChange("industrial")}
              className={`group relative overflow-hidden rounded-xl border-2 p-5 text-right transition-all duration-300 ${
                loadType === "industrial"
                  ? "border-amber-500 bg-amber-50 shadow-lg shadow-amber-200/50"
                  : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
              }`}
            >
              {loadType === "industrial" && (
                <div className="absolute inset-0 bg-gradient-to-l from-amber-100/50 to-transparent" />
              )}
              <div className="relative flex items-center gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    loadType === "industrial"
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-600"
                  }`}
                >
                  <Factory className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">أحمال صناعية</h3>
                  <p className="text-sm text-gray-500">
                    معدات صناعية مثل المحركات والضواغط
                  </p>
                </div>
              </div>
              {loadType === "industrial" && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-amber-500 text-white">محدد</Badge>
                </div>
              )}
            </button>
          </div>
        </section>

        {/* Load Entry Section */}
        <section className="mb-8">
          <Card className="border-amber-200/60 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="size-5 text-amber-600" />
                  <CardTitle className="text-xl text-gray-800">جدول الأحمال الكهربائية</CardTitle>
                </div>
                <Button
                  onClick={addLoad}
                  variant="outline"
                  size="sm"
                  className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Plus className="size-4" />
                  إضافة حمل
                </Button>
              </div>
              <CardDescription>
                أدخل الأجهزة الكهربائية وقدرتها وساعات تشغيلها اليومية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-50/80 hover:bg-amber-50/80">
                      <TableHead className="text-right font-bold text-gray-700">اسم الجهاز</TableHead>
                      <TableHead className="text-right font-bold text-gray-700">العدد</TableHead>
                      <TableHead className="text-right font-bold text-gray-700">القدرة (واط)</TableHead>
                      <TableHead className="text-right font-bold text-gray-700">ساعات التشغيل</TableHead>
                      <TableHead className="text-right font-bold text-gray-700">القدرة الإجمالية (واط)</TableHead>
                      <TableHead className="text-right font-bold text-gray-700">الطاقة اليومية (واط·س)</TableHead>
                      <TableHead className="text-center font-bold text-gray-700">حذف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loads.map((load) => {
                      const totalPower = load.quantity * load.power;
                      const dailyEnergy = totalPower * load.hours;
                      return (
                        <TableRow key={load.id}>
                          <TableCell>
                            <Input
                              value={load.name}
                              onChange={(e) => updateLoad(load.id, "name", e.target.value)}
                              placeholder="اسم الجهاز"
                              className="min-w-[120px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={load.quantity}
                              onChange={(e) => updateLoad(load.id, "quantity", e.target.value)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={load.power}
                              onChange={(e) => updateLoad(load.id, "power", e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={24}
                              step={0.5}
                              value={load.hours}
                              onChange={(e) => updateLoad(load.id, "hours", e.target.value)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell className="font-semibold text-amber-700">
                            {formatNumber(totalPower)} واط
                          </TableCell>
                          <TableCell className="font-semibold text-orange-700">
                            {formatNumber(dailyEnergy)} واط·س
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLoad(load.id)}
                              className="text-red-400 hover:bg-red-50 hover:text-red-600"
                              disabled={loads.length <= 1}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary row */}
              <Separator className="my-4 bg-amber-200" />
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                  <Zap className="size-5 text-amber-600" />
                  <span className="font-bold text-gray-700">إجمالي القدرة اللحظية:</span>
                  <span className="text-lg font-bold text-amber-700">
                    {formatNumber(totalPeakLoad)} واط
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="size-5 text-orange-600" />
                  <span className="font-bold text-gray-700">إجمالي الاستهلاك اليومي:</span>
                  <span className="text-lg font-bold text-orange-700">
                    {formatNumber(totalDailyEnergy)} واط·س ({formatNumber(totalDailyEnergy / 1000, 2)} كيلوواط·س)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* System Parameters */}
        <section className="mb-8">
          <Card className="border-amber-200/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gauge className="size-5 text-amber-600" />
                <CardTitle className="text-xl text-gray-800">معلمات المنظومة</CardTitle>
              </div>
              <CardDescription>
                حدد معلمات المنظومة الشمسية المطلوبة للحساب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Sunshine Hours */}
                <div className="space-y-2">
                  <Label htmlFor="sunshineHours" className="text-gray-700">
                    متوسط ساعات سطوع الشمس يومياً
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="sunshineHours"
                      type="number"
                      min={1}
                      max={12}
                      step={0.5}
                      value={params.sunshineHours}
                      onChange={(e) =>
                        updateParam("sunshineHours", Number(e.target.value) || 1)
                      }
                    />
                    <span className="text-sm text-gray-500 shrink-0">ساعة</span>
                  </div>
                </div>

                {/* System Voltage */}
                <div className="space-y-2">
                  <Label className="text-gray-700">جهد المنظومة</Label>
                  <Select
                    value={String(params.systemVoltage)}
                    onValueChange={(v) => updateParam("systemVoltage", Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 فولت</SelectItem>
                      <SelectItem value="24">24 فولت</SelectItem>
                      <SelectItem value="48">48 فولت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Backup Days */}
                <div className="space-y-2">
                  <Label htmlFor="backupDays" className="text-gray-700">
                    أيام الاحتياطي للبطاريات
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="backupDays"
                      type="number"
                      min={1}
                      max={7}
                      value={params.backupDays}
                      onChange={(e) =>
                        updateParam("backupDays", Number(e.target.value) || 1)
                      }
                    />
                    <span className="text-sm text-gray-500 shrink-0">يوم</span>
                  </div>
                </div>

                {/* Panel Wattage */}
                <div className="space-y-2">
                  <Label className="text-gray-700">قدرة اللوح الشمسي</Label>
                  <Select
                    value={String(params.panelWattage)}
                    onValueChange={(v) => updateParam("panelWattage", Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 واط</SelectItem>
                      <SelectItem value="200">200 واط</SelectItem>
                      <SelectItem value="300">300 واط</SelectItem>
                      <SelectItem value="400">400 واط</SelectItem>
                      <SelectItem value="550">550 واط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Battery Capacity */}
                <div className="space-y-2">
                  <Label className="text-gray-700">سعة البطارية</Label>
                  <Select
                    value={String(params.batteryCapacity)}
                    onValueChange={(v) => updateParam("batteryCapacity", Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 أمبير·ساعة</SelectItem>
                      <SelectItem value="150">150 أمبير·ساعة</SelectItem>
                      <SelectItem value="200">200 أمبير·ساعة</SelectItem>
                      <SelectItem value="250">250 أمبير·ساعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Battery Voltage */}
                <div className="space-y-2">
                  <Label className="text-gray-700">جهد البطارية</Label>
                  <Select
                    value={String(params.batteryVoltage)}
                    onValueChange={(v) => updateParam("batteryVoltage", Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 فولت</SelectItem>
                      <SelectItem value="24">24 فولت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sliders */}
              <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
                {/* Battery DoD */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700">عمق تفريغ البطارية المسموح</Label>
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      {params.batteryDoD}%
                    </Badge>
                  </div>
                  <Slider
                    value={[params.batteryDoD]}
                    min={50}
                    max={80}
                    step={5}
                    onValueChange={([v]) => updateParam("batteryDoD", v)}
                    className="[&_[data-slot=slider-range]]:bg-amber-500 [&_[data-slot=slider-thumb]]:border-amber-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>50%</span>
                    <span>80%</span>
                  </div>
                </div>

                {/* System Efficiency */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700">معدل كفاءة المنظومة</Label>
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      {params.systemEfficiency}%
                    </Badge>
                  </div>
                  <Slider
                    value={[params.systemEfficiency]}
                    min={60}
                    max={95}
                    step={5}
                    onValueChange={([v]) => updateParam("systemEfficiency", v)}
                    className="[&_[data-slot=slider-range]]:bg-amber-500 [&_[data-slot=slider-thumb]]:border-amber-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>60%</span>
                    <span>95%</span>
                  </div>
                </div>

                {/* Inverter Efficiency */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700">معدل كفاءة العاكس</Label>
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      {params.inverterEfficiency}%
                    </Badge>
                  </div>
                  <Slider
                    value={[params.inverterEfficiency]}
                    min={85}
                    max={98}
                    step={1}
                    onValueChange={([v]) => updateParam("inverterEfficiency", v)}
                    className="[&_[data-slot=slider-range]]:bg-amber-500 [&_[data-slot=slider-thumb]]:border-amber-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>85%</span>
                    <span>98%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Calculate Button */}
        <section className="mb-10 flex justify-center">
          <Button
            onClick={calculate}
            size="lg"
            className="gap-3 rounded-xl bg-gradient-to-l from-amber-500 via-orange-500 to-amber-600 px-10 py-6 text-lg font-bold text-white shadow-lg shadow-amber-300/40 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-400/50 active:scale-[0.98]"
          >
            <Sun className="size-6 animate-pulse" />
            احسب المنظومة الشمسية
            <Calculator className="size-5" />
          </Button>
        </section>

        {/* Results Section */}
        {showResults && results && (
          <section id="results-section" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-1 rounded-full bg-amber-500" />
              <div className="size-1 rounded-full bg-orange-500" />
              <div className="size-1 rounded-full bg-amber-500" />
              <h2 className="text-2xl font-bold text-gray-800">نتائج الحساب</h2>
              <div className="size-1 rounded-full bg-amber-500" />
              <div className="size-1 rounded-full bg-orange-500" />
              <div className="size-1 rounded-full bg-amber-500" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Card 1: Load Summary */}
              <Card className="border-amber-200/60 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-amber-400 to-orange-500" />
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100">
                      <Zap className="size-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">ملخص الأحمال</CardTitle>
                      <CardDescription>ملخص استهلاك الأحمال الكهربائية</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow
                    label="إجمالي القدرة اللحظية"
                    value={formatNumber(results.totalPeakLoad)}
                    unit="واط"
                  />
                  <ResultRow
                    label="إجمالي الاستهلاك اليومي"
                    value={formatNumber(results.totalDailyConsumptionKWh, 2)}
                    unit="كيلوواط·س"
                  />
                  <ResultRow
                    label="إجمالي الاستهلاك الشهري"
                    value={formatNumber(results.totalMonthlyConsumptionKWh, 1)}
                    unit="كيلوواط·س"
                  />
                </CardContent>
              </Card>

              {/* Card 2: Solar Panels */}
              <Card className="border-amber-200/60 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-yellow-400 to-amber-500" />
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-100">
                      <SunMedium className="size-5 text-yellow-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">الألواح الشمسية</CardTitle>
                      <CardDescription>حساب عدد وقدرة الألواح المطلوبة</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow
                    label="إجمالي القدرة المطلوبة من الألواح"
                    value={formatNumber(Math.round(results.requiredSolarCapacity))}
                    unit="واط"
                  />
                  <ResultRow
                    label="عدد الألواح الشمسية المطلوبة"
                    value={formatNumber(results.numberOfPanels)}
                    unit="لوح"
                    highlight
                  />
                  <ResultRow
                    label="قدرة اللوح الواحد"
                    value={formatNumber(params.panelWattage)}
                    unit="واط"
                  />
                  <ResultRow
                    label="المساحة التقريبية للألواح"
                    value={formatNumber(results.panelArea, 1)}
                    unit="م²"
                  />
                </CardContent>
              </Card>

              {/* Card 3: Batteries */}
              <Card className="border-amber-200/60 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-green-400 to-emerald-500" />
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
                      <Battery className="size-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">البطاريات</CardTitle>
                      <CardDescription>حساب بنك البطاريات المطلوب</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow
                    label="سعة المخزن المطلوبة"
                    value={formatNumber(Math.round(results.usableStorageWh))}
                    unit="واط·س"
                  />
                  <ResultRow
                    label="عدد البطاريات المطلوبة"
                    value={formatNumber(results.actualTotalBatteries)}
                    unit="بطارية"
                    highlight
                  />
                  <ResultRow
                    label="سعة البطارية الواحدة"
                    value={formatNumber(params.batteryCapacity)}
                    unit="أمبير·ساعة"
                  />
                  <ResultRow
                    label="توصيل البطاريات"
                    value={`${formatNumber(results.seriesBatteries)} سلسل × ${formatNumber(results.parallelBatteries)} توازي`}
                    unit=""
                  />
                  <ResultRow
                    label="إجمالي الطاقة المخزنة"
                    value={formatNumber(results.totalStoredEnergy, 2)}
                    unit="كيلوواط·س"
                  />
                </CardContent>
              </Card>

              {/* Card 4: Inverter */}
              <Card className="border-amber-200/60 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-blue-400 to-indigo-500" />
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                      <Zap className="size-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">العاكس</CardTitle>
                      <CardDescription>حساب قدرة العاكس المطلوبة</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow
                    label="قدرة العاكس المطلوبة"
                    value={formatNumber(results.inverterCapacity)}
                    unit="واط"
                  />
                  <ResultRow
                    label="قدرة العاكس الموصى بها"
                    value={formatNumber(results.recommendedInverter)}
                    unit="واط"
                    highlight
                  />
                  <ResultRow
                    label="جهد الدخول"
                    value={formatNumber(params.systemVoltage)}
                    unit="فولت تيار مستمر"
                  />
                  <ResultRow
                    label="جهد الخرج"
                    value="220"
                    unit="فولت تيار متردد"
                  />
                </CardContent>
              </Card>

              {/* Card 5: Charge Controller */}
              <Card className="border-amber-200/60 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-purple-400 to-violet-500" />
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100">
                      <Gauge className="size-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">منظم الشحن</CardTitle>
                      <CardDescription>حساب مواصفات منظم الشحن</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow
                    label="تيار منظم الشحن المطلوب"
                    value={formatNumber(results.chargeControllerCurrent)}
                    unit="أمبير"
                  />
                  <ResultRow
                    label="منظم الشحن الموصى به"
                    value={formatNumber(results.recommendedController)}
                    unit="أمبير"
                    highlight
                  />
                  <ResultRow
                    label="النوع الموصى به"
                    value={results.controllerType}
                    unit=""
                    highlight
                  />
                </CardContent>
              </Card>

              {/* Card 6: Cost Estimate */}
              <Card className="border-amber-200/60 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-emerald-400 to-green-500" />
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100">
                      <DollarSign className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">تقدير التكلفة</CardTitle>
                      <CardDescription>تقدير تقريبي لتكلفة المنظومة بالدولار الأمريكي</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow
                    label="تكلفة الألواح الشمسية"
                    value={`$${formatUSD(Math.round(results.panelCost))}`}
                    unit=""
                  />
                  <ResultRow
                    label="تكلفة البطاريات"
                    value={`$${formatUSD(Math.round(results.batteryCost))}`}
                    unit=""
                  />
                  <ResultRow
                    label="تكلفة العاكس"
                    value={`$${formatUSD(Math.round(results.inverterCost))}`}
                    unit=""
                  />
                  <ResultRow
                    label="تكلفة منظم الشحن"
                    value={`$${formatUSD(Math.round(results.controllerCost))}`}
                    unit=""
                  />
                  <ResultRow
                    label="الإكسسوارات والتركيب (15%)"
                    value={`$${formatUSD(Math.round(results.accessories))}`}
                    unit=""
                  />
                  <Separator className="my-2 bg-emerald-200" />
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                    <span className="font-bold text-gray-700">التكلفة الإجمالية التقريبية</span>
                    <span className="text-xl font-bold text-emerald-700">
                      ${formatUSD(Math.round(results.totalCost))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Disclaimer */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-center text-sm text-amber-700">
              <strong>ملاحظة:</strong> هذه الحسابات تقريبية وقد تختلف عن الواقع حسب الظروف الميدانية وجودة المعدات.
              يُنصح باستشارة مهندس متخصص قبل التنفيذ.
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-amber-200/60 bg-amber-50/30 py-6 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <Sun className="size-4 text-amber-500" />
          <span>حاسبة المنظومة الشمسية - أداة احترافية لتصميم المنظومات الشمسية</span>
        </div>
      </footer>
    </div>
  );
}

// Reusable result row component
function ResultRow({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        <span
          className={
            highlight
              ? "text-lg font-bold text-amber-700"
              : "font-semibold text-gray-800"
          }
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs text-gray-400">{unit}</span>
        )}
      </div>
    </div>
  );
}
