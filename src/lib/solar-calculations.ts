import { cableSpecs, breakerSpecs, dcBreakerSpecs, dieselGeneratorData, yemenGovernorates, type CableSpec, type BreakerSpec, type SolarRadiationData } from "./solar-data";

// ============= Cable Sizing Calculations =============

export interface CableCalcResult {
  cableType: string;
  current: number; // Amps
  cableLength: number; // meters
  voltage: number; // system voltage for DC or 220V for AC
  recommendedSize: number; // mm²
  recommendedCable: CableSpec;
  voltageDrop: number; // volts
  voltageDropPercent: number; // %
  isAcceptable: boolean; // <3% for DC, <5% for AC
  isDc: boolean;
}

function findCableForCurrent(current: number, isDc: boolean): CableSpec {
  const maxCurrentKey = isDc ? "maxCurrentDC" : "maxCurrentAC";
  const suitable = cableSpecs.filter(c => c[maxCurrentKey] >= current);
  return suitable.length > 0 ? suitable[0] : cableSpecs[cableSpecs.length - 1];
}

export function calculateCableSize(
  cableType: string,
  current: number,
  cableLength: number,
  voltage: number,
  isDc: boolean,
  maxDropPercent: number = isDc ? 3 : 5
): CableCalcResult {
  // First find cable based on current capacity
  let recommendedCable = findCableForCurrent(current, isDc);
  
  // Then verify voltage drop and upgrade if needed
  const lengthKm = cableLength / 1000;
  let voltageDrop = current * lengthKm * recommendedCable.resistancePerKm * (isDc ? 2 : 2); // 2 for round trip
  if (!isDc) {
    voltageDrop = current * lengthKm * recommendedCable.resistancePerKm * 2 * 0.8; // power factor 0.8 for AC
  }
  let voltageDropPercent = (voltageDrop / voltage) * 100;
  
  // If voltage drop exceeds limit, find a larger cable
  if (voltageDropPercent > maxDropPercent) {
    for (const cable of cableSpecs) {
      const drop = current * lengthKm * cable.resistancePerKm * (isDc ? 2 : 1.6);
      const dropPct = (drop / voltage) * 100;
      const maxCurrentKey = isDc ? "maxCurrentDC" : "maxCurrentAC";
      if (cable[maxCurrentKey] >= current && dropPct <= maxDropPercent) {
        recommendedCable = cable;
        voltageDrop = drop;
        voltageDropPercent = dropPct;
        break;
      }
    }
  }

  return {
    cableType,
    current,
    cableLength,
    voltage,
    recommendedSize: recommendedCable.crossSection,
    recommendedCable,
    voltageDrop: Math.round(voltageDrop * 100) / 100,
    voltageDropPercent: Math.round(voltageDropPercent * 100) / 100,
    isAcceptable: voltageDropPercent <= maxDropPercent,
    isDc,
  };
}

// Calculate all cable sizes for a solar system
export interface SystemCableResults {
  pvStringCable: CableCalcResult;
  pvMainCable: CableCalcResult;
  batteryCable: CableCalcResult;
  acOutputCable: CableCalcResult;
  acMainCable: CableCalcResult;
}

export function calculateAllCables(
  panelImp: number,
  panelIsc: number,
  totalStrings: number,
  panelsPerString: number,
  panelVmp: number,
  stringVmp: number,
  systemVoltage: number,
  batteryCurrent: number,
  inverterPowerAc: number,
  pvStringLength: number,
  pvMainLength: number,
  batteryLength: number,
  acOutputLength: number,
  acMainLength: number,
): SystemCableResults {
  // PV String cable: current = panel Isc * 1.25 safety factor
  const pvStringCurrent = panelIsc * 1.25;
  const pvStringCable = calculateCableSize(
    "pvString", pvStringCurrent, pvStringLength, stringVmp, true, 3
  );

  // PV Main cable: current = total strings * Isc * 1.25
  const pvMainCurrent = totalStrings * panelIsc * 1.25;
  const pvMainCable = calculateCableSize(
    "pvMain", pvMainCurrent, pvMainLength, stringVmp, true, 3
  );

  // Battery cable: current = inverter DC input current or max charge current
  const batteryCable = calculateCableSize(
    "battery", batteryCurrent * 1.25, batteryLength, systemVoltage, true, 3
  );

  // AC Output cable: current = inverter output current
  const acOutputCurrent = inverterPowerAc / 220; // 220V single phase
  const acOutputCable = calculateCableSize(
    "acOutput", acOutputCurrent, acOutputLength, 220, false, 5
  );

  // AC Main cable
  const acMainCable = calculateCableSize(
    "acMain", acOutputCurrent * 1.25, acMainLength, 220, false, 5
  );

  return {
    pvStringCable,
    pvMainCable,
    batteryCable,
    acOutputCable,
    acMainCable,
  };
}

