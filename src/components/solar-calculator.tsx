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
  systemType: "on-grid" | "off-grid" | "hybrid";
  batteryType: "lead-acid" | "lithium";
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
  requiredStorageKWh: number;
  usableStorageKWh: number;
  batteryCapacityKWh: number;
  totalBatteries: number;
  seriesBatteries: number;
  parallelBatteries: number;
  actualTotalBatteries: number;
  totalStoredEnergy: number;
  totalStoredEnergyKWh: number;
  inverterCapacity: number;
  recommendedInverter: number;
  chargeControllerCurrent: number;
  recommendedController: number;
  controllerType: string;
  batteryTypeName: string;
  systemTypeName: string;
  recommendedBatteryBrands: string[];
  recommendedInverterBrand: string;
  panelCost: number;
  batteryCost: number;
  inverterCost: number;
  controllerCost: number;
  accessories: number;
  totalCost: number;
  selectedBatteryModelName: string;
  selectedInverterModelName: string;
  selectedBatterySpecs: string;
  selectedInverterSpecs: string;
  matchingBatteryModels: { brand: string; model: string; voltage: number; capacityAh: number; energyKWh: number; price: number }[];
  matchingInverterModels: { brand: string; model: string; powerW: number; pvVoltageRange: string; mpptCount: number; maxPvPower: number; price: number }[];
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

// Battery brand recommendations with detailed product models
const lithiumBatteryBrands: Record<string, { 
  name: string; 
  models: { name: string; voltage: number; capacityAh: number; energyKWh: number; price: number }[];
  notes: string 
}> = {
  dyness: { 
    name: "DYNess", 
    models: [
      { name: "Powerbox G2", voltage: 51.2, capacityAh: 100, energyKWh: 5.12, price: 1800 },
      { name: "Powerbox G2", voltage: 51.2, capacityAh: 200, energyKWh: 10.24, price: 3200 },
      { name: "Powerbox G2", voltage: 51.2, capacityAh: 280, energyKWh: 14.34, price: 4200 },
    ],
    notes: "أداء موثوق مع ضمان 10 سنوات - متوفر في السوق اليمني" 
  },
  pylontech: { 
    name: "Pylontech", 
    models: [
      { name: "US2000C", voltage: 51.2, capacityAh: 50, energyKWh: 2.56, price: 900 },
      { name: "US3000C", voltage: 51.2, capacityAh: 74, energyKWh: 3.79, price: 1300 },
      { name: "Force H2", voltage: 51.2, capacityAh: 100, energyKWh: 5.12, price: 1700 },
    ],
    notes: "أكثر شيوعاً في المنظومات المنزلية" 
  },
  byd: { 
    name: "BYD", 
    models: [
      { name: "Battery Box Premium HVS", voltage: 51.2, capacityAh: 56, energyKWh: 2.88, price: 1200 },
      { name: "Battery Box Premium HVM", voltage: 51.2, capacityAh: 112, energyKWh: 5.74, price: 2200 },
      { name: "Battery Box Premium HVM 22.1", voltage: 51.2, capacityAh: 216, energyKWh: 11.06, price: 4000 },
    ],
    notes: "أداء ممتاز وعمر طويل" 
  },
  catl: { 
    name: "CATL", 
    models: [
      { name: "EnerOne", voltage: 51.2, capacityAh: 50, energyKWh: 2.56, price: 1000 },
      { name: "EnerOne Plus", voltage: 51.2, capacityAh: 100, energyKWh: 5.12, price: 1800 },
      { name: "EnerOne Mega", voltage: 51.2, capacityAh: 200, energyKWh: 10.24, price: 3400 },
    ],
    notes: "أكبر مصنع بطاريات في العالم" 
  },
  solax: { 
    name: "SolaX", 
    models: [
      { name: "Triple Power LFP", voltage: 51.2, capacityAh: 65, energyKWh: 3.33, price: 1100 },
      { name: "Triple Power LFP", voltage: 51.2, capacityAh: 100, energyKWh: 5.12, price: 1700 },
      { name: "Triple Power LFP", voltage: 51.2, capacityAh: 130, energyKWh: 6.66, price: 2200 },
    ],
    notes: "تكامل ممتاز مع العواكس" 
  },
  victron: { 
    name: "Victron Energy", 
    models: [
      { name: "Lynx Smart BMS", voltage: 51.2, capacityAh: 50, energyKWh: 2.56, price: 1500 },
      { name: "Lynx Smart BMS", voltage: 51.2, capacityAh: 100, energyKWh: 5.12, price: 2700 },
    ],
    notes: "جودة هولندية عالية" 
  },
};

