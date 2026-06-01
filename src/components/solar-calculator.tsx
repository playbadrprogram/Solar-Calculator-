"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  Briefcase,
  FileText,
  Download,
  Share2,
  Printer,
  ChevronDown,
  ChevronUp,
  Cable,
  AlertTriangle,
  Smartphone,
  Monitor,
  Moon,
  Globe,
  Save,
  FolderOpen,
  Upload,
  Shield,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  PiggyBank,
  Leaf,
  Fuel,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import helper modules
import {
  yemenGovernorates,
  monthNamesAr,
  monthNamesEn,
  translations,
  type SolarRadiationData,
} from "@/lib/solar-data";
import {
  calculateAllCables,
  calculateBreakers,
  calculateGrounding,
  calculateEconomics,
  calculateFinancing,
  generateBOM,
  saveProject,
  loadAllProjects,
  deleteProject,
  exportProjects,
  importProjects,
  type SystemCableResults,
  type BreakerResult,
  type GroundingResult,
  type EconomicResults,
  type FinancingResult,
  type BOMItem,
  type SavedProject,
} from "@/lib/solar-calculations";

// ============= Types =============
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
  matchingInverterModels: { brand: string; model: string; powerW: number; pvVoltageRange: string; mpptCount: number; maxPvPower: number; maxPvCurrentPerMPPT: number; price: number }[];
  panelVoc: number;
  panelIsc: number;
  panelVmp: number;
  panelImp: number;
  panelsPerString: number;
  totalStrings: number;
  stringsPerMPPT: number;
  stringVoc: number;
  stringVmp: number;
  stringIsc: number;
  stringImp: number;
  stringPowerW: number;
  mpptMinV: number;
  mpptMaxV: number;
  mpptCount: number;
  hasMpptData: boolean;
  maxPvCurrentPerMPPT: number;
}

// ============= Constants =============
const panelSpecsByWattage: Record<number, { voc: number; isc: number; vmp: number; imp: number }> = {
  100: { voc: 22, isc: 6, vmp: 18, imp: 5.5 },
  200: { voc: 33, isc: 9, vmp: 27, imp: 7.4 },
  300: { voc: 40, isc: 10, vmp: 33, imp: 9.1 },
  400: { voc: 45, isc: 11, vmp: 37, imp: 10.8 },
  550: { voc: 49, isc: 14, vmp: 41, imp: 13.4 },
  600: { voc: 50, isc: 14.5, vmp: 42, imp: 14.3 },
  720: { voc: 52, isc: 15, vmp: 43, imp: 16.7 },
};

function parsePvVoltageRange(range: string): { minV: number; maxV: number } {
  if (!range || range === "-") return { minV: 0, maxV: 0 };
  const match = range.match(/(\d+)-(\d+)V/);
  if (match) return { minV: parseInt(match[1]), maxV: parseInt(match[2]) };
  return { minV: 0, maxV: 0 };
}

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

const inverterBrands: Record<string, {
  name: string;
  models: { name: string; powerW: number; pvVoltageRange: string; mpptCount: number; maxPvPower: number; maxPvCurrentPerMPPT: number; batteryVoltage: string; notes: string; price: number }[];
  type: string;
  notes: string
}> = {
  luxpower: {
    name: "Lux Power / POWERTEK",
    models: [
      { name: "SNA-EU 5000", powerW: 5000, pvVoltageRange: "120-440V", mpptCount: 2, maxPvPower: 7500, maxPvCurrentPerMPPT: 18, batteryVoltage: "38.4-60V", notes: "منظومة منزلية صغيرة", price: 800 },
      { name: "SNA-EU 8000", powerW: 8000, pvVoltageRange: "120-440V", mpptCount: 2, maxPvPower: 12000, maxPvCurrentPerMPPT: 25, batteryVoltage: "38.4-60V", notes: "منظومة منزلية متوسطة", price: 1200 },
      { name: "SNA-EU 10000", powerW: 10000, pvVoltageRange: "120-440V", mpptCount: 2, maxPvPower: 15000, maxPvCurrentPerMPPT: 27, batteryVoltage: "38.4-60V", notes: "منظومة منزلية كبيرة", price: 1500 },
      { name: "SNA-EU 12000", powerW: 12000, pvVoltageRange: "120-440V", mpptCount: 2, maxPvPower: 18000, maxPvCurrentPerMPPT: 30, batteryVoltage: "38.4-60V", notes: "منظومة تجارية صغيرة", price: 1800 },
      { name: "SNA-EU 14000", powerW: 14000, pvVoltageRange: "120-440V", mpptCount: 2, maxPvPower: 24000, maxPvCurrentPerMPPT: 35, batteryVoltage: "38.4-60V", notes: "منظومة تجارية متوسطة", price: 2200 },
    ],
    type: "hybrid/off-grid",
    notes: "خيار شائع في اليمن - ضمان 5 سنوات"
  },
  growatt: {
    name: "Growatt",
    models: [
      { name: "SPF 5000ES", powerW: 5000, pvVoltageRange: "120-450V", mpptCount: 2, maxPvPower: 6500, maxPvCurrentPerMPPT: 18, batteryVoltage: "40-60V", notes: "منزلي اقتصادي", price: 650 },
      { name: "SPF 8000ES", powerW: 8000, pvVoltageRange: "120-450V", mpptCount: 2, maxPvPower: 10400, maxPvCurrentPerMPPT: 25, batteryVoltage: "40-60V", notes: "منزلي متوسط", price: 1000 },
      { name: "SPH 10000TL3", powerW: 10000, pvVoltageRange: "100-550V", mpptCount: 2, maxPvPower: 15000, maxPvCurrentPerMPPT: 25, batteryVoltage: "120-480V", notes: "هجين ثلاثي الأطوار", price: 1400 },
    ],
    type: "on-grid/hybrid/off-grid",
    notes: "أفضل قيمة مقابل السعر"
  },
  deye: {
    name: "Deye",
    models: [
      { name: "SUN-5K-SG04LP3", powerW: 5000, pvVoltageRange: "120-500V", mpptCount: 2, maxPvPower: 6500, maxPvCurrentPerMPPT: 18, batteryVoltage: "40-60V", notes: "هجين أحادي الطور", price: 900 },
      { name: "SUN-8K-SG04LP3", powerW: 8000, pvVoltageRange: "120-500V", mpptCount: 2, maxPvPower: 10400, maxPvCurrentPerMPPT: 25, batteryVoltage: "40-60V", notes: "هجين أحادي الطور", price: 1300 },
      { name: "SUN-12K-SG04LP3", powerW: 12000, pvVoltageRange: "200-600V", mpptCount: 2, maxPvPower: 15600, maxPvCurrentPerMPPT: 30, batteryVoltage: "120-480V", notes: "هجين ثلاثي الأطوار", price: 1900 },
    ],
    type: "hybrid/on-grid",
    notes: "خيار شائع في الشرق الأوسط"
  },
  sma: {
    name: "SMA",
    models: [
      { name: "Sunny Island 6048", powerW: 6000, pvVoltageRange: "-", mpptCount: 0, maxPvPower: 0, maxPvCurrentPerMPPT: 0, batteryVoltage: "42-60V", notes: "عاكس بطاريات احترافي", price: 2500 },
      { name: "Sunny Boy Storage", powerW: 5000, pvVoltageRange: "-", mpptCount: 0, maxPvPower: 0, maxPvCurrentPerMPPT: 0, batteryVoltage: "150-500V", notes: "نظام تخزين متكامل", price: 2200 },
    ],
    type: "on-grid/hybrid/off-grid",
    notes: "ألماني - موثوقية عالية"
  },
  victron_inv: {
    name: "Victron Energy",
    models: [
      { name: "MultiPlus-II 48/5000", powerW: 5000, pvVoltageRange: "-", mpptCount: 0, maxPvPower: 0, maxPvCurrentPerMPPT: 0, batteryVoltage: "38-66V", notes: "نظام متكامل مع شاحن", price: 1800 },
      { name: "MultiPlus-II 48/8000", powerW: 8000, pvVoltageRange: "-", mpptCount: 0, maxPvPower: 0, maxPvCurrentPerMPPT: 0, batteryVoltage: "38-66V", notes: "نظام متكامل مع شاحن", price: 2600 },
      { name: "Quattro 48/10000", powerW: 10000, pvVoltageRange: "-", mpptCount: 0, maxPvPower: 0, maxPvCurrentPerMPPT: 0, batteryVoltage: "38-66V", notes: "نظام مزدوج الدخول", price: 3200 },
    ],
    type: "off-grid/hybrid",
    notes: "خيار احترافي للمنظومات المستقلة"
  },
  huawei: {
    name: "Huawei",
    models: [
      { name: "SUN2000-5KTL", powerW: 5000, pvVoltageRange: "100-560V", mpptCount: 2, maxPvPower: 7500, maxPvCurrentPerMPPT: 25, batteryVoltage: "85-600V", notes: "هجين ذكي مع WiFi", price: 950 },
      { name: "SUN2000-10KTL", powerW: 10000, pvVoltageRange: "200-1000V", mpptCount: 2, maxPvPower: 15000, maxPvCurrentPerMPPT: 25, batteryVoltage: "85-600V", notes: "هجين ثلاثي الأطوار", price: 1800 },
    ],
    type: "on-grid/hybrid",
    notes: "كفاءة عالية وضمان طويل"
  },
  sungrow: {
    name: "Sungrow",
    models: [
      { name: "SH5.0RT", powerW: 5000, pvVoltageRange: "150-800V", mpptCount: 2, maxPvPower: 7500, maxPvCurrentPerMPPT: 25, batteryVoltage: "150-600V", notes: "هجين أحادي الطور", price: 900 },
      { name: "SH10RT", powerW: 10000, pvVoltageRange: "200-1000V", mpptCount: 2, maxPvPower: 15000, maxPvCurrentPerMPPT: 25, batteryVoltage: "150-600V", notes: "هجين ثلاثي الأطوار", price: 1700 },
    ],
    type: "on-grid/hybrid",
    notes: "صيني رائد - كفاءة عالية"
  },
};

// ============= Formatters =============
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