// ============= Circuit Breaker Sizing =============

export interface BreakerResult {
  application: string;
  current: number;
  recommendedRating: number;
  recommendedBreaker: BreakerSpec;
  isDc: boolean;
}

function findBreaker(current: number, isDc: boolean): { rating: number; breaker: BreakerSpec } {
  const specs = isDc ? dcBreakerSpecs : breakerSpecs;
  const suitable = specs.filter(b => b.rating >= current * 1.25);
  if (suitable.length > 0) {
    return { rating: suitable[0].rating, breaker: suitable[0] };
  }
  const last = specs[specs.length - 1];
  return { rating: last.rating, breaker: last };
}

export function calculateBreakers(
  panelIsc: number,
  totalStrings: number,
  batteryCurrent: number,
  inverterPowerAc: number,
): BreakerResult[] {
  const results: BreakerResult[] = [];

  // PV String protection
  const pvStringBreaker = findBreaker(panelIsc * 1.56, true); // 1.56 factor per NEC
  results.push({
    application: "pvString",
    current: panelIsc,
    recommendedRating: pvStringBreaker.rating,
    recommendedBreaker: pvStringBreaker.breaker,
    isDc: true,
  });

  // Battery protection
  const batteryBreaker = findBreaker(batteryCurrent * 1.25, true);
  results.push({
    application: "battery",
    current: batteryCurrent,
    recommendedRating: batteryBreaker.rating,
    recommendedBreaker: batteryBreaker.breaker,
    isDc: true,
  });

  // AC output protection
  const acCurrent = inverterPowerAc / 220;
  const acBreaker = findBreaker(acCurrent * 1.25, false);
  results.push({
    application: "acOutput",
    current: acCurrent,
    recommendedRating: acBreaker.rating,
    recommendedBreaker: acBreaker.breaker,
    isDc: false,
  });

  // AC Main breaker
  const acMainBreaker = findBreaker(acCurrent * 1.5, false);
  results.push({
    application: "acMain",
    current: acCurrent,
    recommendedRating: acMainBreaker.rating,
    recommendedBreaker: acMainBreaker.breaker,
    isDc: false,
  });

  return results;
}

// ============= Grounding Calculations =============

export interface GroundingResult {
  groundingRodCount: number;
  groundingConductorSize: number; // mm²
  groundingResistance: number; // ohms
  groundingRodLength: number; // meters
}

export function calculateGrounding(systemVoltage: number, totalPower: number): GroundingResult {
  // Based on IEC standards
  const rodLength = 3; // meters standard
  const rodCount = totalPower > 10000 ? 3 : totalPower > 5000 ? 2 : 1;
  const conductorSize = systemVoltage > 48 ? 16 : 10; // mm²
  // Approximate grounding resistance (single rod in normal soil ~25 ohm-m)
  const soilResistivity = 25; // ohm-m for normal soil
  const singleRodResistance = soilResistivity / (2 * Math.PI * rodLength);
  // Parallel rods: R_total = R_single / N * factor
  const spacing = 3; // meters between rods
  const factor = rodCount > 1 ? 1 + (rodCount - 1) * rodLength / spacing * 0.2 : 1;
  const totalResistance = singleRodResistance / (rodCount * factor);
  
  return {
    groundingRodCount: rodCount,
    groundingConductorSize: conductorSize,
    groundingResistance: Math.round(totalResistance * 100) / 100,
    groundingRodLength: rodLength,
  };
}

// ============= Economic Analysis =============