// Inverter brand recommendations with detailed product models
const inverterBrands: Record<string, { 
  name: string; 
  models: { name: string; powerW: number; pvVoltageRange: string; mpptCount: number; maxPvPower: number; batteryVoltage: string; notes: string; price: number }[];
  type: string; 
  notes: string 
}> = {
  luxpower: { 
    name: "Lux Power / POWERTEK", 
    models: [
      { name: "SNA-EU 5000", powerW: 5000, pvVoltageRange: "120-440V", mpptCount: 2, maxPvPower: 7500, batteryVoltage: "38.4-60V", notes: "منظومة منزلية صغيرة", price: 800 },
      { name: "SNA-EU 8000", powerW: 8000, pvVoltageRange: "120-440V", mpptCount: 2, maxPvPower: 12000, batteryVoltage: "38.4-60V", notes: "منظومة منزلية متوسطة", price: 1200 },
      { name: "SNA-EU 10000", powerW: 10000, pvVoltageRange: "120-440V", mpptCount: 2, maxPvPower: 15000, batteryVoltage: "38.4-60V", notes: "منظومة منزلية كبيرة", price: 1500 },
      { name: "SNA-EU 12000", powerW: 12000, pvVoltageRange: "120-440V", mpptCount: 2, maxPvPower: 18000, batteryVoltage: "38.4-60V", notes: "منظومة تجارية صغيرة", price: 1800 },
      { name: "SNA-EU 14000", powerW: 14000, pvVoltageRange: "120-440V", mpptCount: 2, maxPvPower: 24000, batteryVoltage: "38.4-60V", notes: "منظومة تجارية متوسطة", price: 2200 },
    ],
    type: "hybrid/off-grid", 
    notes: "خيار شائع في اليمن - ضمان 5 سنوات" 
  },
  growatt: { 
    name: "Growatt", 
    models: [
      { name: "SPF 5000ES", powerW: 5000, pvVoltageRange: "120-450V", mpptCount: 2, maxPvPower: 6500, batteryVoltage: "40-60V", notes: "منزلي اقتصادي", price: 650 },
      { name: "SPF 8000ES", powerW: 8000, pvVoltageRange: "120-450V", mpptCount: 2, maxPvPower: 10400, batteryVoltage: "40-60V", notes: "منزلي متوسط", price: 1000 },
      { name: "SPH 10000TL3", powerW: 10000, pvVoltageRange: "100-550V", mpptCount: 2, maxPvPower: 15000, batteryVoltage: "120-480V", notes: "هجين ثلاثي الأطوار", price: 1400 },
    ],
    type: "on-grid/hybrid/off-grid", 
    notes: "أفضل قيمة مقابل السعر" 
  },
  deye: { 
    name: "Deye", 
    models: [
      { name: "SUN-5K-SG04LP3", powerW: 5000, pvVoltageRange: "120-500V", mpptCount: 2, maxPvPower: 6500, batteryVoltage: "40-60V", notes: "هجين أحادي الطور", price: 900 },
      { name: "SUN-8K-SG04LP3", powerW: 8000, pvVoltageRange: "120-500V", mpptCount: 2, maxPvPower: 10400, batteryVoltage: "40-60V", notes: "هجين أحادي الطور", price: 1300 },
      { name: "SUN-12K-SG04LP3", powerW: 12000, pvVoltageRange: "200-600V", mpptCount: 2, maxPvPower: 15600, batteryVoltage: "120-480V", notes: "هجين ثلاثي الأطوار", price: 1900 },
    ],
    type: "hybrid/on-grid", 
    notes: "خيار شائع في الشرق الأوسط" 
  },
  sma: { 
    name: "SMA", 
    models: [
      { name: "Sunny Island 6048", powerW: 6000, pvVoltageRange: "-", mpptCount: 0, maxPvPower: 0, batteryVoltage: "42-60V", notes: "عاكس بطاريات احترافي", price: 2500 },
      { name: "Sunny Boy Storage", powerW: 5000, pvVoltageRange: "-", mpptCount: 0, maxPvPower: 0, batteryVoltage: "150-500V", notes: "نظام تخزين متكامل", price: 2200 },
    ],
    type: "on-grid/hybrid/off-grid", 
    notes: "ألماني - موثوقية عالية" 
  },
  victron_inv: { 
    name: "Victron Energy", 
    models: [
      { name: "MultiPlus-II 48/5000", powerW: 5000, pvVoltageRange: "-", mpptCount: 0, maxPvPower: 0, batteryVoltage: "38-66V", notes: "نظام متكامل مع شاحن", price: 1800 },
      { name: "MultiPlus-II 48/8000", powerW: 8000, pvVoltageRange: "-", mpptCount: 0, maxPvPower: 0, batteryVoltage: "38-66V", notes: "نظام متكامل مع شاحن", price: 2600 },
      { name: "Quattro 48/10000", powerW: 10000, pvVoltageRange: "-", mpptCount: 0, maxPvPower: 0, batteryVoltage: "38-66V", notes: "نظام مزدوج الدخول", price: 3200 },
    ],
    type: "off-grid/hybrid", 
    notes: "خيار احترافي للمنظومات المستقلة" 
  },
  huawei: { 
    name: "Huawei", 
    models: [
      { name: "SUN2000-5KTL", powerW: 5000, pvVoltageRange: "100-560V", mpptCount: 2, maxPvPower: 7500, batteryVoltage: "85-600V", notes: "هجين ذكي مع WiFi", price: 950 },
      { name: "SUN2000-10KTL", powerW: 10000, pvVoltageRange: "200-1000V", mpptCount: 2, maxPvPower: 15000, batteryVoltage: "85-600V", notes: "هجين ثلاثي الأطوار", price: 1800 },
    ],
    type: "on-grid/hybrid", 
    notes: "كفاءة عالية وضمان طويل" 
  },
  sungrow: { 
    name: "Sungrow", 
    models: [
      { name: "SH5.0RT", powerW: 5000, pvVoltageRange: "150-800V", mpptCount: 2, maxPvPower: 7500, batteryVoltage: "150-600V", notes: "هجين أحادي الطور", price: 900 },
      { name: "SH10RT", powerW: 10000, pvVoltageRange: "200-1000V", mpptCount: 2, maxPvPower: 15000, batteryVoltage: "150-600V", notes: "هجين ثلاثي الأطوار", price: 1700 },
    ],
    type: "on-grid/hybrid", 
    notes: "صيني رائد - كفاءة عالية" 
  },
};

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
    systemType: "off-grid",
    batteryType: "lead-acid",
    batteryCapacity: 200,
    batteryVoltage: 12,
    batteryDoD: 70,
    systemEfficiency: 80,
    inverterEfficiency: 95,
  });
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedBatteryBrand, setSelectedBatteryBrand] = useState<string>("");
  const [selectedBatteryModel, setSelectedBatteryModel] = useState<string>("");
  const [selectedInverterBrand, setSelectedInverterBrand] = useState<string>("");
  const [selectedInverterModel, setSelectedInverterModel] = useState<string>("");

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
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      // When battery type changes, auto-adjust DoD and capacity defaults
      if (key === "batteryType") {
        if (value === "lithium") {
          next.batteryDoD = 90;
          if (next.batteryCapacity < 100) next.batteryCapacity = 100;
        } else {
          next.batteryDoD = 70;
        }
      }
      // When system type is on-grid, batteries not needed
      if (key === "systemType" && value === "on-grid") {
        next.backupDays = 0;
      } else if (key === "systemType" && value !== "on-grid" && next.backupDays === 0) {
        next.backupDays = 2;
      }
      return next;
    });
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

    // Battery Bank (only for off-grid and hybrid)
    const isOnGrid = params.systemType === "on-grid";
    const requiredStorageWh = isOnGrid ? 0 : totalDailyConsumptionWh * params.backupDays;
    const usableStorageWh = isOnGrid ? 0 : requiredStorageWh / (params.batteryDoD / 100);
    const requiredStorageKWh = requiredStorageWh / 1000;
    const usableStorageKWh = usableStorageWh / 1000;
    const batteryCapacityWh = params.batteryCapacity * params.batteryVoltage;
    const batteryCapacityKWh = batteryCapacityWh / 1000;
    const totalBatteries = isOnGrid ? 0 : Math.ceil(usableStorageWh / batteryCapacityWh);
    const seriesBatteries = isOnGrid ? 0 : Math.max(1, Math.round(params.systemVoltage / params.batteryVoltage));
    const parallelBatteries = isOnGrid ? 0 : Math.ceil(totalBatteries / seriesBatteries);
    const actualTotalBatteries = isOnGrid ? 0 : seriesBatteries * parallelBatteries;
    const totalStoredEnergy = isOnGrid ? 0 : (actualTotalBatteries * batteryCapacityWh) / 1000;
    const totalStoredEnergyKWh = totalStoredEnergy;

    // Inverter
    const inverterCapacity = totalPeakLoad;
    const recommendedInverter =
      Math.ceil((inverterCapacity * 1.25) / 500) * 500;

    // Charge Controller (only for off-grid and hybrid)
    const chargeControllerCurrent = isOnGrid ? 0 : Math.ceil(
      (numberOfPanels * params.panelWattage) / params.systemVoltage
    );
    const recommendedController = isOnGrid ? 0 :
      Math.ceil((chargeControllerCurrent * 1.25) / 10) * 10;
    const controllerType = isOnGrid ? "-" : (recommendedController > 30 ? "MPPT" : "PWM/MPPT");

    // System type name
    const systemTypeNameMap: Record<string, string> = {
      "on-grid": "متصلة بالشبكة (On-Grid)",
      "off-grid": "مستقلة (Off-Grid)",
      "hybrid": "هجينة (Hybrid)",
    };
    const systemTypeName = systemTypeNameMap[params.systemType];

    // Battery brand recommendations based on type and required capacity
    const recommendedBatteryBrands: string[] = [];
    if (!isOnGrid) {
      if (params.batteryType === "lithium") {
        const reqKWh = usableStorageKWh;
        if (reqKWh <= 15) {
          recommendedBatteryBrands.push("Pylontech", "SolaX", "MPP Solar");
        } else if (reqKWh <= 50) {
          recommendedBatteryBrands.push("Pylontech", "BYD", "SolaX", "Victron Energy");
        } else {
          recommendedBatteryBrands.push("BYD", "CATL", "Pylontech", "Sungrow");
        }
      } else {
        recommendedBatteryBrands.push("Trojan", "Rolls", "Victron Energy");
      }
    }

    // Inverter brand recommendations based on capacity and system type
    let recommendedInverterBrand = "";
    const invKw = recommendedInverter / 1000;
    if (params.systemType === "on-grid") {
      if (invKw <= 10) recommendedInverterBrand = "Growatt, Sungrow";
      else if (invKw <= 30) recommendedInverterBrand = "Huawei, SMA, Growatt";
      else recommendedInverterBrand = "SMA, Huawei, Sungrow";
    } else if (params.systemType === "off-grid") {
      if (invKw <= 5) recommendedInverterBrand = "Victron Energy, MPP Solar";
      else if (invKw <= 20) recommendedInverterBrand = "Victron Energy, Growatt, SMA";
      else recommendedInverterBrand = "SMA, Victron Energy, Sol-Ark";
    } else {
      if (invKw <= 10) recommendedInverterBrand = "Deye, Growatt, Victron Energy";
      else if (invKw <= 30) recommendedInverterBrand = "Huawei, Deye, SMA, Sol-Ark";
      else recommendedInverterBrand = "SMA, Huawei, Sungrow, Sol-Ark";
    }

    // Cost Estimates
    const panelCost = numberOfPanels * params.panelWattage * 0.4;
    // Lithium batteries cost ~$4.5/Ah vs Lead-acid ~$1.5/Ah
    const costPerAh = params.batteryType === "lithium" ? 4.5 : 1.5;
    // When a specific battery model is selected, use its price
    const selectedBatteryModelObj = (selectedBatteryBrand && selectedBatteryModel && params.batteryType === "lithium")
      ? lithiumBatteryBrands[selectedBatteryBrand]?.models[parseInt(selectedBatteryModel)]
      : null;
    const batteryCost = isOnGrid ? 0 : selectedBatteryModelObj
      ? actualTotalBatteries * selectedBatteryModelObj.price
      : actualTotalBatteries * params.batteryCapacity * costPerAh;
    // When a specific inverter model is selected, use its price
    const selectedInverterModelObj = (selectedInverterBrand && selectedInverterModel)
      ? inverterBrands[selectedInverterBrand]?.models[parseInt(selectedInverterModel)]
      : null;
    const inverterCost = selectedInverterModelObj
      ? selectedInverterModelObj.price
      : recommendedInverter * 0.2;
    const controllerCost = isOnGrid ? 0 : recommendedController * 15;
    const accessories =
      0.15 * (panelCost + batteryCost + inverterCost + controllerCost);
    const totalCost = panelCost + batteryCost + inverterCost + controllerCost + accessories;

    const batteryTypeName = isOnGrid ? "-" : (params.batteryType === "lithium" ? "ليثيوم" : "حمض الرصاص");

    // Selected model names and specs
    const selectedBatteryModelName = selectedBatteryModelObj
      ? `${lithiumBatteryBrands[selectedBatteryBrand!].name} ${selectedBatteryModelObj.name} (${selectedBatteryModelObj.capacityAh}Ah / ${selectedBatteryModelObj.energyKWh}kWh)`
      : "";
    const selectedInverterModelName = selectedInverterModelObj
      ? `${inverterBrands[selectedInverterBrand!].name} ${selectedInverterModelObj.name} (${selectedInverterModelObj.powerW}W)`
      : "";
    const selectedBatterySpecs = selectedBatteryModelObj
      ? `${selectedBatteryModelObj.voltage}V | ${selectedBatteryModelObj.capacityAh}Ah | ${selectedBatteryModelObj.energyKWh}kWh | $${formatUSD(selectedBatteryModelObj.price)}`
      : "";
    const selectedInverterSpecs = selectedInverterModelObj
      ? `${selectedInverterModelObj.powerW}W | PV: ${selectedInverterModelObj.pvVoltageRange} | ${selectedInverterModelObj.mpptCount} MPPT | Max PV: ${selectedInverterModelObj.maxPvPower}W | Battery: ${selectedInverterModelObj.batteryVoltage} | $${formatUSD(selectedInverterModelObj.price)}`
      : "";

    // Find matching battery models from all brands
    const matchingBatteryModels: { brand: string; model: string; voltage: number; capacityAh: number; energyKWh: number; price: number }[] = [];
    if (!isOnGrid && params.batteryType === "lithium") {
      Object.entries(lithiumBatteryBrands).forEach(([key, brand]) => {
        brand.models.forEach((m) => {
          // Include models that could meet the required storage
          if (m.energyKWh <= usableStorageKWh * 1.5 || usableStorageKWh <= m.energyKWh * 2) {
            matchingBatteryModels.push({ brand: brand.name, model: m.name, voltage: m.voltage, capacityAh: m.capacityAh, energyKWh: m.energyKWh, price: m.price });
          }
        });
      });
      // Sort by energyKWh closest to required
      matchingBatteryModels.sort((a, b) => Math.abs(a.energyKWh - usableStorageKWh) - Math.abs(b.energyKWh - usableStorageKWh));
    }

    // Find matching inverter models from all brands
    const matchingInverterModels: { brand: string; model: string; powerW: number; pvVoltageRange: string; mpptCount: number; maxPvPower: number; price: number }[] = [];
    Object.entries(inverterBrands)
      .filter(([_, brand]) => {
        if (params.systemType === "on-grid") return brand.type.includes("on-grid");
        if (params.systemType === "off-grid") return brand.type.includes("off-grid");
        return brand.type.includes("hybrid");
      })
      .forEach(([key, brand]) => {
        brand.models.forEach((m) => {
          // Include models that could handle the required power
          if (m.powerW >= recommendedInverter * 0.5 && m.powerW <= recommendedInverter * 2) {
            matchingInverterModels.push({ brand: brand.name, model: m.name, powerW: m.powerW, pvVoltageRange: m.pvVoltageRange, mpptCount: m.mpptCount, maxPvPower: m.maxPvPower, price: m.price });
          }
        });
      });
    matchingInverterModels.sort((a, b) => Math.abs(a.powerW - recommendedInverter) - Math.abs(b.powerW - recommendedInverter));

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
      requiredStorageKWh,
      usableStorageKWh,
      batteryCapacityKWh,
      totalBatteries,
      seriesBatteries,
      parallelBatteries,
      actualTotalBatteries,
      totalStoredEnergy,
      totalStoredEnergyKWh,
      inverterCapacity,
      recommendedInverter,
      chargeControllerCurrent,
      recommendedController,
      controllerType,
      batteryTypeName,
      systemTypeName,
      recommendedBatteryBrands,
      recommendedInverterBrand,
      panelCost,
      batteryCost,
      inverterCost,
      controllerCost,
      accessories,
      totalCost,
      selectedBatteryModelName,
      selectedInverterModelName,
      selectedBatterySpecs,
      selectedInverterSpecs,
      matchingBatteryModels,
      matchingInverterModels,
    });
    setShowResults(true);

    // Scroll to results
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [loads, params, selectedBatteryBrand, selectedBatteryModel, selectedInverterBrand, selectedInverterModel]);

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
                {/* System Type */}
                <div className="space-y-2">
                  <Label className="text-gray-700">نوع المنظومة</Label>
                  <Select
                    value={params.systemType}
                    onValueChange={(v) => updateParam("systemType", v as "on-grid" | "off-grid" | "hybrid")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off-grid">مستقلة (Off-Grid)</SelectItem>
                      <SelectItem value="on-grid">متصلة بالشبكة (On-Grid)</SelectItem>
                      <SelectItem value="hybrid">هجينة (Hybrid)</SelectItem>
                    </SelectContent>
                  </Select>
                  {params.systemType === "on-grid" && (
                    <p className="text-xs text-blue-600">لا حاجة للبطاريات - يتم بيع الفائض للشبكة</p>
                  )}
                  {params.systemType === "hybrid" && (
                    <p className="text-xs text-emerald-600">تعمل مع الشبكة والبطاريات معاً</p>
                  )}
                  {params.systemType === "off-grid" && (
                    <p className="text-xs text-amber-600">تعتمد كلياً على الألواح والبطاريات</p>
                  )}
                </div>

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
                      <SelectItem value="600">600 واط</SelectItem>
                      <SelectItem value="720">720 واط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Battery Type */}
                <div className="space-y-2">
                  <Label className="text-gray-700">نوع البطارية</Label>
                  <Select
                    value={params.batteryType}
                    onValueChange={(v) => updateParam("batteryType", v as "lead-acid" | "lithium")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead-acid">حمض الرصاص (Lead-Acid)</SelectItem>
                      <SelectItem value="lithium">ليثيوم (LiFePO4)</SelectItem>
                    </SelectContent>
                  </Select>
                  {params.batteryType === "lithium" && (
                    <p className="text-xs text-emerald-600">عمق تفريغ يصل إلى 95% وعمر أطول</p>
                  )}
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
                      {params.batteryType === "lithium" ? (
                        <>
                          <SelectItem value="100">100 أمبير·ساعة ({(100 * params.batteryVoltage / 1000).toFixed(1)} كيلوواط·ساعة)</SelectItem>
                          <SelectItem value="200">200 أمبير·ساعة ({(200 * params.batteryVoltage / 1000).toFixed(1)} كيلوواط·ساعة)</SelectItem>
                          <SelectItem value="280">280 أمبير·ساعة ({(280 * params.batteryVoltage / 1000).toFixed(1)} كيلوواط·ساعة)</SelectItem>
                          <SelectItem value="300">300 أمبير·ساعة ({(300 * params.batteryVoltage / 1000).toFixed(1)} كيلوواط·ساعة)</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="100">100 أمبير·ساعة ({(100 * params.batteryVoltage / 1000).toFixed(1)} كيلوواط·ساعة)</SelectItem>
                          <SelectItem value="150">150 أمبير·ساعة ({(150 * params.batteryVoltage / 1000).toFixed(1)} كيلوواط·ساعة)</SelectItem>
                          <SelectItem value="200">200 أمبير·ساعة ({(200 * params.batteryVoltage / 1000).toFixed(1)} كيلوواط·ساعة)</SelectItem>
                          <SelectItem value="250">250 أمبير·ساعة ({(250 * params.batteryVoltage / 1000).toFixed(1)} كيلوواط·ساعة)</SelectItem>
                        </>
                      )}
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
                      {params.batteryType === "lithium" && (
                        <SelectItem value="51.2">51.2 فولت (ليثيوم)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Battery Brand Selection - only for lithium and non-on-grid */}
                {params.batteryType === "lithium" && params.systemType !== "on-grid" && (
                  <div className="space-y-2">
                    <Label className="text-gray-700">ماركة البطارية</Label>
                    <Select
                      value={selectedBatteryBrand}
                      onValueChange={(v) => {
                        setSelectedBatteryBrand(v);
                        setSelectedBatteryModel("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر ماركة البطارية" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(lithiumBatteryBrands).map(([key, brand]) => (
                          <SelectItem key={key} value={key}>{brand.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Battery Model Selection */}
                {selectedBatteryBrand && params.batteryType === "lithium" && params.systemType !== "on-grid" && (
                  <div className="space-y-2">
                    <Label className="text-gray-700">موديل البطارية</Label>
                    <Select
                      value={selectedBatteryModel}
                      onValueChange={(v) => {
                        setSelectedBatteryModel(v);
                        const model = lithiumBatteryBrands[selectedBatteryBrand]?.models[parseInt(v)];
                        if (model) {
                          updateParam("batteryCapacity", model.capacityAh);
                          updateParam("batteryVoltage", model.voltage);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر موديل البطارية" />
                      </SelectTrigger>
                      <SelectContent>
                        {lithiumBatteryBrands[selectedBatteryBrand]?.models.map((model, idx) => (
                          <SelectItem key={idx} value={String(idx)}>
                            {model.name} - {model.capacityAh}Ah / {model.energyKWh}kWh (${formatUSD(model.price)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedBatteryModel && lithiumBatteryBrands[selectedBatteryBrand]?.models[parseInt(selectedBatteryModel)] && (
                      <p className="text-xs text-emerald-600">
                        {lithiumBatteryBrands[selectedBatteryBrand].name} - {lithiumBatteryBrands[selectedBatteryBrand].models[parseInt(selectedBatteryModel)].name} | {lithiumBatteryBrands[selectedBatteryBrand].notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Inverter Brand Selection */}
                <div className="space-y-2">
                  <Label className="text-gray-700">ماركة العاكس</Label>
                  <Select
                    value={selectedInverterBrand}
                    onValueChange={(v) => {
                      setSelectedInverterBrand(v);
                      setSelectedInverterModel("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر ماركة العاكس" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(inverterBrands)
                        .filter(([_, brand]) => {
                          if (params.systemType === "on-grid") return brand.type.includes("on-grid");
                          if (params.systemType === "off-grid") return brand.type.includes("off-grid");
                          return brand.type.includes("hybrid");
                        })
                        .map(([key, brand]) => (
                          <SelectItem key={key} value={key}>{brand.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Inverter Model Selection */}
                {selectedInverterBrand && (
                  <div className="space-y-2">
                    <Label className="text-gray-700">موديل العاكس</Label>
                    <Select
                      value={selectedInverterModel}
                      onValueChange={(v) => {
                        setSelectedInverterModel(v);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر موديل العاكس" />
                      </SelectTrigger>
                      <SelectContent>
                        {inverterBrands[selectedInverterBrand]?.models.map((model, idx) => (
                          <SelectItem key={idx} value={String(idx)}>
                            {model.name} - {model.powerW}W (${formatUSD(model.price)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedInverterModel && inverterBrands[selectedInverterBrand]?.models[parseInt(selectedInverterModel)] && (
                      <p className="text-xs text-blue-600">
                        {inverterBrands[selectedInverterBrand].name} | {inverterBrands[selectedInverterBrand].models[parseInt(selectedInverterModel)].pvVoltageRange} PV | {inverterBrands[selectedInverterBrand].models[parseInt(selectedInverterModel)].mpptCount} MPPT | {inverterBrands[selectedInverterBrand].notes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Sliders */}
              <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
                {/* Battery DoD */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700">
                      عمق تفريغ البطارية المسموح
                      {params.batteryType === "lithium" && (
                        <span className="mr-1 text-xs text-emerald-600">(ليثيوم)</span>
                      )}
                    </Label>
                    <Badge
                      variant="outline"
                      className={params.batteryType === "lithium" ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}
                    >
                      {params.batteryDoD}%
                    </Badge>
                  </div>
                  <Slider
                    value={[params.batteryDoD]}
                    min={params.batteryType === "lithium" ? 80 : 50}
                    max={params.batteryType === "lithium" ? 95 : 80}
                    step={5}
                    onValueChange={([v]) => updateParam("batteryDoD", v)}
                    className={params.batteryType === "lithium" ? "[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500" : "[&_[data-slot=slider-range]]:bg-amber-500 [&_[data-slot=slider-thumb]]:border-amber-500"}
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{params.batteryType === "lithium" ? "80%" : "50%"}</span>
                    <span>{params.batteryType === "lithium" ? "95%" : "80%"}</span>
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
                      <CardDescription>
                        {params.systemType === "on-grid" ? "لا حاجة للبطاريات في المنظومة المتصلة بالشبكة" : "حساب بنك البطاريات المطلوب"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {params.systemType === "on-grid" ? (
                    <div className="rounded-lg bg-blue-50 p-4 text-center">
                      <p className="text-sm text-blue-700 font-semibold">المنظومة متصلة بالشبكة</p>
                      <p className="text-xs text-blue-500 mt-1">لا حاجة لبطاريات - يتم بيع الفائض للشبكة مباشرة</p>
                    </div>
                  ) : (
                    <>
                      <ResultRow
                        label="نوع البطارية"
                        value={results.batteryTypeName}
                        unit=""
                        highlight
                      />
                      <ResultRow
                        label="سعة المخزن المطلوبة"
                        value={`${formatNumber(Math.round(results.usableStorageWh))} واط·س (${formatNumber(results.usableStorageKWh, 2)} كيلوواط·ساعة)`}
                        unit=""
                      />
                      <ResultRow
                        label="عدد البطاريات المطلوبة"
                        value={formatNumber(results.actualTotalBatteries)}
                        unit="بطارية"
                        highlight
                      />
                      <ResultRow
                        label="سعة البطارية الواحدة"
                        value={`${formatNumber(params.batteryCapacity)} أمبير·ساعة (${formatNumber(results.batteryCapacityKWh, 1)} كيلوواط·ساعة)`}
                        unit=""
                      />
                      <ResultRow
                        label="توصيل البطاريات"
                        value={`${formatNumber(results.seriesBatteries)} سلسل × ${formatNumber(results.parallelBatteries)} توازي`}
                        unit=""
                      />
                      <ResultRow
                        label="إجمالي الطاقة المخزنة"
                        value={`${formatNumber(results.totalStoredEnergy, 2)} كيلوواط·س (${formatNumber(results.totalStoredEnergyKWh, 2)} كيلوواط·ساعة)`}
                        unit=""
                      />
                      {results.selectedBatteryModelName && (
                        <>
                          <Separator className="my-2 bg-green-200" />
                          <div className="rounded-lg bg-green-50 p-3">
                            <h4 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-1">
                              <Battery className="size-4 text-green-500" />
                              البطارية المحددة
                            </h4>
                            <p className="font-semibold text-green-900 text-sm">{results.selectedBatteryModelName}</p>
                            <p className="text-xs text-green-700 mt-1">{results.selectedBatterySpecs}</p>
                          </div>
                        </>
                      )}
                    </>
                  )}
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
                  {results.selectedInverterModelName && (
                    <>
                      <Separator className="my-2 bg-blue-200" />
                      <div className="rounded-lg bg-blue-50 p-3">
                        <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-1">
                          <Zap className="size-4 text-blue-500" />
                          العاكس المحدد
                        </h4>
                        <p className="font-semibold text-blue-900 text-sm">{results.selectedInverterModelName}</p>
                        <p className="text-xs text-blue-700 mt-1">{results.selectedInverterSpecs}</p>
                      </div>
                    </>
                  )}
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

            {/* Card 7: System Type & Connection */}
              <Card className="border-amber-200/60 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-cyan-400 to-teal-500" />
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-100">
                      <Zap className="size-5 text-cyan-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">نوع المنظومة وطريقة الربط</CardTitle>
                      <CardDescription>تفاصيل طريقة توصيل المنظومة</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow
                    label="نوع المنظومة"
                    value={results.systemTypeName}
                    unit=""
                    highlight
                  />
                  {params.systemType === "on-grid" && (
                    <>
                      <ResultRow
                        label="طريقة الربط"
                        value="متصلة بالشبكة مباشرة"
                        unit=""
                      />
                      <ResultRow
                        label="بيع الفائض"
                        value="نعم - يتم بيع الطاقة الفائضة للشبكة"
                        unit=""
                      />
                      <ResultRow
                        label="الحاجة للبطاريات"
                        value="لا"
                        unit=""
                      />
                    </>
                  )}
                  {params.systemType === "off-grid" && (
                    <>
                      <ResultRow
                        label="طريقة الربط"
                        value="مستقلة تماماً عن الشبكة"
                        unit=""
                      />
                      <ResultRow
                        label="بيع الفائض"
                        value="لا - الطاقة الفائضة غير مستغلة"
                        unit=""
                      />
                      <ResultRow
                        label="الحاجة للبطاريات"
                        value="نعم - أساسية لتخزين الطاقة"
                        unit=""
                      />
                    </>
                  )}
                  {params.systemType === "hybrid" && (
                    <>
                      <ResultRow
                        label="طريقة الربط"
                        value="هجينة - شبكة + بطاريات"
                        unit=""
                      />
                      <ResultRow
                        label="بيع الفائض"
                        value="نعم - بعد شحن البطاريات"
                        unit=""
                      />
                      <ResultRow
                        label="الحاجة للبطاريات"
                        value="نعم - كاحتياطي وتخزين"
                        unit=""
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Card 8: Brand Recommendations */}
              <Card className="border-amber-200/60 shadow-sm overflow-hidden lg:col-span-2">
                <div className="h-1 bg-gradient-to-l from-rose-400 to-pink-500" />
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-rose-100">
                      <Sparkles className="size-5 text-rose-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">توصيات الشركات والمعدات</CardTitle>
                      <CardDescription>معدات موصى بها بناءً على حجم المنظومة ونوعها</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Inverter Models Table */}
                  <div>
                    <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-1">
                      <Zap className="size-4 text-blue-500" />
                      عواكس (Inverters) موصى بها
                    </h4>
                    {results.matchingInverterModels.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-blue-200">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-blue-50/80 hover:bg-blue-50/80">
                              <TableHead className="text-right font-bold text-gray-700 text-xs">الشركة</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs">الموديل</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs">القدرة</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs">مدى PV</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs">MPPT</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs">أقصى PV</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 text-xs">السعر</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.matchingInverterModels.slice(0, 8).map((m, i) => (
                              <TableRow key={i} className={m.brand.includes("POWERTEK") || m.brand.includes("Lux") ? "bg-amber-50/50" : ""}>
                                <TableCell className="text-xs font-semibold">
                                  {(m.brand.includes("POWERTEK") || m.brand.includes("Lux")) && (
                                    <Badge className="bg-amber-500 text-white text-[10px] ml-1">★</Badge>
                                  )}
                                  {m.brand}
                                </TableCell>
                                <TableCell className="text-xs">{m.model}</TableCell>
                                <TableCell className="text-xs font-semibold text-blue-700">{formatNumber(m.powerW)}W</TableCell>
                                <TableCell className="text-xs">{m.pvVoltageRange}</TableCell>
                                <TableCell className="text-xs text-center">{m.mpptCount}</TableCell>
                                <TableCell className="text-xs">{m.maxPvPower > 0 ? `${formatNumber(m.maxPvPower)}W` : "-"}</TableCell>
                                <TableCell className="text-xs font-semibold text-emerald-700">${formatUSD(m.price)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="font-semibold text-blue-800 text-sm">{results.recommendedInverterBrand}</p>
                        <div className="mt-2 space-y-1">
                          {Object.entries(inverterBrands)
                            .filter(([_, brand]) => {
                              if (params.systemType === "on-grid") return brand.type.includes("on-grid");
                              if (params.systemType === "off-grid") return brand.type.includes("off-grid");
                              return brand.type.includes("hybrid");
                            })
                            .slice(0, 4)
                            .map(([key, brand]) => (
                              <div key={key} className="flex items-start gap-2 text-xs">
                                <Badge variant="outline" className="shrink-0 border-blue-200 text-blue-700 text-[10px]">
                                  {brand.name}
                                </Badge>
                                <span className="text-gray-600">{brand.notes}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Battery Models Table */}
                  {params.systemType !== "on-grid" && params.batteryType === "lithium" && (
                    <div>
                      <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-1">
                        <Battery className="size-4 text-green-500" />
                        بطاريات ليثيوم موصى بها
                      </h4>
                      {results.matchingBatteryModels.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-green-200">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-green-50/80 hover:bg-green-50/80">
                                <TableHead className="text-right font-bold text-gray-700 text-xs">الشركة</TableHead>
                                <TableHead className="text-right font-bold text-gray-700 text-xs">الموديل</TableHead>
                                <TableHead className="text-right font-bold text-gray-700 text-xs">الجهد</TableHead>
                                <TableHead className="text-right font-bold text-gray-700 text-xs">السعة (Ah)</TableHead>
                                <TableHead className="text-right font-bold text-gray-700 text-xs">الطاقة (kWh)</TableHead>
                                <TableHead className="text-right font-bold text-gray-700 text-xs">السعر</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {results.matchingBatteryModels.slice(0, 8).map((m, i) => (
                                <TableRow key={i} className={m.brand === "DYNess" ? "bg-amber-50/50" : ""}>
                                  <TableCell className="text-xs font-semibold">
                                    {m.brand === "DYNess" && (
                                      <Badge className="bg-amber-500 text-white text-[10px] ml-1">★</Badge>
                                    )}
                                    {m.brand}
                                  </TableCell>
                                  <TableCell className="text-xs">{m.model}</TableCell>
                                  <TableCell className="text-xs">{m.voltage}V</TableCell>
                                  <TableCell className="text-xs font-semibold text-green-700">{m.capacityAh}Ah</TableCell>
                                  <TableCell className="text-xs font-semibold text-green-700">{m.energyKWh}kWh</TableCell>
                                  <TableCell className="text-xs font-semibold text-emerald-700">${formatUSD(m.price)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-green-50 p-3">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {results.recommendedBatteryBrands.map((brand, i) => (
                              <Badge key={i} variant="outline" className="border-green-200 text-green-700">
                                {brand}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-2 space-y-1">
                            {Object.entries(lithiumBatteryBrands)
                              .slice(0, 5)
                              .map(([key, brand]) => (
                                <div key={key} className="flex items-start gap-2 text-xs">
                                  <Badge variant="outline" className="shrink-0 border-green-200 text-green-700 text-[10px]">
                                    {brand.name}
                                  </Badge>
                                  <span className="text-gray-600">{brand.notes}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lead-acid battery recommendation */}
                  {params.systemType !== "on-grid" && params.batteryType === "lead-acid" && (
                    <div>
                      <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <Battery className="size-4 text-green-500" />
                        بطاريات حمض الرصاص موصى بها
                      </h4>
                      <div className="rounded-lg bg-green-50 p-3">
                        <div className="flex flex-wrap gap-1">
                          {results.recommendedBatteryBrands.map((brand, i) => (
                            <Badge key={i} variant="outline" className="border-green-200 text-green-700">
                              {brand}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Charge Controller Note */}
                  {params.systemType !== "on-grid" && (
                    <div className="rounded-lg bg-purple-50 p-3">
                      <h4 className="font-bold text-gray-700 text-xs mb-1 flex items-center gap-1">
                        <Gauge className="size-3 text-purple-500" />
                        منظم الشحن الموصى به
                      </h4>
                      <p className="text-xs text-gray-600">
                        {results.controllerType === "MPPT"
                          ? "يُنصح بمنظم شحن MPPT لكفاءة أعلى في تحويل الطاقة، خاصة مع الألواح عالية القدرة."
                          : "يمكن استخدام منظم PWM أو MPPT حسب الميزانية المتاحة."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

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