// ============= Main Component =============
export default function SolarCalculator() {
  // --- Core State ---
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
  const [panelSpecs, setPanelSpecs] = useState<{ voc: number; isc: number; vmp: number; imp: number }>(
    panelSpecsByWattage[550] || { voc: 49, isc: 14, vmp: 41, imp: 13.4 }
  );
  const [projectInfo, setProjectInfo] = useState({
    projectName: "",
    clientName: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    engineerName: "",
    projectNumber: "",
    notes: "",
  });
  const [projectInfoExpanded, setProjectInfoExpanded] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // --- New Feature State ---
  const [activeTab, setActiveTab] = useState("calculator");
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("");
  const [cableLengths, setCableLengths] = useState({
    pvString: 10,
    pvMain: 15,
    battery: 3,
    acOutput: 10,
    acMain: 20,
  });
  const [financing, setFinancing] = useState({
    loanAmount: 0,
    interestRate: 8,
    loanTerm: 5,
  });
  const [savedProjectsList, setSavedProjectsList] = useState<SavedProject[]>([]);
  const [projectNameToSave, setProjectNameToSave] = useState("");

  // --- PWA State ---
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);

  // --- Translation Helper ---
  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || key;
  }, [language]);

  // --- Dark Mode Effect ---
  useEffect(() => {
    const saved = localStorage.getItem("solar-calc-dark-mode");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("solar-calc-dark-mode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // --- Load Saved Projects ---
  useEffect(() => {
    setSavedProjectsList(loadAllProjects());
  }, []);

  // --- PWA Effect ---
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        const promptEvent = deferredPrompt as Event & {
          prompt: () => Promise<void>;
          userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
        };
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setShowInstallBanner(false);
        }
      } catch {
        // fallback to manual instructions
      }
      setDeferredPrompt(null);
    } else {
      // No deferred prompt available - show manual install instructions
      setShowInstallInstructions(true);
    }
  };

  // --- Computed: Selected Governorate Data ---
  const governorateData: SolarRadiationData | null = selectedGovernorate
    ? yemenGovernorates.find(g => g.name === selectedGovernorate || g.nameEn === selectedGovernorate) || null
    : null;

  // --- Computed: Selected Inverter Model ---
  const selectedInverterModelObj = (selectedInverterBrand && selectedInverterModel)
    ? inverterBrands[selectedInverterBrand]?.models[parseInt(selectedInverterModel)]
    : null;

  // --- Load Handlers ---
  const handleLoadTypeChange = useCallback((type: "residential" | "industrial") => {
    setLoadType(type);
    setLoads(type === "residential" ? [...residentialDefaults] : [...industrialDefaults]);
    setResults(null);
    setShowResults(false);
  }, []);

  const updateLoad = useCallback((id: string, field: keyof LoadEntry, value: string | number) => {
    setLoads((prev) =>
      prev.map((load) => {
        if (load.id !== id) return load;
        const numValue = typeof value === "string" ? (field === "name" ? value : Number(value) || 0) : value;
        return { ...load, [field]: numValue };
      })
    );
  }, []);

  const addLoad = useCallback(() => {
    setLoads((prev) => [
      ...prev,
      { id: generateId(), name: "", quantity: 1, power: 0, hours: 1 },
    ]);
  }, []);

  const removeLoad = useCallback((id: string) => {
    setLoads((prev) => prev.filter((load) => load.id !== id));
  }, []);

  // --- System Parameter Update ---
  const updateParam = useCallback(<K extends keyof SystemParams>(key: K, value: SystemParams[K]) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "batteryType") {
        if (value === "lithium") {
          next.batteryDoD = 90;
          if (next.batteryCapacity < 100) next.batteryCapacity = 100;
        } else {
          next.batteryDoD = 70;
        }
      }
      if (key === "systemType" && value === "on-grid") {
        next.backupDays = 0;
      } else if (key === "systemType" && value !== "on-grid" && next.backupDays === 0) {
        next.backupDays = 2;
      }
      if (key === "panelWattage") {
        const specs = panelSpecsByWattage[Number(value)];
        if (specs) {
          setPanelSpecs(specs);
        }
      }
      return next;
    });
  }, []);

  // --- Main Calculate ---
  const calculate = useCallback(() => {
    const totalPeakLoad = loads.reduce((sum, l) => sum + l.quantity * l.power, 0);
    const totalDailyConsumptionWh = loads.reduce((sum, l) => sum + l.quantity * l.power * l.hours, 0);
    const totalDailyConsumptionKWh = totalDailyConsumptionWh / 1000;
    const totalMonthlyConsumptionKWh = totalDailyConsumptionKWh * 30;

    const requiredSolarCapacity = totalDailyConsumptionWh / (params.sunshineHours * (params.systemEfficiency / 100));
    const numberOfPanels = Math.ceil(requiredSolarCapacity / params.panelWattage);
    const panelArea = numberOfPanels * 2.2;

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

    const inverterCapacity = totalPeakLoad;
    const recommendedInverter = Math.ceil((inverterCapacity * 1.25) / 500) * 500;

    const chargeControllerCurrent = isOnGrid ? 0 : Math.ceil((numberOfPanels * params.panelWattage) / params.systemVoltage);
    const recommendedController = isOnGrid ? 0 : Math.ceil((chargeControllerCurrent * 1.25) / 10) * 10;
    const controllerType = isOnGrid ? "-" : (recommendedController > 30 ? "MPPT" : "PWM/MPPT");

    const systemTypeNameMap: Record<string, string> = {
      "on-grid": language === "ar" ? "متصلة بالشبكة (On-Grid)" : "Grid-Tied (On-Grid)",
      "off-grid": language === "ar" ? "مستقلة (Off-Grid)" : "Off-Grid",
      "hybrid": language === "ar" ? "هجينة (Hybrid)" : "Hybrid",
    };
    const systemTypeName = systemTypeNameMap[params.systemType];

    const recommendedBatteryBrands: string[] = [];
    if (!isOnGrid) {
      if (params.batteryType === "lithium") {
        const reqKWh = usableStorageKWh;
        if (reqKWh <= 15) recommendedBatteryBrands.push("Pylontech", "SolaX", "MPP Solar");
        else if (reqKWh <= 50) recommendedBatteryBrands.push("Pylontech", "BYD", "SolaX", "Victron Energy");
        else recommendedBatteryBrands.push("BYD", "CATL", "Pylontech", "Sungrow");
      } else {
        recommendedBatteryBrands.push("Trojan", "Rolls", "Victron Energy");
      }
    }

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

    const panelCost = numberOfPanels * params.panelWattage * 0.4;
    const costPerAh = params.batteryType === "lithium" ? 4.5 : 1.5;
    const selectedBatteryModelObj = (selectedBatteryBrand && selectedBatteryModel && params.batteryType === "lithium")
      ? lithiumBatteryBrands[selectedBatteryBrand]?.models[parseInt(selectedBatteryModel)]
      : null;
    const batteryCost = isOnGrid ? 0 : selectedBatteryModelObj
      ? actualTotalBatteries * selectedBatteryModelObj.price
      : actualTotalBatteries * params.batteryCapacity * costPerAh;
    const selInvModelObj = (selectedInverterBrand && selectedInverterModel)
      ? inverterBrands[selectedInverterBrand]?.models[parseInt(selectedInverterModel)]
      : null;
    const inverterCost = selInvModelObj ? selInvModelObj.price : recommendedInverter * 0.2;
    const controllerCost = isOnGrid ? 0 : recommendedController * 15;
    const accessories = 0.15 * (panelCost + batteryCost + inverterCost + controllerCost);
    const totalCost = panelCost + batteryCost + inverterCost + controllerCost + accessories;

    const batteryTypeName = isOnGrid ? "-" : (params.batteryType === "lithium" ? (language === "ar" ? "ليثيوم" : "Lithium") : (language === "ar" ? "حمض الرصاص" : "Lead-Acid"));

    const selectedBatteryModelName = selectedBatteryModelObj
      ? `${lithiumBatteryBrands[selectedBatteryBrand!].name} ${selectedBatteryModelObj.name} (${selectedBatteryModelObj.capacityAh}Ah / ${selectedBatteryModelObj.energyKWh}kWh)`
      : "";
    const selectedInverterModelName = selInvModelObj
      ? `${inverterBrands[selectedInverterBrand!].name} ${selInvModelObj.name} (${selInvModelObj.powerW}W)`
      : "";
    const selectedBatterySpecs = selectedBatteryModelObj
      ? `${selectedBatteryModelObj.voltage}V | ${selectedBatteryModelObj.capacityAh}Ah | ${selectedBatteryModelObj.energyKWh}kWh | $${formatUSD(selectedBatteryModelObj.price)}`
      : "";
    const selectedInverterSpecs = selInvModelObj
      ? `${selInvModelObj.powerW}W | PV: ${selInvModelObj.pvVoltageRange} | ${selInvModelObj.mpptCount} MPPT | Max PV: ${selInvModelObj.maxPvPower}W | Battery: ${selInvModelObj.batteryVoltage} | $${formatUSD(selInvModelObj.price)}`
      : "";

    const matchingBatteryModels: { brand: string; model: string; voltage: number; capacityAh: number; energyKWh: number; price: number }[] = [];
    if (!isOnGrid && params.batteryType === "lithium") {
      Object.entries(lithiumBatteryBrands).forEach(([, brand]) => {
        brand.models.forEach((m) => {
          if (m.energyKWh <= usableStorageKWh * 1.5 || usableStorageKWh <= m.energyKWh * 2) {
            matchingBatteryModels.push({ brand: brand.name, model: m.name, voltage: m.voltage, capacityAh: m.capacityAh, energyKWh: m.energyKWh, price: m.price });
          }
        });
      });
      matchingBatteryModels.sort((a, b) => Math.abs(a.energyKWh - usableStorageKWh) - Math.abs(b.energyKWh - usableStorageKWh));
    }

    const matchingInverterModels: { brand: string; model: string; powerW: number; pvVoltageRange: string; mpptCount: number; maxPvPower: number; maxPvCurrentPerMPPT: number; price: number }[] = [];
    Object.entries(inverterBrands)
      .filter(([, brand]) => {
        if (params.systemType === "on-grid") return brand.type.includes("on-grid");
        if (params.systemType === "off-grid") return brand.type.includes("off-grid");
        return brand.type.includes("hybrid");
      })
      .forEach(([, brand]) => {
        brand.models.forEach((m) => {
          if (m.powerW >= recommendedInverter * 0.5 && m.powerW <= recommendedInverter * 2) {
            matchingInverterModels.push({ brand: brand.name, model: m.name, powerW: m.powerW, pvVoltageRange: m.pvVoltageRange, mpptCount: m.mpptCount, maxPvPower: m.maxPvPower, maxPvCurrentPerMPPT: m.maxPvCurrentPerMPPT, price: m.price });
          }
        });
      });
    matchingInverterModels.sort((a, b) => Math.abs(a.powerW - recommendedInverter) - Math.abs(b.powerW - recommendedInverter));

    // MPPT String Calculation
    let panelVoc = panelSpecs.voc;
    let panelIsc = panelSpecs.isc;
    let panelVmp = panelSpecs.vmp;
    let panelImp = panelSpecs.imp;
    let panelsPerString = 0;
    let totalStrings = 0;
    let stringsPerMPPT = 0;
    let stringVoc = 0;
    let stringVmp = 0;
    let stringIsc = panelIsc;
    let stringImp = panelImp;
    let stringPowerW = 0;
    let mpptMinV = 0;
    let mpptMaxV = 0;
    let mpptCount = 0;
    let hasMpptData = false;

    if (selInvModelObj && selInvModelObj.mpptCount > 0) {
      hasMpptData = true;
      const pvRange = parsePvVoltageRange(selInvModelObj.pvVoltageRange);
      mpptMinV = pvRange.minV;
      mpptMaxV = pvRange.maxV;
      mpptCount = selInvModelObj.mpptCount;

      if (mpptMaxV > 0 && panelVoc > 0) {
        const maxPanelsPerString = Math.floor(mpptMaxV / (panelVoc * 1.15));
        const minPanelsPerString = panelVmp > 0 ? Math.ceil(mpptMinV / panelVmp) : 1;
        let optimalPanelsPerString = panelVmp > 0 ? Math.floor(mpptMaxV / (panelVmp * 1.1)) : 1;
        if (optimalPanelsPerString < minPanelsPerString) optimalPanelsPerString = minPanelsPerString;
        if (optimalPanelsPerString > maxPanelsPerString) optimalPanelsPerString = maxPanelsPerString;
        if (optimalPanelsPerString < 1) optimalPanelsPerString = 1;

        panelsPerString = optimalPanelsPerString;
        totalStrings = Math.ceil(numberOfPanels / panelsPerString);
        stringsPerMPPT = Math.ceil(totalStrings / mpptCount);

        const maxCurrentPerMPPT = selInvModelObj.maxPvCurrentPerMPPT || 25;
        const actualStringsPerMPPT = Math.min(stringsPerMPPT, Math.floor(maxCurrentPerMPPT / panelIsc));
        stringsPerMPPT = actualStringsPerMPPT;

        const actualTotalStrings = Math.ceil(numberOfPanels / panelsPerString);

        stringVoc = panelsPerString * panelVoc;
        stringVmp = panelsPerString * panelVmp;
        stringIsc = panelIsc;
        stringImp = panelImp;
        stringPowerW = panelsPerString * params.panelWattage;
        totalStrings = actualTotalStrings;
      }
    }

    const maxPvCurrentPerMPPT = selInvModelObj?.maxPvCurrentPerMPPT || 0;

    setResults({
      totalPeakLoad, totalDailyConsumptionWh, totalDailyConsumptionKWh, totalMonthlyConsumptionKWh,
      requiredSolarCapacity, numberOfPanels, panelArea,
      requiredStorageWh, usableStorageWh, requiredStorageKWh, usableStorageKWh,
      batteryCapacityKWh, totalBatteries, seriesBatteries, parallelBatteries,
      actualTotalBatteries, totalStoredEnergy, totalStoredEnergyKWh,
      inverterCapacity, recommendedInverter,
      chargeControllerCurrent, recommendedController, controllerType,
      batteryTypeName, systemTypeName, recommendedBatteryBrands, recommendedInverterBrand,
      panelCost, batteryCost, inverterCost, controllerCost, accessories, totalCost,
      selectedBatteryModelName, selectedInverterModelName, selectedBatterySpecs, selectedInverterSpecs,
      matchingBatteryModels, matchingInverterModels,
      panelVoc, panelIsc, panelVmp, panelImp,
      panelsPerString, totalStrings, stringsPerMPPT,
      stringVoc, stringVmp, stringIsc, stringImp, stringPowerW,
      mpptMinV, mpptMaxV, mpptCount, hasMpptData, maxPvCurrentPerMPPT,
    });

    // Update financing loan amount default
    setFinancing(prev => ({ ...prev, loanAmount: Math.round(totalCost) }));

    setShowResults(true);
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [loads, params, selectedBatteryBrand, selectedBatteryModel, selectedInverterBrand, selectedInverterModel, panelSpecs, language]);

  // --- Computed Totals ---
  const totalPeakLoad = loads.reduce((sum, l) => sum + l.quantity * l.power, 0);
  const totalDailyEnergy = loads.reduce((sum, l) => sum + l.quantity * l.power * l.hours, 0);

  // --- Cable/Breaker/Grounding/Economics/BOM computed results ---
  const cableResults: SystemCableResults | null = results ? calculateAllCables(
    panelSpecs.imp, panelSpecs.isc,
    results.totalStrings || 1, results.panelsPerString || 1,
    panelSpecs.vmp, results.stringVmp || panelSpecs.vmp,
    params.systemVoltage,
    results.actualTotalBatteries > 0 ? (results.recommendedInverter / params.systemVoltage) : 0,
    results.recommendedInverter,
    cableLengths.pvString, cableLengths.pvMain, cableLengths.battery,
    cableLengths.acOutput, cableLengths.acMain,
  ) : null;

  const breakerResults: BreakerResult[] = results ? calculateBreakers(
    panelSpecs.isc,
    results.totalStrings || 1,
    results.actualTotalBatteries > 0 ? (results.recommendedInverter / params.systemVoltage) : 0,
    results.recommendedInverter,
  ) : [];

  const groundingResult: GroundingResult | null = results ? calculateGrounding(params.systemVoltage, results.totalPeakLoad) : null;

  const economicResults: EconomicResults | null = results ? calculateEconomics(
    results.totalCost, results.numberOfPanels, params.panelWattage,
    params.sunshineHours, params.systemEfficiency, params.inverterEfficiency,
    results.totalDailyConsumptionKWh, governorateData,
  ) : null;

  const financingResult: FinancingResult | null = financing.loanAmount > 0 ? calculateFinancing(
    financing.loanAmount, financing.interestRate, financing.loanTerm,
  ) : null;

  const bomItems: BOMItem[] = results ? generateBOM(
    results.numberOfPanels, params.panelWattage,
    results.actualTotalBatteries, params.batteryCapacity, params.batteryVoltage,
    params.batteryType, results.recommendedInverter,
    results.recommendedController, results.controllerType,
    cableResults, breakerResults, groundingResult,
    cableLengths.pvString, cableLengths.pvMain, cableLengths.battery,
    cableLengths.acOutput, cableLengths.acMain,
    results.totalStrings || 1, results.panelsPerString || 1,
    results.selectedBatteryModelName, results.selectedInverterModelName,
    results.batteryCost, results.inverterCost, results.panelCost, results.controllerCost,
  ) : [];

  // --- PDF Export ---
  const exportToPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [10, 10, 10, 10] as number[],
        filename: `solar-report-${projectInfo.projectName || "untitled"}-${projectInfo.date}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
      };
      await html2pdf().set(opt).from(element).save();
    } catch {
      window.print();
    }
  };

  const shareReport = async () => {
    const summary = `${language === "ar" ? "تقرير المنظومة الشمسية" : "Solar System Report"}${projectInfo.projectName ? ` - ${projectInfo.projectName}` : ""}
${results ? `${language === "ar" ? "الاستهلاك" : "Consumption"}: ${formatNumber(results.totalDailyConsumptionKWh, 2)} kWh
${language === "ar" ? "الألواح" : "Panels"}: ${formatNumber(results.numberOfPanels)}
${language === "ar" ? "التكلفة" : "Cost"}: $${formatUSD(Math.round(results.totalCost))}` : ""}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Solar Report - ${projectInfo.projectName || "untitled"}`, text: summary }); }
      catch { await navigator.clipboard.writeText(summary); }
    } else {
      await navigator.clipboard.writeText(summary);
    }
  };

  const printReport = () => { window.print(); };

  // --- BOM CSV Export ---
  const exportBOMCSV = () => {
    if (bomItems.length === 0) return;
    const headers = ["#", "Description", "Qty", "Unit", "Unit Price ($)", "Total Price ($)", "Notes"];
    const rows = bomItems.map(item => [
      item.id, `"${language === "en" ? item.descriptionEn : item.description}"`,
      item.quantity, item.unit, item.unitPrice, item.totalPrice, `"${item.notes}"`,
    ]);
    const bomTotal = bomItems.reduce((sum, item) => sum + item.totalPrice, 0);
    rows.push(["", "TOTAL", "", "", "", bomTotal, ""]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BOM-${projectInfo.projectName || "solar"}-${projectInfo.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Save/Load Projects ---
  const handleSaveProject = () => {
    if (!projectNameToSave.trim()) return;
    const project: SavedProject = {
      id: Date.now().toString(),
      name: projectNameToSave,
      date: new Date().toISOString().split("T")[0],
      loads: [...loads],
      params: { ...params },
      panelSpecs: { ...panelSpecs },
      projectInfo: { ...projectInfo },
      selectedGovernorate,
      selectedBatteryBrand,
      selectedBatteryModel,
      selectedInverterBrand,
      selectedInverterModel,
      cableLengths: { ...cableLengths },
    };
    saveProject(project);
    setSavedProjectsList(loadAllProjects());
    setProjectNameToSave("");
  };

  const handleLoadProject = (project: SavedProject) => {
    setLoads(project.loads);
    setParams(project.params as SystemParams);
    setPanelSpecs(project.panelSpecs);
    setProjectInfo(project.projectInfo);
    setSelectedGovernorate(project.selectedGovernorate || "");
    setSelectedBatteryBrand(project.selectedBatteryBrand || "");
    setSelectedBatteryModel(project.selectedBatteryModel || "");
    setSelectedInverterBrand(project.selectedInverterBrand || "");
    setSelectedInverterModel(project.selectedInverterModel || "");
    if (project.cableLengths) setCableLengths(project.cableLengths);
    setResults(null);
    setShowResults(false);
    setActiveTab("calculator");
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    setSavedProjectsList(loadAllProjects());
  };

  const handleExportProjects = () => {
    const json = exportProjects();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "solar-projects.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProjects = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const success = importProjects(text);
        if (success) {
          setSavedProjectsList(loadAllProjects());
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // --- Auto-fill Governorate ---
  const handleAutoFillGovernorate = () => {
    if (governorateData) {
      setParams(prev => ({ ...prev, sunshineHours: governorateData.peakSunHours }));
    }
  };

  // ============= RENDER =============
  const dir = language === "ar" ? "rtl" : "ltr";
  const bgColor = darkMode ? "bg-gray-900" : "bg-gradient-to-b from-amber-50 via-orange-50/30 to-white";
  const textColor = darkMode ? "text-gray-100" : "text-gray-800";
  const cardBg = darkMode ? "border-gray-700 bg-gray-800" : "border-amber-200/60";
  const cardHeaderText = darkMode ? "text-gray-100" : "text-gray-800";
  const labelColor = darkMode ? "text-gray-300" : "text-gray-700";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";
  const inputClass = darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "";

  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`} dir={dir}>
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          header, footer, .no-print, button, .print-hide { display: none !important; }
          #report-content { display: block !important; padding: 0 !important; margin: 0 !important; }
          body { background: white !important; }
          .print-break { page-break-before: always; }
          table { page-break-inside: avoid; }
          .card-print { border: 1px solid #ddd !important; box-shadow: none !important; }
        }
      `}} />

      {/* ========== HEADER ========== */}
      <header className="relative overflow-hidden bg-gradient-to-l from-amber-500 via-orange-500 to-amber-600 print-hide">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:py-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="absolute -inset-3 animate-pulse rounded-full bg-yellow-300/30" />
              <div className="relative flex size-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm sm:size-18">
                <Sun className="size-8 text-yellow-100 animate-spin-slow sm:size-10" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-4xl md:text-5xl">
                {t("app.title")}
              </h1>
              <p className="mt-1 text-sm text-amber-100 sm:text-lg">
                {t("app.subtitle")}
              </p>
            </div>
            <div className="flex gap-3 items-center flex-wrap justify-center">
              <Badge className="border-amber-300/30 bg-white/10 text-amber-100 backdrop-blur-sm">
                <Sparkles className="size-3" />
                {t("badge.accurate")}
              </Badge>
              <Badge className="border-amber-300/30 bg-white/10 text-amber-100 backdrop-blur-sm">
                <Zap className="size-3" />
                {t("badge.instant")}
              </Badge>
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="text-amber-100 hover:bg-white/20 hover:text-white gap-1"
              >
                {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {darkMode ? t("light.toggle") : t("dark.toggle")}
              </Button>
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
                className="text-amber-100 hover:bg-white/20 hover:text-white gap-1"
              >
                <Globe className="size-4" />
                {language === "ar" ? "EN" : "عربي"}
              </Button>
              {/* Install App Button - always visible */}
              {!isInstalled && (
                <Button
                  size="sm"
                  onClick={handleInstallApp}
                  className="gap-1 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30"
                >
                  <Download className="size-4" />
                  <span className="hidden sm:inline">{language === "ar" ? "تثبيت التطبيق" : "Install App"}</span>
                  <span className="sm:hidden">{language === "ar" ? "تثبيت" : "Install"}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l from-yellow-300 via-amber-300 to-orange-400" />
      </header>

      {/* PWA Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="bg-gradient-to-l from-amber-500 to-orange-500 text-white print-hide">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shrink-0">
                  <Smartphone className="size-5 text-white" />
                </div>
                <div className="text-center sm:text-right">
                  <p className="font-bold text-sm">{language === "ar" ? "ثبّت التطبيق على جهازك" : "Install the app"}</p>
                  <p className="text-xs text-amber-100">{language === "ar" ? "استخدم حاسبة المنظومة الشمسية كتطبيق مستقل" : "Use as a standalone app"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleInstallApp} size="sm" className="gap-2 bg-white text-amber-700 hover:bg-amber-50 font-bold">
                  <Monitor className="size-4" />
                  {language === "ar" ? "تثبيت" : "Install"}
                </Button>
                <Button onClick={() => setShowInstallBanner(false)} variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                  {language === "ar" ? "لاحقاً" : "Later"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Install Instructions Modal */}
      {showInstallInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print-hide" onClick={() => setShowInstallInstructions(false)}>
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 shrink-0">
                <Smartphone className="size-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{language === "ar" ? "تثبيت التطبيق" : "Install App"}</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {language === "ar" ? "اتبع الخطوات التالية حسب متصفحك" : "Follow these steps based on your browser"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Android Chrome */}
              <div className={`rounded-xl p-4 ${darkMode ? "bg-gray-700" : "bg-amber-50"}`}>
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <span className="text-lg">🤖</span> {language === "ar" ? "أندرويد - كروم" : "Android - Chrome"}
                </h4>
                <ol className={`text-sm space-y-1 list-decimal list-inside ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <li>{language === "ar" ? "اضغط على أيقونة ⋮ (القائمة) أعلى المتصفح" : "Tap the ⋮ menu icon in browser toolbar"}</li>
                  <li>{language === "ar" ? "اختر \"إضافة إلى الشاشة الرئيسية\" أو \"تثبيت التطبيق\"" : "Select \"Add to Home Screen\" or \"Install App\""}</li>
                  <li>{language === "ar" ? "اضغط \"تثبيت\" لتأكيد" : "Tap \"Install\" to confirm"}</li>
                </ol>
              </div>

              {/* iPhone Safari */}
              <div className={`rounded-xl p-4 ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <span className="text-lg">🍎</span> {language === "ar" ? "آيفون - سفاري" : "iPhone - Safari"}
                </h4>
                <ol className={`text-sm space-y-1 list-decimal list-inside ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <li>{language === "ar" ? "اضغط على أيقونة المشاركة ⬆️ أسفل الشاشة" : "Tap the Share ⬆️ icon at the bottom"}</li>
                  <li>{language === "ar" ? "مرر للأسفل واختر \"إضافة إلى الشاشة الرئيسية\"" : "Scroll down and select \"Add to Home Screen\""}</li>
                  <li>{language === "ar" ? "اضغط \"إضافة\" لتأكيد" : "Tap \"Add\" to confirm"}</li>
                </ol>
              </div>

              {/* Desktop Chrome */}
              <div className={`rounded-xl p-4 ${darkMode ? "bg-gray-700" : "bg-green-50"}`}>
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <span className="text-lg">💻</span> {language === "ar" ? "كمبيوتر - كروم" : "Desktop - Chrome"}
                </h4>
                <ol className={`text-sm space-y-1 list-decimal list-inside ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <li>{language === "ar" ? "اضغط على أيقونة التثبيت ⊕ في شريط العنوان" : "Click the install icon ⊕ in the address bar"}</li>
                  <li>{language === "ar" ? "أو من القائمة ⋮ اختر \"تثبيت التطبيق\"" : "Or from menu ⋮ select \"Install App\""}</li>
                </ol>
              </div>
            </div>

            <Button
              onClick={() => setShowInstallInstructions(false)}
              className="w-full mt-4 gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              {language === "ar" ? "فهمت" : "Got it"}
            </Button>
          </div>
        </div>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">

        {/* ===== TAB NAVIGATION ===== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center print-hide">
            <TabsList className={`grid grid-cols-5 w-full max-w-2xl ${darkMode ? "bg-gray-800" : ""}`}>
              <TabsTrigger value="calculator" className="gap-1 text-xs sm:text-sm">
                <Calculator className="size-3 sm:size-4" />
                <span className="hidden sm:inline">{t("tab.calculator")}</span>
              </TabsTrigger>
              <TabsTrigger value="cables" className="gap-1 text-xs sm:text-sm">
                <Cable className="size-3 sm:size-4" />
                <span className="hidden sm:inline">{t("tab.cables")}</span>
              </TabsTrigger>
              <TabsTrigger value="economics" className="gap-1 text-xs sm:text-sm">
                <TrendingUp className="size-3 sm:size-4" />
                <span className="hidden sm:inline">{t("tab.economics")}</span>
              </TabsTrigger>
              <TabsTrigger value="bom" className="gap-1 text-xs sm:text-sm">
                <FileSpreadsheet className="size-3 sm:size-4" />
                <span className="hidden sm:inline">{t("tab.bom")}</span>
              </TabsTrigger>
              <TabsTrigger value="save" className="gap-1 text-xs sm:text-sm">
                <Save className="size-3 sm:size-4" />
                <span className="hidden sm:inline">{t("tab.save")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ===== TAB 1: CALCULATOR ===== */}
          <TabsContent value="calculator" className="space-y-6">
            {/* Project Information */}
            <section className="mb-8">
              <Card className={`${cardBg} shadow-sm`}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setProjectInfoExpanded(!projectInfoExpanded)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
                        <Briefcase className="size-4 text-amber-600" />
                      </div>
                      <CardTitle className={`text-lg ${cardHeaderText}`}>{t("project.title")}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-amber-700 no-print">
                      {projectInfoExpanded ? <><ChevronUp className="size-4" />{t("project.hide")}</> : <><ChevronDown className="size-4" />{t("project.show")}</>}
                    </Button>
                  </div>
                  <CardDescription className={subTextColor}>{t("project.desc")}</CardDescription>
                </CardHeader>
                {projectInfoExpanded && (
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { key: "projectName", label: t("project.name") },
                        { key: "clientName", label: t("project.client") },
                        { key: "location", label: t("project.location") },
                        { key: "engineerName", label: t("project.engineer") },
                        { key: "projectNumber", label: t("project.number") },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-2">
                          <Label className={labelColor}>{label}</Label>
                          <Input
                            value={(projectInfo as Record<string, string>)[key]}
                            onChange={(e) => setProjectInfo(prev => ({ ...prev, [key]: e.target.value }))}
                            placeholder={label}
                            className={inputClass}
                          />
                        </div>
                      ))}
                      <div className="space-y-2">
                        <Label className={labelColor}>{t("project.date")}</Label>
                        <Input type="date" value={projectInfo.date} onChange={(e) => setProjectInfo(prev => ({ ...prev, date: e.target.value }))} className={inputClass} />
                      </div>
                      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                        <Label className={labelColor}>{t("project.notes")}</Label>
                        <textarea
                          value={projectInfo.notes}
                          onChange={(e) => setProjectInfo(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder={t("project.notes")}
                          rows={3}
                          className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none ${inputClass}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </section>

            {/* ===== Solar Radiation Data Section ===== */}
            <section className="mb-8">
              <Card className={`${cardBg} shadow-sm`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100">
                      <SunMedium className="size-4 text-orange-600" />
                    </div>
                    <CardTitle className={`text-lg ${cardHeaderText}`}>{t("location.title")}</CardTitle>
                  </div>
                  <CardDescription className={subTextColor}>
                    {language === "ar" ? "اختر المحافظة لعرض بيانات الإشعاع الشمسي" : "Select governorate to view solar radiation data"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label className={labelColor}>{t("location.governorate")}</Label>
                      <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                        <SelectTrigger className={inputClass}>
                          <SelectValue placeholder={t("location.select")} />
                        </SelectTrigger>
                        <SelectContent>
                          {yemenGovernorates.map((g) => (
                            <SelectItem key={g.name} value={g.name}>
                              {language === "ar" ? g.name : g.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {governorateData && (
                      <>
                        <div className="space-y-2">
                          <Label className={labelColor}>{t("location.annualAvg")}</Label>
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-amber-50"}`}>
                            <span className="text-lg font-bold text-amber-600">{governorateData.annualAvg}</span>
                            <span className="text-xs text-gray-500">kWh/m²/day</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className={labelColor}>{t("location.peakSunHours")}</Label>
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-amber-50"}`}>
                            <span className="text-lg font-bold text-orange-600">{governorateData.peakSunHours}</span>
                            <span className="text-xs text-gray-500">{t("unit.hours")}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className={labelColor}>{t("location.tiltAngle")}</Label>
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-amber-50"}`}>
                            <span className="text-lg font-bold text-emerald-600">{governorateData.optimalTiltAngle}</span>
                            <span className="text-xs text-gray-500">{t("unit.degrees")}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className={labelColor}>{t("location.latitude")}</Label>
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-amber-50"}`}>
                            <span className="text-lg font-bold text-blue-600">{governorateData.latitude}</span>
                            <span className="text-xs text-gray-500">°</span>
                          </div>
                        </div>
                        <div className="flex items-end">
                          <Button onClick={handleAutoFillGovernorate} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white w-full">
                            <Sun className="size-4" />
                            {t("location.autoFill")}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Monthly radiation bar chart */}
                  {governorateData && (
                    <div className={`mt-6 p-4 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gradient-to-r from-amber-50 to-orange-50"}`}>
                      <h4 className={`font-bold text-sm mb-3 ${cardHeaderText}`}>
                        {language === "ar" ? "الإشعاع الشمسي الشهري (kWh/m²/يوم)" : "Monthly Solar Radiation (kWh/m²/day)"}
                      </h4>
                      <div className="flex items-end gap-1 sm:gap-2 h-32">
                        {governorateData.monthly.map((val, i) => {
                          const maxVal = Math.max(...governorateData.monthly);
                          const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                          const monthNames = language === "ar" ? monthNamesAr : monthNamesEn;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-[10px] font-semibold text-amber-700">{val}</span>
                              <div
                                className="w-full rounded-t-sm transition-all"
                                style={{
                                  height: `${heightPct}%`,
                                  background: val >= 6.5 ? "linear-gradient(to top, #f59e0b, #ea580c)" : val >= 5.5 ? "linear-gradient(to top, #fbbf24, #f59e0b)" : "linear-gradient(to top, #fde68a, #fbbf24)",
                                  minHeight: "4px",
                                }}
                              />
                              <span className="text-[9px] text-gray-500 truncate w-full text-center">{monthNames[i]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Load Type Selection */}
            <section className="mb-8 no-print">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="size-5 text-amber-600" />
                <h2 className={`text-xl font-bold ${cardHeaderText} sm:text-2xl`}>{language === "ar" ? "نوع الأحمال" : "Load Type"}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(["residential", "industrial"] as const).map((type) => {
                  const isRes = type === "residential";
                  const Icon = isRes ? Home : Factory;
                  const title = isRes ? t("load.residential") : t("load.industrial");
                  const desc = isRes
                    ? (language === "ar" ? "أجهزة منزلية مثل الإنارة والثلاجة والتكييف" : "Home appliances like lighting, fridge, AC")
                    : (language === "ar" ? "معدات صناعية مثل المحركات والضواغط" : "Industrial equipment like motors, compressors");
                  const selected = loadType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleLoadTypeChange(type)}
                      className={`group relative overflow-hidden rounded-xl border-2 p-5 text-right transition-all duration-300 ${
                        selected
                          ? `border-amber-500 ${darkMode ? "bg-amber-900/30" : "bg-amber-50"} shadow-lg shadow-amber-200/50`
                          : `border-gray-200 ${darkMode ? "bg-gray-800 hover:border-amber-600" : "bg-white hover:border-amber-300 hover:bg-amber-50/50"}`
                      }`}
                    >
                      {selected && <div className="absolute inset-0 bg-gradient-to-l from-amber-100/50 to-transparent" />}
                      <div className="relative flex items-center gap-4">
                        <div className={`flex size-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          selected ? "bg-amber-500 text-white" : `bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-600`
                        }`}>
                          <Icon className="size-6" />
                        </div>
                        <div>
                          <h3 className={`text-lg font-bold ${cardHeaderText}`}>{title}</h3>
                          <p className={`text-sm ${subTextColor}`}>{desc}</p>
                        </div>
                      </div>
                      {selected && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-amber-500 text-white">{language === "ar" ? "محدد" : "Selected"}</Badge>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Load Entry Section */}
            <section className="mb-8">
              <Card className={`${cardBg} shadow-sm`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="size-5 text-amber-600" />
                      <CardTitle className={`text-xl ${cardHeaderText}`}>{t("load.title")}</CardTitle>
                    </div>
                    <Button onClick={addLoad} variant="outline" size="sm" className={`gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 no-print ${darkMode ? "border-amber-600 text-amber-400 hover:bg-gray-700" : ""}`}>
                      <Plus className="size-4" />
                      {t("load.add")}
                    </Button>
                  </div>
                  <CardDescription className={subTextColor}>
                    {language === "ar" ? "أدخل الأجهزة الكهربائية وقدرتها وساعات تشغيلها اليومية" : "Enter electrical devices, their power, and daily operating hours"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className={darkMode ? "bg-gray-700 hover:bg-gray-700" : "bg-amber-50/80 hover:bg-amber-50/80"}>
                          <TableHead className={`text-right font-bold ${labelColor}`}>{t("load.name")}</TableHead>
                          <TableHead className={`text-right font-bold ${labelColor}`}>{t("load.quantity")}</TableHead>
                          <TableHead className={`text-right font-bold ${labelColor}`}>{t("load.power")}</TableHead>
                          <TableHead className={`text-right font-bold ${labelColor}`}>{t("load.hours")}</TableHead>
                          <TableHead className={`text-right font-bold ${labelColor}`}>{t("load.total")}</TableHead>
                          <TableHead className={`text-center font-bold ${labelColor} no-print`}>{" "}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loads.map((load) => {
                          const totalPower = load.quantity * load.power;
                          const dailyEnergy = totalPower * load.hours;
                          return (
                            <TableRow key={load.id}>
                              <TableCell><Input value={load.name} onChange={(e) => updateLoad(load.id, "name", e.target.value)} placeholder={t("load.name")} className={`min-w-[120px] ${inputClass}`} /></TableCell>
                              <TableCell><Input type="number" min={1} value={load.quantity} onChange={(e) => updateLoad(load.id, "quantity", e.target.value)} className="w-20" /></TableCell>
                              <TableCell><Input type="number" min={0} value={load.power} onChange={(e) => updateLoad(load.id, "power", e.target.value)} className="w-24" /></TableCell>
                              <TableCell><Input type="number" min={0} max={24} step={0.5} value={load.hours} onChange={(e) => updateLoad(load.id, "hours", e.target.value)} className="w-20" /></TableCell>
                              <TableCell className="font-semibold text-amber-700">{formatNumber(dailyEnergy)} Wh</TableCell>
                              <TableCell className="text-center no-print">
                                <Button variant="ghost" size="icon" onClick={() => removeLoad(load.id)} className="text-red-400 hover:bg-red-50 hover:text-red-600" disabled={loads.length <= 1}>
                                  <Trash2 className="size-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <Separator className={`my-4 ${darkMode ? "bg-gray-600" : "bg-amber-200"}`} />
                  <div className={`flex flex-wrap items-center justify-between gap-4 rounded-lg p-4 ${darkMode ? "bg-gray-700" : "bg-amber-50"}`}>
                    <div className="flex items-center gap-2">
                      <Zap className="size-5 text-amber-600" />
                      <span className={`font-bold ${labelColor}`}>{t("load.peakLoad")}:</span>
                      <span className="text-lg font-bold text-amber-700">{formatNumber(totalPeakLoad)} W</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="size-5 text-orange-600" />
                      <span className={`font-bold ${labelColor}`}>{t("load.dailyEnergy")}:</span>
                      <span className="text-lg font-bold text-orange-700">{formatNumber(totalDailyEnergy / 1000, 2)} kWh</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* System Parameters */}
            <section className="mb-8">
              <Card className={`${cardBg} shadow-sm`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Gauge className="size-5 text-amber-600" />
                    <CardTitle className={`text-xl ${cardHeaderText}`}>{t("params.title")}</CardTitle>
                  </div>
                  <CardDescription className={subTextColor}>
                    {language === "ar" ? "حدد معلمات المنظومة الشمسية المطلوبة للحساب" : "Specify the solar system parameters for calculation"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* System Type */}
                    <div className="space-y-2">
                      <Label className={labelColor}>{t("params.systemType")}</Label>
                      <Select value={params.systemType} onValueChange={(v) => updateParam("systemType", v as "on-grid" | "off-grid" | "hybrid")}>
                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off-grid">{t("params.offGrid")}</SelectItem>
                          <SelectItem value="on-grid">{t("params.onGrid")}</SelectItem>
                          <SelectItem value="hybrid">{t("params.hybrid")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Sunshine Hours */}
                    <div className="space-y-2">
                      <Label className={labelColor}>{t("params.sunshine")}</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={1} max={12} step={0.5} value={params.sunshineHours} onChange={(e) => updateParam("sunshineHours", Number(e.target.value) || 1)} className={inputClass} />
                        <span className={`text-sm ${subTextColor} shrink-0`}>{t("unit.hours")}</span>
                      </div>
                    </div>
                    {/* System Voltage */}
                    <div className="space-y-2">
                      <Label className={labelColor}>{t("params.voltage")}</Label>
                      <Select value={String(params.systemVoltage)} onValueChange={(v) => updateParam("systemVoltage", Number(v))}>
                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12V</SelectItem>
                          <SelectItem value="24">24V</SelectItem>
                          <SelectItem value="48">48V</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Backup Days */}
                    <div className="space-y-2">
                      <Label className={labelColor}>{t("params.backup")}</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={0} max={7} value={params.backupDays} onChange={(e) => updateParam("backupDays", Number(e.target.value) || 0)} className={inputClass} />
                        <span className={`text-sm ${subTextColor} shrink-0`}>{t("unit.day")}</span>
                      </div>
                    </div>
                    {/* Panel Wattage */}
                    <div className="space-y-2">
                      <Label className={labelColor}>{t("params.panelWattage")}</Label>
                      <Select value={String(params.panelWattage)} onValueChange={(v) => updateParam("panelWattage", Number(v))}>
                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[100, 200, 300, 400, 550, 600, 720].map(w => (
                            <SelectItem key={w} value={String(w)}>{w}W</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Battery Type */}
                    <div className="space-y-2">
                      <Label className={labelColor}>{t("params.batteryType")}</Label>
                      <Select value={params.batteryType} onValueChange={(v) => updateParam("batteryType", v as "lead-acid" | "lithium")}>
                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead-acid">{t("params.leadAcid")}</SelectItem>
                          <SelectItem value="lithium">{t("params.lithium")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Battery Capacity */}
                    <div className="space-y-2">
                      <Label className={labelColor}>{t("params.batteryCapacity")}</Label>
                      <Select value={String(params.batteryCapacity)} onValueChange={(v) => updateParam("batteryCapacity", Number(v))}>
                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {params.batteryType === "lithium" ? (
                            [100, 200, 280, 300].map(c => (
                              <SelectItem key={c} value={String(c)}>{c}Ah ({(c * params.batteryVoltage / 1000).toFixed(1)}kWh)</SelectItem>
                            ))
                          ) : (
                            [100, 150, 200, 250].map(c => (
                              <SelectItem key={c} value={String(c)}>{c}Ah ({(c * params.batteryVoltage / 1000).toFixed(1)}kWh)</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Battery Voltage */}
                    <div className="space-y-2">
                      <Label className={labelColor}>{t("params.batteryVoltage")}</Label>
                      <Select value={String(params.batteryVoltage)} onValueChange={(v) => updateParam("batteryVoltage", Number(v))}>
                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12V</SelectItem>
                          <SelectItem value="24">24V</SelectItem>
                          {params.batteryType === "lithium" && <SelectItem value="51.2">51.2V</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Battery Brand Selection */}
                    {params.batteryType === "lithium" && params.systemType !== "on-grid" && (
                      <div className="space-y-2">
                        <Label className={labelColor}>{language === "ar" ? "ماركة البطارية" : "Battery Brand"}</Label>
                        <Select value={selectedBatteryBrand} onValueChange={(v) => { setSelectedBatteryBrand(v); setSelectedBatteryModel(""); }}>
                          <SelectTrigger className={inputClass}><SelectValue placeholder={language === "ar" ? "اختر ماركة" : "Select brand"} /></SelectTrigger>
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
                        <Label className={labelColor}>{language === "ar" ? "موديل البطارية" : "Battery Model"}</Label>
                        <Select value={selectedBatteryModel} onValueChange={(v) => {
                          setSelectedBatteryModel(v);
                          const model = lithiumBatteryBrands[selectedBatteryBrand]?.models[parseInt(v)];
                          if (model) { updateParam("batteryCapacity", model.capacityAh); updateParam("batteryVoltage", model.voltage); }
                        }}>
                          <SelectTrigger className={inputClass}><SelectValue placeholder={language === "ar" ? "اختر موديل" : "Select model"} /></SelectTrigger>
                          <SelectContent>
                            {lithiumBatteryBrands[selectedBatteryBrand]?.models.map((model, idx) => (
                              <SelectItem key={idx} value={String(idx)}>{model.name} - {model.capacityAh}Ah / {model.energyKWh}kWh (${formatUSD(model.price)})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {/* Inverter Brand Selection */}
                    <div className="space-y-2">
                      <Label className={labelColor}>{language === "ar" ? "ماركة العاكس" : "Inverter Brand"}</Label>
                      <Select value={selectedInverterBrand} onValueChange={(v) => { setSelectedInverterBrand(v); setSelectedInverterModel(""); }}>
                        <SelectTrigger className={inputClass}><SelectValue placeholder={language === "ar" ? "اختر ماركة" : "Select brand"} /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(inverterBrands)
                            .filter(([, brand]) => {
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
                        <Label className={labelColor}>{language === "ar" ? "موديل العاكس" : "Inverter Model"}</Label>
                        <Select value={selectedInverterModel} onValueChange={setSelectedInverterModel}>
                          <SelectTrigger className={inputClass}><SelectValue placeholder={language === "ar" ? "اختر موديل" : "Select model"} /></SelectTrigger>
                          <SelectContent>
                            {inverterBrands[selectedInverterBrand]?.models.map((model, idx) => (
                              <SelectItem key={idx} value={String(idx)}>{model.name} - {model.powerW}W (${formatUSD(model.price)})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Panel Specs */}
                  <Separator className={`my-6 ${darkMode ? "bg-gray-600" : "bg-amber-200"}`} />
                  <div className="flex items-center gap-2 mb-4">
                    <Cable className="size-5 text-amber-600" />
                    <h3 className={`text-lg font-bold ${cardHeaderText}`}>{t("panel.title")}</h3>
                    <Badge variant="outline" className="border-amber-300 text-amber-700 text-xs">{params.panelWattage}W</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { key: "voc", label: "Voc", unit: "V" },
                      { key: "isc", label: "Isc", unit: "A" },
                      { key: "vmp", label: "Vmp", unit: "V" },
                      { key: "imp", label: "Imp", unit: "A" },
                    ].map(({ key, label, unit }) => (
                      <div key={key} className="space-y-2">
                        <Label className={`${labelColor} text-sm`}>{label}</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number" min={0.1} step={0.1}
                            value={panelSpecs[key as keyof typeof panelSpecs]}
                            onChange={(e) => setPanelSpecs(prev => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                            className={`text-sm ${inputClass}`}
                          />
                          <span className={`text-xs ${subTextColor} shrink-0`}>{unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sliders */}
                  <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
                    {[
                      { key: "batteryDoD", label: t("params.dod"), min: params.batteryType === "lithium" ? 80 : 50, max: params.batteryType === "lithium" ? 95 : 80, step: 5, val: params.batteryDoD },
                      { key: "systemEfficiency", label: t("params.efficiency"), min: 60, max: 95, step: 5, val: params.systemEfficiency },
                      { key: "inverterEfficiency", label: t("params.inverterEfficiency"), min: 85, max: 98, step: 1, val: params.inverterEfficiency },
                    ].map(({ key, label, min, max, step, val }) => (
                      <div key={key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className={labelColor}>{label}</Label>
                          <Badge variant="outline" className="border-amber-300 text-amber-700">{val}{t("unit.percent")}</Badge>
                        </div>
                        <Slider
                          value={[val]} min={min} max={max} step={step}
                          onValueChange={([v]) => updateParam(key as keyof SystemParams, v)}
                          className="[&_[data-slot=slider-range]]:bg-amber-500 [&_[data-slot=slider-thumb]]:border-amber-500"
                        />
                        <div className={`flex justify-between text-xs ${subTextColor}`}><span>{min}%</span><span>{max}%</span></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Calculate Button */}
            <section className="mb-10 flex justify-center no-print">
              <Button
                onClick={calculate}
                size="lg"
                className="gap-3 rounded-xl bg-gradient-to-l from-amber-500 via-orange-500 to-amber-600 px-10 py-6 text-lg font-bold text-white shadow-lg shadow-amber-300/40 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-400/50 active:scale-[0.98]"
              >
                <Sun className="size-6 animate-pulse" />
                {t("calc.button")}
                <Calculator className="size-5" />
              </Button>
            </section>

            {/* Results Section */}
            {showResults && results && (
              <section id="results-section" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div id="report-content" ref={reportRef}>
                  {/* Project Info Header for PDF */}
                  {(projectInfo.projectName || projectInfo.clientName) && (
                    <div className={`mb-6 rounded-xl border ${darkMode ? "border-gray-600 bg-gray-800" : "border-amber-200 bg-gradient-to-l from-amber-50 to-orange-50"} p-5 print:block`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500">
                          <Sun className="size-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-amber-800">{projectInfo.projectName || (language === "ar" ? "تقرير المنظومة الشمسية" : "Solar System Report")}</h3>
                          <p className="text-sm text-amber-600">{language === "ar" ? "تقرير التصميم الهندسي للمنظومة الشمسية" : "Solar System Engineering Design Report"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {projectInfo.clientName && <div className="flex gap-2"><span className={subTextColor}>{language === "ar" ? "العميل:" : "Client:"}</span><span className={`font-semibold ${cardHeaderText}`}>{projectInfo.clientName}</span></div>}
                        {projectInfo.location && <div className="flex gap-2"><span className={subTextColor}>{language === "ar" ? "الموقع:" : "Location:"}</span><span className={`font-semibold ${cardHeaderText}`}>{projectInfo.location}</span></div>}
                        {projectInfo.date && <div className="flex gap-2"><span className={subTextColor}>{language === "ar" ? "التاريخ:" : "Date:"}</span><span className={`font-semibold ${cardHeaderText}`}>{projectInfo.date}</span></div>}
                        {projectInfo.engineerName && <div className="flex gap-2"><span className={subTextColor}>{language === "ar" ? "المهندس:" : "Engineer:"}</span><span className={`font-semibold ${cardHeaderText}`}>{projectInfo.engineerName}</span></div>}
                        {projectInfo.projectNumber && <div className="flex gap-2"><span className={subTextColor}>{language === "ar" ? "رقم المشروع:" : "Project #:"}</span><span className={`font-semibold ${cardHeaderText}`}>{projectInfo.projectNumber}</span></div>}
                      </div>
                      {projectInfo.notes && <div className="mt-3 text-sm"><span className={subTextColor}>{language === "ar" ? "ملاحظات:" : "Notes:"}</span><span className={cardHeaderText}>{projectInfo.notes}</span></div>}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-1 rounded-full bg-amber-500" /><div className="size-1 rounded-full bg-orange-500" /><div className="size-1 rounded-full bg-amber-500" />
                    <h2 className={`text-2xl font-bold ${cardHeaderText}`}>{t("results.title")}</h2>
                    <div className="size-1 rounded-full bg-amber-500" /><div className="size-1 rounded-full bg-orange-500" /><div className="size-1 rounded-full bg-amber-500" />
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Load Summary */}
                    <Card className={`${cardBg} shadow-sm overflow-hidden card-print`}>
                      <div className="h-1 bg-gradient-to-l from-amber-400 to-orange-500" />
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100"><Zap className="size-5 text-amber-600" /></div>
                          <div><CardTitle className={`text-lg ${cardHeaderText}`}>{t("results.loadSummary")}</CardTitle></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ResultRow label={t("results.peakLoad")} value={formatNumber(results.totalPeakLoad)} unit={t("unit.watt")} darkMode={darkMode} />
                        <ResultRow label={t("results.dailyConsumption")} value={formatNumber(results.totalDailyConsumptionKWh, 2)} unit={t("unit.kwh")} darkMode={darkMode} />
                        <ResultRow label={t("results.monthlyConsumption")} value={formatNumber(results.totalMonthlyConsumptionKWh, 1)} unit={t("unit.kwh")} darkMode={darkMode} />
                      </CardContent>
                    </Card>

                    {/* Solar Panels */}
                    <Card className={`${cardBg} shadow-sm overflow-hidden card-print`}>
                      <div className="h-1 bg-gradient-to-l from-yellow-400 to-amber-500" />
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-100"><SunMedium className="size-5 text-yellow-600" /></div>
                          <div><CardTitle className={`text-lg ${cardHeaderText}`}>{t("results.solarPanels")}</CardTitle></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ResultRow label={t("results.requiredCapacity")} value={formatNumber(Math.round(results.requiredSolarCapacity))} unit={t("unit.watt")} darkMode={darkMode} />
                        <ResultRow label={t("results.numberOfPanels")} value={formatNumber(results.numberOfPanels)} unit={language === "ar" ? "لوح" : "panels"} highlight darkMode={darkMode} />
                        <ResultRow label={t("results.panelArea")} value={formatNumber(results.panelArea, 1)} unit="m²" darkMode={darkMode} />
                      </CardContent>
                    </Card>

                    {/* Batteries */}
                    <Card className={`${cardBg} shadow-sm overflow-hidden card-print`}>
                      <div className="h-1 bg-gradient-to-l from-green-400 to-emerald-500" />
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-green-100"><Battery className="size-5 text-green-600" /></div>
                          <div><CardTitle className={`text-lg ${cardHeaderText}`}>{t("results.batteryBank")}</CardTitle></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {params.systemType === "on-grid" ? (
                          <div className="rounded-lg bg-blue-50 p-4 text-center">
                            <p className="text-sm text-blue-700 font-semibold">{language === "ar" ? "المنظومة متصلة بالشبكة - لا حاجة للبطاريات" : "Grid-tied system - no batteries needed"}</p>
                          </div>
                        ) : (
                          <>
                            <ResultRow label={language === "ar" ? "نوع البطارية" : "Battery Type"} value={results.batteryTypeName} unit="" highlight darkMode={darkMode} />
                            <ResultRow label={t("results.usableStorage")} value={`${formatNumber(results.usableStorageKWh, 2)} kWh`} unit="" darkMode={darkMode} />
                            <ResultRow label={t("results.totalBatteries")} value={formatNumber(results.actualTotalBatteries)} unit={language === "ar" ? "بطارية" : "batteries"} highlight darkMode={darkMode} />
                            <ResultRow label={t("results.series")} value={formatNumber(results.seriesBatteries)} unit="" darkMode={darkMode} />
                            <ResultRow label={t("results.parallel")} value={formatNumber(results.parallelBatteries)} unit="" darkMode={darkMode} />
                            <ResultRow label={t("results.storedEnergy")} value={`${formatNumber(results.totalStoredEnergyKWh, 2)} kWh`} unit="" darkMode={darkMode} />
                            {results.selectedBatteryModelName && (
                              <div className="rounded-lg bg-green-50 p-3 mt-2">
                                <p className="font-semibold text-green-900 text-sm">{results.selectedBatteryModelName}</p>
                                <p className="text-xs text-green-700 mt-1">{results.selectedBatterySpecs}</p>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Inverter */}
                    <Card className={`${cardBg} shadow-sm overflow-hidden card-print`}>
                      <div className="h-1 bg-gradient-to-l from-blue-400 to-indigo-500" />
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100"><Zap className="size-5 text-blue-600" /></div>
                          <div><CardTitle className={`text-lg ${cardHeaderText}`}>{t("results.inverter")}</CardTitle></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ResultRow label={t("results.inverterCapacity")} value={formatNumber(results.inverterCapacity)} unit={t("unit.watt")} darkMode={darkMode} />
                        <ResultRow label={t("results.recommended")} value={formatNumber(results.recommendedInverter)} unit={t("unit.watt")} highlight darkMode={darkMode} />
                        {results.selectedInverterModelName && (
                          <div className="rounded-lg bg-blue-50 p-3 mt-2">
                            <p className="font-semibold text-blue-900 text-sm">{results.selectedInverterModelName}</p>
                            <p className="text-xs text-blue-700 mt-1">{results.selectedInverterSpecs}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Charge Controller */}
                    <Card className={`${cardBg} shadow-sm overflow-hidden card-print`}>
                      <div className="h-1 bg-gradient-to-l from-purple-400 to-violet-500" />
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100"><Gauge className="size-5 text-purple-600" /></div>
                          <div><CardTitle className={`text-lg ${cardHeaderText}`}>{t("results.controller")}</CardTitle></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ResultRow label={t("results.controllerCurrent")} value={formatNumber(results.chargeControllerCurrent)} unit={t("unit.amp")} darkMode={darkMode} />
                        <ResultRow label={t("results.recommendedController")} value={formatNumber(results.recommendedController)} unit={t("unit.amp")} highlight darkMode={darkMode} />
                        <ResultRow label={t("results.controllerType")} value={results.controllerType} unit="" highlight darkMode={darkMode} />
                      </CardContent>
                    </Card>

                    {/* Cost Estimate */}
                    <Card className={`${cardBg} shadow-sm overflow-hidden card-print`}>
                      <div className="h-1 bg-gradient-to-l from-emerald-400 to-green-500" />
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100"><DollarSign className="size-5 text-emerald-600" /></div>
                          <div><CardTitle className={`text-lg ${cardHeaderText}`}>{t("results.cost")}</CardTitle></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ResultRow label={t("results.panelsCost")} value={`$${formatUSD(Math.round(results.panelCost))}`} unit="" darkMode={darkMode} />
                        <ResultRow label={t("results.batteriesCost")} value={`$${formatUSD(Math.round(results.batteryCost))}`} unit="" darkMode={darkMode} />
                        <ResultRow label={t("results.inverterCost")} value={`$${formatUSD(Math.round(results.inverterCost))}`} unit="" darkMode={darkMode} />
                        <ResultRow label={t("results.controllerCost")} value={`$${formatUSD(Math.round(results.controllerCost))}`} unit="" darkMode={darkMode} />
                        <ResultRow label={t("results.accessories")} value={`$${formatUSD(Math.round(results.accessories))}`} unit="" darkMode={darkMode} />
                        <Separator className="my-2 bg-emerald-200" />
                        <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                          <span className={`font-bold ${labelColor}`}>{t("results.totalCost")}</span>
                          <span className="text-xl font-bold text-emerald-700">${formatUSD(Math.round(results.totalCost))}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* MPPT String Configuration */}
                  <Card className={`${cardBg} shadow-sm overflow-hidden mt-6 card-print`}>
                    <div className="h-1 bg-gradient-to-l from-orange-400 to-red-500" />
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100"><Cable className="size-5 text-orange-600" /></div>
                        <div><CardTitle className={`text-lg ${cardHeaderText}`}>{t("results.mpptString")}</CardTitle></div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!results.hasMpptData ? (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <AlertTriangle className="size-5 text-amber-500" />
                            <span className="font-semibold text-amber-700">{language === "ar" ? "يرجى اختيار موديل الانفرتر لحساب توصيل السلاسل" : "Select an inverter model to calculate string configuration"}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <ResultRow label={t("results.panelsPerString")} value={formatNumber(results.panelsPerString)} unit={language === "ar" ? "لوح" : "panels"} highlight darkMode={darkMode} />
                          <ResultRow label={t("results.totalStrings")} value={formatNumber(results.totalStrings)} unit={language === "ar" ? "سلسلة" : "strings"} highlight darkMode={darkMode} />
                          <ResultRow label={t("results.stringsPerMPPT")} value={formatNumber(results.stringsPerMPPT)} unit="" darkMode={darkMode} />
                          <ResultRow label={t("results.stringVoc")} value={formatNumber(results.stringVoc, 1)} unit={t("unit.volt")} darkMode={darkMode} />
                          <ResultRow label={t("results.stringVmp")} value={formatNumber(results.stringVmp, 1)} unit={t("unit.volt")} darkMode={darkMode} />
                          <ResultRow label={t("results.stringPower")} value={formatNumber(results.stringPowerW)} unit={t("unit.watt")} darkMode={darkMode} />
                          {results.stringVoc > results.mpptMaxV * 0.9 && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-2">
                              <AlertTriangle className="size-4 text-red-500 shrink-0" />
                              <span className="text-xs text-red-700 font-semibold">
                                {language === "ar" ? "تحذير: جهد السلسلة قريب من الحد الأقصى لـ MPPT" : "Warning: String voltage is close to MPPT max limit"}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Disclaimer */}
                  <div className={`rounded-lg border p-4 text-center text-sm mt-6 ${darkMode ? "border-gray-600 bg-gray-800 text-gray-400" : "border-amber-200 bg-amber-50/50 text-amber-700"}`}>
                    <strong>{language === "ar" ? "ملاحظة:" : "Note:"}</strong>{" "}
                    {language === "ar" ? "هذه الحسابات تقريبية وقد تختلف عن الواقع حسب الظروف الميدانية." : "These calculations are approximate and may vary based on field conditions."}
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-6 no-print">
                  <Button onClick={exportToPDF} variant="outline" size="lg" className={`gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 ${darkMode ? "border-amber-600 text-amber-400 hover:bg-gray-700" : ""}`}>
                    <Download className="size-5" />{t("action.pdf")}
                  </Button>
                  <Button onClick={shareReport} variant="outline" size="lg" className={`gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 ${darkMode ? "border-amber-600 text-amber-400 hover:bg-gray-700" : ""}`}>
                    <Share2 className="size-5" />{t("action.share")}
                  </Button>
                  <Button onClick={printReport} variant="outline" size="lg" className={`gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 ${darkMode ? "border-amber-600 text-amber-400 hover:bg-gray-700" : ""}`}>
                    <Printer className="size-5" />{t("action.print")}
                  </Button>
                </div>
              </section>
            )}
          </TabsContent>

          {/* ===== TAB 2: CABLES & PROTECTION ===== */}
          <TabsContent value="cables" className="space-y-6">
            <Card className={`${cardBg} shadow-sm`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100"><Cable className="size-5 text-orange-600" /></div>
                  <div><CardTitle className={`text-xl ${cardHeaderText}`}>{t("cables.title")}</CardTitle></div>
                </div>
              </CardHeader>
              <CardContent>
                {!results ? (
                  <div className={`rounded-lg p-8 text-center ${darkMode ? "bg-gray-700" : "bg-amber-50"}`}>
                    <Calculator className="size-12 text-amber-400 mx-auto mb-3" />
                    <p className={`font-semibold ${cardHeaderText}`}>{language === "ar" ? "يرجى حساب المنظومة أولاً من تبويب الحاسبة" : "Please calculate the system first from the Calculator tab"}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Cable Length Inputs */}
                    <div>
                      <h4 className={`font-bold mb-3 ${cardHeaderText}`}>{language === "ar" ? "أطوال الكابلات" : "Cable Lengths"}</h4>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                        {([
                          { key: "pvString", label: t("cables.pvStringCable") },
                          { key: "pvMain", label: t("cables.pvMainCable") },
                          { key: "battery", label: t("cables.batteryCable") },
                          { key: "acOutput", label: t("cables.acOutputCable") },
                          { key: "acMain", label: t("cables.acMainCable") },
                        ] as const).map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className={`text-xs ${labelColor}`}>{label}</Label>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number" min={1}
                                value={cableLengths[key]}
                                onChange={(e) => setCableLengths(prev => ({ ...prev, [key]: Number(e.target.value) || 1 }))}
                                className={inputClass}
                              />
                              <span className={`text-xs ${subTextColor}`}>m</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className={darkMode ? "bg-gray-600" : "bg-amber-200"} />

                    {/* Cable Sizing Results */}
                    {cableResults && (
                      <div>
                        <h4 className={`font-bold mb-3 ${cardHeaderText} flex items-center gap-2`}>
                          <BarChart3 className="size-4 text-amber-600" />
                          {language === "ar" ? "نتائج حساب الكابلات" : "Cable Sizing Results"}
                        </h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className={darkMode ? "bg-gray-700 hover:bg-gray-700" : "bg-amber-50/80 hover:bg-amber-50/80"}>
                                <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{language === "ar" ? "نوع الكابل" : "Cable Type"}</TableHead>
                                <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("cables.current")} (A)</TableHead>
                                <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("cables.recommendedSize")} (mm²)</TableHead>
                                <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("cables.voltageDrop")} (V)</TableHead>
                                <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("cables.voltageDropPercent")} (%)</TableHead>
                                <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("cables.status")}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[
                                { result: cableResults.pvStringCable, label: t("cables.pvStringCable") },
                                { result: cableResults.pvMainCable, label: t("cables.pvMainCable") },
                                { result: cableResults.batteryCable, label: t("cables.batteryCable") },
                                { result: cableResults.acOutputCable, label: t("cables.acOutputCable") },
                                { result: cableResults.acMainCable, label: t("cables.acMainCable") },
                              ].map(({ result, label }, i) => (
                                <TableRow key={i}>
                                  <TableCell className="text-xs font-semibold">{label}</TableCell>
                                  <TableCell className="text-xs">{result.current.toFixed(1)}</TableCell>
                                  <TableCell className="text-xs font-bold text-amber-700">{result.recommendedSize}</TableCell>
                                  <TableCell className="text-xs">{result.voltageDrop.toFixed(2)}</TableCell>
                                  <TableCell className="text-xs">{result.voltageDropPercent.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Badge className={result.isAcceptable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                      {result.isAcceptable ? t("cables.ok") : t("cables.high")}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Circuit Breaker Results */}
                    {breakerResults.length > 0 && (
                      <div>
                        <h4 className={`font-bold mb-3 ${cardHeaderText} flex items-center gap-2`}>
                          <Shield className="size-4 text-blue-600" />
                          {t("cables.circuitBreaker")}
                        </h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className={darkMode ? "bg-gray-700 hover:bg-gray-700" : "bg-blue-50/80 hover:bg-blue-50/80"}>
                                <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{language === "ar" ? "التطبيق" : "Application"}</TableHead>
                                <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("cables.current")} (A)</TableHead>
                                <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("cables.breakerRating")} (A)</TableHead>
                                <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("cables.breakerType")}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {breakerResults.map((br, i) => {
                                const appMap: Record<string, string> = {
                                  pvString: t("cables.breakerForPV"),
                                  battery: t("cables.breakerForBattery"),
                                  acOutput: t("cables.breakerForAC"),
                                  acMain: t("cables.breakerForMainAC"),
                                };
                                return (
                                  <TableRow key={i}>
                                    <TableCell className="text-xs font-semibold">{appMap[br.application] || br.application}</TableCell>
                                    <TableCell className="text-xs">{br.current.toFixed(1)}</TableCell>
                                    <TableCell className="text-xs font-bold text-blue-700">{br.recommendedRating}</TableCell>
                                    <TableCell><Badge variant="outline" className={br.isDc ? "border-orange-300 text-orange-700" : "border-blue-300 text-blue-700"}>{br.isDc ? "DC" : "AC"}</Badge></TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Grounding Results */}
                    {groundingResult && (
                      <div>
                        <h4 className={`font-bold mb-3 ${cardHeaderText} flex items-center gap-2`}>
                          <Shield className="size-4 text-green-600" />
                          {t("cables.grounding")}
                        </h4>
                        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-lg p-4 ${darkMode ? "bg-gray-700" : "bg-green-50"}`}>
                          <div className="text-center">
                            <p className={`text-xs ${subTextColor}`}>{t("cables.groundingRod")}</p>
                            <p className="text-2xl font-bold text-green-700">{groundingResult.groundingRodCount}</p>
                            <p className="text-xs text-gray-500">({groundingResult.groundingRodLength}m)</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs ${subTextColor}`}>{t("cables.groundingConductor")}</p>
                            <p className="text-2xl font-bold text-green-700">{groundingResult.groundingConductorSize}</p>
                            <p className="text-xs text-gray-500">mm²</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs ${subTextColor}`}>{t("cables.groundingResistance")}</p>
                            <p className="text-2xl font-bold text-green-700">{groundingResult.groundingResistance}</p>
                            <p className="text-xs text-gray-500">Ω</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB 3: ECONOMIC ANALYSIS ===== */}
          <TabsContent value="economics" className="space-y-6">
            {!results ? (
              <Card className={`${cardBg} shadow-sm`}>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="size-12 text-amber-400 mx-auto mb-3" />
                  <p className={`font-semibold ${cardHeaderText}`}>{language === "ar" ? "يرجى حساب المنظومة أولاً" : "Please calculate the system first"}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {economicResults && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Annual Production */}
                    <Card className={`${cardBg} shadow-sm`}>
                      <div className="h-1 bg-gradient-to-l from-amber-400 to-orange-500" />
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="size-5 text-amber-600" />
                          <CardTitle className={`text-lg ${cardHeaderText}`}>{t("econ.annualProduction")}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-amber-700">{formatNumber(economicResults.annualProductionKWh)}</p>
                          <p className={`text-sm ${subTextColor}`}>{t("econ.kwhPerYear")}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* LCOE & Payback */}
                    <Card className={`${cardBg} shadow-sm`}>
                      <div className="h-1 bg-gradient-to-l from-emerald-400 to-green-500" />
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <DollarSign className="size-5 text-emerald-600" />
                          <CardTitle className={`text-lg ${cardHeaderText}`}>{t("econ.lcoe")} & {t("econ.paybackPeriod")}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ResultRow label={t("econ.lcoe")} value={`$${economicResults.lcoe.toFixed(4)}`} unit={t("econ.usdPerKWh")} darkMode={darkMode} />
                        <ResultRow label={t("econ.paybackPeriod")} value={`${economicResults.paybackYears} ${t("econ.years")} ${economicResults.paybackMonths} ${t("econ.months")}`} unit="" highlight darkMode={darkMode} />
                        <ResultRow label={t("econ.totalInvestment")} value={`$${formatUSD(Math.round(results.totalCost))}`} unit="" darkMode={darkMode} />
                      </CardContent>
                    </Card>

                    {/* Monthly Production Chart */}
                    <Card className={`${cardBg} shadow-sm lg:col-span-2`}>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="size-5 text-blue-600" />
                          <CardTitle className={`text-lg ${cardHeaderText}`}>{t("econ.monthlyProduction")}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-end gap-1 sm:gap-2 h-40">
                          {economicResults.monthlyProductionKWh.map((val, i) => {
                            const maxVal = Math.max(...economicResults.monthlyProductionKWh);
                            const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                            const monthNames = language === "ar" ? monthNamesAr : monthNamesEn;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-semibold text-amber-700">{formatNumber(val)}</span>
                                <div
                                  className="w-full rounded-t-sm transition-all"
                                  style={{
                                    height: `${heightPct}%`,
                                    background: "linear-gradient(to top, #f59e0b, #ea580c)",
                                    minHeight: "4px",
                                  }}
                                />
                                <span className="text-[9px] text-gray-500 truncate w-full text-center">{monthNames[i]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Diesel Comparison */}
                    <Card className={`${cardBg} shadow-sm`}>
                      <div className="h-1 bg-gradient-to-l from-red-400 to-orange-500" />
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Fuel className="size-5 text-red-600" />
                          <CardTitle className={`text-lg ${cardHeaderText}`}>{t("econ.dieselComparison")}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ResultRow label={language === "ar" ? "استهلاك الديزل السنوي" : "Annual Diesel Fuel"} value={formatNumber(economicResults.dieselAnnualFuel)} unit={language === "ar" ? "لتر" : "liters"} darkMode={darkMode} />
                        <ResultRow label={t("econ.dieselCost")} value={`$${formatUSD(economicResults.dieselAnnualCost)}`} unit={t("econ.usdPerYear")} darkMode={darkMode} />
                        <ResultRow label={t("econ.dieselSavings")} value={`$${formatUSD(economicResults.annualSavingsVsDiesel)}`} unit={t("econ.usdPerYear")} highlight darkMode={darkMode} />
                      </CardContent>
                    </Card>

                    {/* Grid Comparison & CO2 */}
                    <Card className={`${cardBg} shadow-sm`}>
                      <div className="h-1 bg-gradient-to-l from-green-400 to-emerald-500" />
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Leaf className="size-5 text-green-600" />
                          <CardTitle className={`text-lg ${cardHeaderText}`}>{t("econ.gridComparison")} & CO₂</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ResultRow label={t("econ.gridCost")} value={`$${formatUSD(economicResults.gridAnnualCost)}`} unit={t("econ.usdPerYear")} darkMode={darkMode} />
                        <ResultRow label={t("econ.gridSavings")} value={`$${formatUSD(economicResults.annualSavingsVsGrid)}`} unit={t("econ.usdPerYear")} darkMode={darkMode} />
                        <Separator className={darkMode ? "bg-gray-600" : "bg-green-200"} />
                        <ResultRow label={t("econ.co2Saved")} value={economicResults.co2AvoidedPerYear.toFixed(2)} unit={language === "ar" ? "طن/سنة" : "tons/year"} highlight darkMode={darkMode} />
                      </CardContent>
                    </Card>

                    {/* Financing Calculator */}
                    <Card className={`${cardBg} shadow-sm lg:col-span-2`}>
                      <div className="h-1 bg-gradient-to-l from-purple-400 to-violet-500" />
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <PiggyBank className="size-5 text-purple-600" />
                          <CardTitle className={`text-lg ${cardHeaderText}`}>{t("econ.financing")}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label className={labelColor}>{t("econ.loanAmount")} ($)</Label>
                            <Input type="number" value={financing.loanAmount} onChange={(e) => setFinancing(prev => ({ ...prev, loanAmount: Number(e.target.value) || 0 }))} className={inputClass} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelColor}>{t("econ.interestRate")}</Label>
                            <Input type="number" min={0} max={30} step={0.5} value={financing.interestRate} onChange={(e) => setFinancing(prev => ({ ...prev, interestRate: Number(e.target.value) || 0 }))} className={inputClass} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelColor}>{t("econ.loanTerm")}</Label>
                            <Input type="number" min={1} max={20} value={financing.loanTerm} onChange={(e) => setFinancing(prev => ({ ...prev, loanTerm: Number(e.target.value) || 1 }))} className={inputClass} />
                          </div>
                        </div>
                        {financingResult && (
                          <div className={`mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg p-4 ${darkMode ? "bg-gray-700" : "bg-purple-50"}`}>
                            <div className="text-center">
                              <p className={`text-xs ${subTextColor}`}>{t("econ.monthlyPayment")}</p>
                              <p className="text-2xl font-bold text-purple-700">${formatUSD(Math.round(financingResult.monthlyPayment))}</p>
                            </div>
                            <div className="text-center">
                              <p className={`text-xs ${subTextColor}`}>{t("econ.totalInterest")}</p>
                              <p className="text-2xl font-bold text-red-600">${formatUSD(financingResult.totalInterest)}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ===== TAB 4: BILL OF MATERIALS ===== */}
          <TabsContent value="bom" className="space-y-6">
            <Card className={`${cardBg} shadow-sm`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100"><FileSpreadsheet className="size-5 text-emerald-600" /></div>
                    <CardTitle className={`text-xl ${cardHeaderText}`}>{t("bom.title")}</CardTitle>
                  </div>
                  {bomItems.length > 0 && (
                    <Button onClick={exportBOMCSV} variant="outline" size="sm" className={`gap-1 ${darkMode ? "border-emerald-600 text-emerald-400 hover:bg-gray-700" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}`}>
                      <Download className="size-4" />CSV
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!results ? (
                  <div className={`rounded-lg p-8 text-center ${darkMode ? "bg-gray-700" : "bg-amber-50"}`}>
                    <FileSpreadsheet className="size-12 text-amber-400 mx-auto mb-3" />
                    <p className={`font-semibold ${cardHeaderText}`}>{language === "ar" ? "يرجى حساب المنظومة أولاً" : "Please calculate the system first"}</p>
                  </div>
                ) : bomItems.length === 0 ? (
                  <p className={subTextColor}>{language === "ar" ? "لا توجد مواد" : "No items"}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className={darkMode ? "bg-gray-700 hover:bg-gray-700" : "bg-emerald-50/80 hover:bg-emerald-50/80"}>
                          <TableHead className={`text-right font-bold ${labelColor} text-xs`}>#</TableHead>
                          <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("bom.description")}</TableHead>
                          <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("bom.quantity")}</TableHead>
                          <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("bom.unit")}</TableHead>
                          <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("bom.unitPrice")}</TableHead>
                          <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("bom.totalPrice")}</TableHead>
                          <TableHead className={`text-right font-bold ${labelColor} text-xs`}>{t("bom.notes")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bomItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs">{item.id}</TableCell>
                            <TableCell className="text-xs font-semibold">{language === "en" ? item.descriptionEn : item.description}</TableCell>
                            <TableCell className="text-xs">{item.quantity}</TableCell>
                            <TableCell className="text-xs">{item.unit}</TableCell>
                            <TableCell className="text-xs">${formatUSD(item.unitPrice)}</TableCell>
                            <TableCell className="text-xs font-bold text-emerald-700">${formatUSD(item.totalPrice)}</TableCell>
                            <TableCell className="text-xs text-gray-500">{item.notes}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className={`mt-4 flex justify-end rounded-lg p-3 ${darkMode ? "bg-gray-700" : "bg-emerald-50"}`}>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold ${labelColor}`}>{language === "ar" ? "الإجمالي" : "Total"}:</span>
                        <span className="text-2xl font-bold text-emerald-700">${formatUSD(bomItems.reduce((sum, item) => sum + item.totalPrice, 0))}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB 5: SAVE PROJECTS ===== */}
          <TabsContent value="save" className="space-y-6">
            {/* Save Current Project */}
            <Card className={`${cardBg} shadow-sm`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100"><Save className="size-5 text-amber-600" /></div>
                  <CardTitle className={`text-xl ${cardHeaderText}`}>{t("save.saveCurrent")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    value={projectNameToSave}
                    onChange={(e) => setProjectNameToSave(e.target.value)}
                    placeholder={language === "ar" ? "اسم المشروع" : "Project name"}
                    className={inputClass}
                  />
                  <Button onClick={handleSaveProject} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shrink-0">
                    <Save className="size-4" />
                    {language === "ar" ? "حفظ" : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Saved Projects List */}
            <Card className={`${cardBg} shadow-sm`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100"><FolderOpen className="size-5 text-blue-600" /></div>
                    <CardTitle className={`text-xl ${cardHeaderText}`}>{t("save.savedProjects")}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleExportProjects} variant="outline" size="sm" className={`gap-1 ${darkMode ? "border-blue-600 text-blue-400" : "border-blue-300 text-blue-700"}`}>
                      <Download className="size-3" />{t("save.export")}
                    </Button>
                    <Button onClick={handleImportProjects} variant="outline" size="sm" className={`gap-1 ${darkMode ? "border-blue-600 text-blue-400" : "border-blue-300 text-blue-700"}`}>
                      <Upload className="size-3" />{t("save.import")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {savedProjectsList.length === 0 ? (
                  <div className={`rounded-lg p-8 text-center ${darkMode ? "bg-gray-700" : "bg-amber-50"}`}>
                    <FolderOpen className="size-12 text-amber-400 mx-auto mb-3" />
                    <p className={subTextColor}>{t("save.noProjects")}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {savedProjectsList.map((project) => (
                      <div key={project.id} className={`flex items-center justify-between gap-4 rounded-lg p-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold ${cardHeaderText} truncate`}>{project.name}</p>
                          <p className={`text-xs ${subTextColor}`}>
                            {project.date} | {language === "ar" ? "الاستهلاك" : "Consumption"}: {formatNumber(project.loads.reduce((s, l) => s + l.quantity * l.power * l.hours, 0) / 1000, 2)} kWh | {language === "ar" ? "ألواح" : "Panels"}: {Math.ceil(project.loads.reduce((s, l) => s + l.quantity * l.power * l.hours, 0) / (project.params.sunshineHours * (project.params.systemEfficiency / 100) * project.params.panelWattage))}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button onClick={() => handleLoadProject(project)} variant="outline" size="sm" className="gap-1 border-green-300 text-green-700 hover:bg-green-50">
                            <FolderOpen className="size-3" />{t("save.load")}
                          </Button>
                          <Button onClick={() => handleDeleteProject(project.id)} variant="outline" size="sm" className="gap-1 border-red-300 text-red-700 hover:bg-red-50">
                            <Trash2 className="size-3" />{t("save.delete")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ========== FOOTER ========== */}
      <footer className={`mt-auto border-t py-6 text-center text-sm print-hide ${darkMode ? "border-gray-700 bg-gray-900 text-gray-400" : "border-amber-200/60 bg-amber-50/30 text-gray-500"}`}>
        <div className="flex items-center justify-center gap-2">
          <Sun className="size-4 text-amber-500" />
          <span>{language === "ar" ? "حاسبة المنظومة الشمسية - أداة احترافية لتصميم المنظومات الشمسية" : "Solar System Calculator - Professional Design Tool"}</span>
        </div>
      </footer>
    </div>
  );
}

// ============= Reusable Result Row Component =============
function ResultRow({
  label,
  value,
  unit,
  highlight = false,
  darkMode = false,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
  darkMode?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{label}</span>
      <div className="flex items-center gap-1">
        <span
          className={
            highlight
              ? "text-lg font-bold text-amber-700"
              : `font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`
          }
        >
          {value}
        </span>
        {unit && (
          <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{unit}</span>
        )}
      </div>
    </div>
  );
}