export interface EconomicResults {
  // Annual Production
  annualProductionKWh: number;
  monthlyProductionKWh: number[];
  // Payback Period
  paybackYears: number;
  paybackMonths: number;
  // LCOE (Levelized Cost of Energy)
  lcoe: number; // $/kWh
  // Annual Savings
  annualSavingsVsDiesel: number;
  annualSavingsVsGrid: number;
  // Diesel Comparison
  dieselAnnualCost: number;
  dieselAnnualFuel: number;
  // CO2 avoided
  co2AvoidedPerYear: number; // tons
  // Grid comparison
  gridAnnualCost: number;
  gridPricePerKWh: number;
}

export function calculateEconomics(
  totalCost: number,
  numberOfPanels: number,
  panelWattage: number,
  peakSunHours: number,
  systemEfficiency: number,
  inverterEfficiency: number,
  dailyConsumptionKWh: number,
  governorateData: SolarRadiationData | null,
): EconomicResults {
  const psh = governorateData?.peakSunHours || peakSunHours;
  const systemCapacityKw = (numberOfPanels * panelWattage) / 1000;
  const overallEfficiency = (systemEfficiency / 100) * (inverterEfficiency / 100);
  
  // Annual production
  const annualProductionKWh = systemCapacityKw * psh * 365 * overallEfficiency;
  
  // Monthly production based on governorate data
  const monthlyProductionKWh: number[] = [];
  if (governorateData) {
    for (let i = 0; i < 12; i++) {
      const monthlyPsh = governorateData.monthly[i];
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      monthlyProductionKWh.push(
        Math.round(systemCapacityKw * monthlyPsh * daysInMonth[i] * overallEfficiency)
      );
    }
  } else {
    const monthlyAvg = annualProductionKWh / 12;
    for (let i = 0; i < 12; i++) {
      monthlyProductionKWh.push(Math.round(monthlyAvg));
    }
  }
  
  // LCOE (Levelized Cost of Energy)
  const systemLifetimeYears = 25;
  const totalLifetimeProduction = annualProductionKWh * systemLifetimeYears;
  const maintenanceCostPerYear = totalCost * 0.01; // 1% of initial cost per year
  const totalLifetimeCost = totalCost + (maintenanceCostPerYear * systemLifetimeYears);
  const lcoe = totalLifetimeCost / totalLifetimeProduction;
  
  // Diesel comparison
  const dieselAnnualFuel = annualProductionKWh * dieselGeneratorData.fuelConsumptionPerKWh;
  const dieselAnnualCost = dieselAnnualFuel * dieselGeneratorData.dieselPricePerLiter 
    + annualProductionKWh * dieselGeneratorData.maintenancePerKWh;
  const annualSavingsVsDiesel = dieselAnnualCost - (totalCost / systemLifetimeYears + maintenanceCostPerYear);
  
  // Grid comparison (Yemen grid price ~$0.10-0.15/kWh subsidized, ~$0.30 market)
  const gridPricePerKWh = 0.15; // USD per kWh (subsidized rate)
  const gridAnnualCost = annualProductionKWh * gridPricePerKWh;
  const annualSavingsVsGrid = gridAnnualCost - (totalCost / systemLifetimeYears + maintenanceCostPerYear);
  
  // CO2 avoided (solar avoids ~0.5kg CO2 per kWh vs diesel, ~0.4kg vs grid)
  const co2AvoidedPerYear = (annualProductionKWh * 0.5) / 1000; // tons
  
  // Payback period
  const annualSavings = Math.max(annualSavingsVsDiesel, annualSavingsVsGrid);
  const paybackYears = annualSavings > 0 ? totalCost / annualSavings : 0;
  const paybackWholeYears = Math.floor(paybackYears);
  const paybackMonths = Math.round((paybackYears - paybackWholeYears) * 12);
  
  return {
    annualProductionKWh: Math.round(annualProductionKWh),
    monthlyProductionKWh,
    paybackYears: paybackWholeYears,
    paybackMonths,
    lcoe: Math.round(lcoe * 10000) / 10000,
    annualSavingsVsDiesel: Math.round(annualSavingsVsDiesel),
    annualSavingsVsGrid: Math.round(annualSavingsVsGrid),
    dieselAnnualCost: Math.round(dieselAnnualCost),
    dieselAnnualFuel: Math.round(dieselAnnualFuel),
    co2AvoidedPerYear: Math.round(co2AvoidedPerYear * 100) / 100,
    gridAnnualCost: Math.round(gridAnnualCost),
    gridPricePerKWh,
  };
}

// ============= Financing Calculator =============

export interface FinancingResult {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
}

export function calculateFinancing(
  loanAmount: number,
  annualInterestRate: number, // percentage
  loanTermYears: number
): FinancingResult {
  const monthlyRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  
  if (monthlyRate === 0) {
    const monthlyPayment = loanAmount / numberOfPayments;
    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPaid: Math.round(loanAmount),
      totalInterest: 0,
    };
  }
  
  const monthlyPayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  const totalPaid = monthlyPayment * numberOfPayments;
  const totalInterest = totalPaid - loanAmount;
  
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPaid: Math.round(totalPaid),
    totalInterest: Math.round(totalInterest),
  };
}

// ============= BOM (Bill of Materials) =============

export interface BOMItem {
  id: number;
  description: string;
  descriptionEn: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes: string;
}

export function generateBOM(
  numberOfPanels: number,
  panelWattage: number,
  totalBatteries: number,
  batteryCapacity: number,
  batteryVoltage: number,
  batteryType: string,
  inverterPower: number,
  controllerCurrent: number,
  controllerType: string,
  cableResults: SystemCableResults | null,
  breakerResults: BreakerResult[],
  groundingResult: GroundingResult | null,
  pvStringLength: number,
  pvMainLength: number,
  batteryLength: number,
  acOutputLength: number,
  acMainLength: number,
  totalStrings: number,
  panelsPerString: number,
  selectedBatteryModelName: string,
  selectedInverterModelName: string,
  batteryCost: number,
  inverterCost: number,
  panelCost: number,
  controllerCost: number,
): BOMItem[] {
  const items: BOMItem[] = [];
  let id = 1;

  // Solar Panels
  items.push({
    id: id++,
    description: `لوح شمسي ${panelWattage} واط`,
    descriptionEn: `Solar Panel ${panelWattage}W`,
    quantity: numberOfPanels,
    unit: "لوح / panel",
    unitPrice: Math.round(panelWattage * 0.4),
    totalPrice: Math.round(numberOfPanels * panelWattage * 0.4),
    notes: "",
  });

  // Panel Mounting Structure
  items.push({
    id: id++,
    description: "هيكل تركيب الألواح (حامل)",
    descriptionEn: "Panel Mounting Structure",
    quantity: Math.ceil(numberOfPanels / 2), // 2 panels per rail approximately
    unit: "مجموعة / set",
    unitPrice: 50,
    totalPrice: Math.ceil(numberOfPanels / 2) * 50,
    notes: numberOfPanels > 10 ? "تركيب أرضي موصى به" : "تركيب سقف",
  });

  // Inverter
  items.push({
    id: id++,
    description: selectedInverterModelName || `عاكس ${inverterPower} واط`,
    descriptionEn: selectedInverterModelName || `Inverter ${inverterPower}W`,
    quantity: 1,
    unit: "وحدة / unit",
    unitPrice: Math.round(inverterCost),
    totalPrice: Math.round(inverterCost),
    notes: "",
  });

  // Battery Bank
  if (totalBatteries > 0) {
    items.push({
      id: id++,
      description: selectedBatteryModelName || `بطارية ${batteryCapacity}Ah / ${batteryVoltage}V ${batteryType === "lithium" ? "LiFePO4" : "حمض الرصاص"}`,
      descriptionEn: selectedBatteryModelName || `Battery ${batteryCapacity}Ah / ${batteryVoltage}V ${batteryType === "lithium" ? "LiFePO4" : "Lead-Acid"}`,
      quantity: totalBatteries,
      unit: "بطارية / battery",
      unitPrice: Math.round(batteryCost / totalBatteries),
      totalPrice: Math.round(batteryCost),
      notes: batteryType === "lithium" ? "يتضمن BMS" : "",
    });
  }

  // Charge Controller
  if (controllerCurrent > 0) {
    items.push({
      id: id++,
      description: `منظم شحن ${controllerType} ${controllerCurrent} أمبير`,
      descriptionEn: `Charge Controller ${controllerType} ${controllerCurrent}A`,
      quantity: 1,
      unit: "وحدة / unit",
      unitPrice: Math.round(controllerCost),
      totalPrice: Math.round(controllerCost),
      notes: controllerType === "MPPT" ? "كفاءة أعلى بنسبة 30%" : "",
    });
  }

  // PV String Cables
  if (cableResults) {
    const pvStringCable = cableResults.pvStringCable;
    const totalPvStringLength = pvStringLength * totalStrings;
    items.push({
      id: id++,
      description: `كابل PV سلسلة ${pvStringCable.recommendedSize} مم²`,
      descriptionEn: `PV String Cable ${pvStringCable.recommendedSize} mm²`,
      quantity: totalPvStringLength,
      unit: "متر / m",
      unitPrice: pvStringCable.recommendedCable.pricePerMeter,
      totalPrice: Math.round(totalPvStringLength * pvStringCable.recommendedCable.pricePerMeter),
      notes: "كابل شمسي مقاوم للأشعة UV",
    });

    // PV Main Cable
    const pvMainCable = cableResults.pvMainCable;
    items.push({
      id: id++,
      description: `كابل PV رئيسي ${pvMainCable.recommendedSize} مم²`,
      descriptionEn: `PV Main Cable ${pvMainCable.recommendedSize} mm²`,
      quantity: pvMainLength * 2, // positive and negative
      unit: "متر / m",
      unitPrice: pvMainCable.recommendedCable.pricePerMeter,
      totalPrice: Math.round(pvMainLength * 2 * pvMainCable.recommendedCable.pricePerMeter),
      notes: "",
    });

    // Battery Cable
    const batteryCable = cableResults.batteryCable;
    items.push({
      id: id++,
      description: `كابل بطاريات ${batteryCable.recommendedSize} مم²`,
      descriptionEn: `Battery Cable ${batteryCable.recommendedSize} mm²`,
      quantity: batteryLength * 2,
      unit: "متر / m",
      unitPrice: batteryCable.recommendedCable.pricePerMeter,
      totalPrice: Math.round(batteryLength * 2 * batteryCable.recommendedCable.pricePerMeter),
      notes: "",
    });

    // AC Cables
    const acCable = cableResults.acOutputCable;
    items.push({
      id: id++,
      description: `كابل AC ${acCable.recommendedSize} مم²`,
      descriptionEn: `AC Cable ${acCable.recommendedSize} mm²`,
      quantity: acOutputLength + acMainLength,
      unit: "متر / m",
      unitPrice: acCable.recommendedCable.pricePerMeter,
      totalPrice: Math.round((acOutputLength + acMainLength) * acCable.recommendedCable.pricePerMeter),
      notes: "",
    });
  }

  // Circuit Breakers
  breakerResults.forEach((breaker) => {
    const descAr = breaker.isDc 
      ? `قاطع تيار مستمر ${breaker.recommendedRating} أمبير`
      : `قاطع تيار متردد ${breaker.recommendedRating} أمبير`;
    const descEn = breaker.isDc
      ? `DC Breaker ${breaker.recommendedRating}A`
      : `AC Breaker ${breaker.recommendedRating}A`;
    const appMap: Record<string, string> = {
      pvString: "حماية سلسلة الألواح",
      battery: "حماية البطاريات",
      acOutput: "حماية مخرج العاكس",
      acMain: "قاطع رئيسي AC",
    };
    items.push({
      id: id++,
      description: descAr,
      descriptionEn: descEn,
      quantity: breaker.application === "pvString" ? totalStrings : 1,
      unit: "وحدة / unit",
      unitPrice: breaker.recommendedBreaker.price,
      totalPrice: breaker.recommendedBreaker.price * (breaker.application === "pvString" ? totalStrings : 1),
      notes: appMap[breaker.application] || "",
    });
  });

  // PV Combiner Box
  if (totalStrings > 1) {
    items.push({
      id: id++,
      description: "صندوق تجميع PV",
      descriptionEn: "PV Combiner Box",
      quantity: 1,
      unit: "وحدة / unit",
      unitPrice: 50 + totalStrings * 10,
      totalPrice: 50 + totalStrings * 10,
      notes: `${totalStrings} مدخل`,
    });
  }

  // Grounding
  if (groundingResult) {
    items.push({
      id: id++,
      description: `قضيب تأريض ${groundingResult.groundingRodLength} متر`,
      descriptionEn: `Grounding Rod ${groundingResult.groundingRodLength}m`,
      quantity: groundingResult.groundingRodCount,
      unit: "قضيب / rod",
      unitPrice: 20,
      totalPrice: groundingResult.groundingRodCount * 20,
      notes: `مقاومة ≤ ${groundingResult.groundingResistance} أوم`,
    });
    items.push({
      id: id++,
      description: `موصل تأريض ${groundingResult.groundingConductorSize} مم²`,
      descriptionEn: `Grounding Conductor ${groundingResult.groundingConductorSize} mm²`,
      quantity: 10, // 10 meters typical
      unit: "متر / m",
      unitPrice: 1.5,
      totalPrice: 15,
      notes: "نحاس مجدول",
    });
  }

  // Battery Rack/Enclosure
  if (totalBatteries > 0) {
    items.push({
      id: id++,
      description: "حامل/خزانة بطاريات",
      descriptionEn: "Battery Rack/Enclosure",
      quantity: 1,
      unit: "مجموعة / set",
      unitPrice: batteryType === "lithium" ? 80 : 40,
      totalPrice: batteryType === "lithium" ? 80 : 40,
      notes: totalBatteries > 4 ? "خزانة معدنية مع تهوية" : "حامل معدني",
    });
  }

  // Surge Protection Device
  items.push({
    id: id++,
    description: "جهاز حماية من الصواعق SPD",
    descriptionEn: "Surge Protection Device (SPD)",
    quantity: 2, // DC + AC side
    unit: "وحدة / unit",
    unitPrice: 35,
    totalPrice: 70,
    notes: "DC + AC",
  });

  // Energy Meter
  items.push({
    id: id++,
    description: "عداد طاقة",
    descriptionEn: "Energy Meter",
    quantity: 1,
    unit: "وحدة / unit",
    unitPrice: 25,
    totalPrice: 25,
    notes: "",
  });

  // Connectors MC4
  items.push({
    id: id++,
    description: "موصلات MC4",
    descriptionEn: "MC4 Connectors",
    quantity: numberOfPanels * 2 + totalStrings * 2,
    unit: "زوج / pair",
    unitPrice: 0.5,
    totalPrice: Math.round((numberOfPanels * 2 + totalStrings * 2) * 0.5),
    notes: "",
  });

  // Cable Ties & Conduit
  items.push({
    id: id++,
    description: "رباطات كابلات و مواسير",
    descriptionEn: "Cable Ties & Conduit",
    quantity: 1,
    unit: "مجموعة / set",
    unitPrice: 30,
    totalPrice: 30,
    notes: "",
  });

  // Installation Tools & Misc
  items.push({
    id: id++,
    description: "أدوات تركيب ومتنوعات",
    descriptionEn: "Installation Tools & Misc",
    quantity: 1,
    unit: "مجموعة / set",
    unitPrice: 50,
    totalPrice: 50,
    notes: "",
  });

  return items;
}

// ============= Save/Load Project =============

export interface SavedProject {
  id: string;
  name: string;
  date: string;
  loads: { id: string; name: string; quantity: number; power: number; hours: number }[];
  params: {
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
  };
  panelSpecs: { voc: number; isc: number; vmp: number; imp: number };
  projectInfo: {
    projectName: string;
    clientName: string;
    location: string;
    date: string;
    engineerName: string;
    projectNumber: string;
    notes: string;
  };
  selectedGovernorate: string;
  selectedBatteryBrand: string;
  selectedBatteryModel: string;
  selectedInverterBrand: string;
  selectedInverterModel: string;
  cableLengths: {
    pvString: number;
    pvMain: number;
    battery: number;
    acOutput: number;
    acMain: number;
  };
}

const STORAGE_KEY = "solar-calc-projects";

export function saveProject(project: SavedProject): void {
  const projects = loadAllProjects();
  const existingIndex = projects.findIndex(p => p.id === project.id);
  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Storage full or unavailable
  }
}

export function loadAllProjects(): SavedProject[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function deleteProject(id: string): void {
  const projects = loadAllProjects().filter(p => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Storage full or unavailable
  }
}

export function exportProjects(): string {
  return JSON.stringify(loadAllProjects(), null, 2);
}

export function importProjects(json: string): boolean {
  try {
    const imported = JSON.parse(json) as SavedProject[];
    if (!Array.isArray(imported)) return false;
    const existing = loadAllProjects();
    const existingIds = new Set(existing.map(p => p.id));
    const newProjects = imported.filter(p => !existingIds.has(p.id));
    const all = [...existing, ...newProjects];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}
