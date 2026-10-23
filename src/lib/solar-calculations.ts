import {
  cableSpecs,
  breakerSpecs,
  dcBreakerSpecs,
  dieselGeneratorData,
  type CableSpec,
  type BreakerSpec,
  type SolarRadiationData,
} from "./solar-data";

// ============================================================
// Helpers
// ============================================================

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function positiveNumber(value: number, name: string): number {
  if (!isFiniteNumber(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number.`);
  }
  return value;
}

function nonNegativeNumber(value: number, name: string): number {
  if (!isFiniteNumber(value) || value < 0) {
    throw new Error(`${name} must be a non-negative finite number.`);
  }
  return value;
}

function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

// ============================================================
// Cable Sizing Calculations
// ============================================================

export interface CableCalcResult {
  cableType: string;
  current: number;
  cableLength: number;
  voltage: number;
  recommendedSize: number;
  recommendedCable: CableSpec;
  voltageDrop: number;
  voltageDropPercent: number;
  isAcceptable: boolean;
  isDc: boolean;
}

function findCableForCurrent(
  current: number,
  isDc: boolean,
): CableSpec | null {
  const maxCurrentKey = isDc ? "maxCurrentDC" : "maxCurrentAC";

  const suitable = cableSpecs
    .filter((cable) => {
      const capacity = cable[maxCurrentKey];

      return (
        isFiniteNumber(cable.crossSection) &&
        cable.crossSection > 0 &&
        isFiniteNumber(capacity) &&
        capacity >= current &&
        isFiniteNumber(cable.resistancePerKm) &&
        cable.resistancePerKm > 0
      );
    })
    .sort((a, b) => a.crossSection - b.crossSection);

  return suitable.length > 0 ? suitable[0] : null;
}

/**
 * Simplified voltage-drop model:
 * DC: 2 × I × L × R
 * AC: 2 × I × L × R
 *
 * Length is one-way length in metres.
 * Resistance is assumed to be in ohms per kilometre.
 *
 * The AC calculation uses a resistive approximation and does not
 * include cable reactance, installation temperature, or grouping.
 */
export function calculateCableSize(
  cableType: string,
  current: number,
  cableLength: number,
  voltage: number,
  isDc: boolean,
  maxDropPercent: number = isDc ? 3 : 5,
): CableCalcResult {
  positiveNumber(current, "current");
  positiveNumber(cableLength, "cableLength");
  positiveNumber(voltage, "voltage");
  positiveNumber(maxDropPercent, "maxDropPercent");

  const maxCurrentKey = isDc ? "maxCurrentDC" : "maxCurrentAC";
  const lengthKm = cableLength / 1000;

  const candidates = cableSpecs
    .filter((cable) => {
      const capacity = cable[maxCurrentKey];

      return (
        isFiniteNumber(cable.crossSection) &&
        cable.crossSection > 0 &&
        isFiniteNumber(capacity) &&
        capacity >= current &&
        isFiniteNumber(cable.resistancePerKm) &&
        cable.resistancePerKm > 0
      );
    })
    .sort((a, b) => a.crossSection - b.crossSection);

  if (candidates.length === 0) {
    throw new Error(
      `No ${isDc ? "DC" : "AC"} cable in the available cable table can carry ${roundTo(current)} A. Review the cable data or use a cable with a higher rated current.`,
    );
  }

  let selectedCable: CableSpec | null = null;
  let selectedDrop = 0;
  let selectedDropPercent = 0;

  for (const cable of candidates) {
    // Approximate single-phase AC and DC drop.
    // For detailed AC design, include resistance, reactance, and power factor.
    const drop =
      current * lengthKm * cable.resistancePerKm * 2;
    const dropPercent = (drop / voltage) * 100;

    if (dropPercent <= maxDropPercent) {
      selectedCable = cable;
      selectedDrop = drop;
      selectedDropPercent = dropPercent;
      break;
    }
  }

  // If no cable meets the voltage-drop limit, return the largest
  // current-rated cable but explicitly flag the result as unacceptable.
  if (!selectedCable) {
    selectedCable = candidates[candidates.length - 1];

    selectedDrop =
      current * lengthKm * selectedCable.resistancePerKm * 2;

    selectedDropPercent = (selectedDrop / voltage) * 100;
  }

  const capacity = selectedCable[maxCurrentKey];

  const currentCapacityAcceptable =
    isFiniteNumber(capacity) && capacity >= current;

  const voltageDropAcceptable =
    selectedDropPercent <= maxDropPercent;

  return {
    cableType,
    current: roundTo(current),
    cableLength: roundTo(cableLength),
    voltage: roundTo(voltage),
    recommendedSize: selectedCable.crossSection,
    recommendedCable: selectedCable,
    voltageDrop: roundTo(selectedDrop),
    voltageDropPercent: roundTo(selectedDropPercent),
    isAcceptable:
      currentCapacityAcceptable && voltageDropAcceptable,
    isDc,
  };
}

// ============================================================
// Calculate All Cable Sizes
// ============================================================

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
  // Validate inputs.
  positiveNumber(panelImp, "panelImp");
  positiveNumber(panelIsc, "panelIsc");
  positiveNumber(totalStrings, "totalStrings");
  positiveNumber(panelsPerString, "panelsPerString");
  positiveNumber(panelVmp, "panelVmp");
  positiveNumber(stringVmp, "stringVmp");
  positiveNumber(systemVoltage, "systemVoltage");
  nonNegativeNumber(batteryCurrent, "batteryCurrent");
  nonNegativeNumber(inverterPowerAc, "inverterPowerAc");

  // String cable: design current approximation.
  const pvStringCurrent = panelIsc * 1.25;

  const pvStringCable = calculateCableSize(
    "pvString",
    pvStringCurrent,
    pvStringLength,
    stringVmp,
    true,
    3,
  );

  // PV main cable: parallel strings add current, not voltage.
  const pvMainCurrent = totalStrings * panelIsc * 1.25;

  const pvMainCable = calculateCableSize(
    "pvMain",
    pvMainCurrent,
    pvMainLength,
    stringVmp,
    true,
    3,
  );

  // Battery cable: apply a single 1.25 design multiplier here.
  // Check the manufacturer's continuous current and installation conditions.
  const batteryCable = calculateCableSize(
    "battery",
    Math.max(batteryCurrent * 1.25, 0.01),
    batteryLength,
    systemVoltage,
    true,
    3,
  );

  // This existing interface assumes 220 V single-phase AC.
  // It does not provide the power factor or phase configuration.
  const acOutputCurrent = inverterPowerAc / 220;

  const acOutputCable = calculateCableSize(
    "acOutput",
    Math.max(acOutputCurrent, 0.01),
    acOutputLength,
    220,
    false,
    5,
  );

  // Apply a single 1.25 design multiplier for the main AC feeder.
  const acMainCable = calculateCableSize(
    "acMain",
    Math.max(acOutputCurrent * 1.25, 0.01),
    acMainLength,
    220,
    false,
    5,
  );

  return {
    pvStringCable,
    pvMainCable,
    batteryCable,
    acOutputCable,
    acMainCable,
  };
}

// ============================================================
// Circuit Breaker Sizing
// ============================================================

export interface BreakerResult {
  application: string;
  current: number;
  recommendedRating: number;
  recommendedBreaker: BreakerSpec;
  isDc: boolean;
}

function findBreaker(
  designCurrent: number,
  isDc: boolean,
): { rating: number; breaker: BreakerSpec } {
  positiveNumber(designCurrent, "designCurrent");

  const specs = (isDc ? dcBreakerSpecs : breakerSpecs)
    .filter(
      (breaker) =>
        isFiniteNumber(breaker.rating) && breaker.rating > 0,
    )
    .sort((a, b) => a.rating - b.rating);

  const suitable = specs.find(
    (breaker) => breaker.rating >= designCurrent,
  );

  if (suitable) {
    return {
      rating: suitable.rating,
      breaker: suitable,
    };
  }

  if (specs.length === 0) {
    throw new Error(
      `No ${isDc ? "DC" : "AC"} breaker ratings are configured in solar-data.ts.`,
    );
  }

  // Returning the largest available breaker must not be interpreted
  // as an acceptable selection when its rating is below design current.
  throw new Error(
    `No available ${isDc ? "DC" : "AC"} breaker can meet the required design current of ${roundTo(designCurrent)} A. Update the breaker data.`,
  );
}

export function calculateBreakers(
  panelIsc: number,
  totalStrings: number,
  batteryCurrent: number,
  inverterPowerAc: number,
): BreakerResult[] {
  positiveNumber(panelIsc, "panelIsc");
  positiveNumber(totalStrings, "totalStrings");
  nonNegativeNumber(batteryCurrent, "batteryCurrent");
  nonNegativeNumber(inverterPowerAc, "inverterPowerAc");

  const results: BreakerResult[] = [];

  // PV string protection.
  // This multiplier is applied once; findBreaker does not multiply again.
  const pvStringDesignCurrent = panelIsc * 1.56;
  const pvStringBreaker = findBreaker(pvStringDesignCurrent, true);

  results.push({
    application: "pvString",
    current: panelIsc,
    recommendedRating: pvStringBreaker.rating,
    recommendedBreaker: pvStringBreaker.breaker,
    isDc: true,
  });

  // Battery protection.
  const batteryDesignCurrent = Math.max(batteryCurrent * 1.25, 0.01);
  const batteryBreaker = findBreaker(batteryDesignCurrent, true);

  results.push({
    application: "battery",
    current: batteryCurrent,
    recommendedRating: batteryBreaker.rating,
    recommendedBreaker: batteryBreaker.breaker,
    isDc: true,
  });

  // Existing interface assumes 220 V single-phase AC.
  const acCurrent = inverterPowerAc / 220;

  const acOutputBreaker = findBreaker(
    Math.max(acCurrent * 1.25, 0.01),
    false,
  );

  results.push({
    application: "acOutput",
    current: roundTo(acCurrent),
    recommendedRating: acOutputBreaker.rating,
    recommendedBreaker: acOutputBreaker.breaker,
    isDc: false,
  });

  const acMainBreaker = findBreaker(
    Math.max(acCurrent * 1.5, 0.01),
    false,
  );

  results.push({
    application: "acMain",
    current: roundTo(acCurrent),
    recommendedRating: acMainBreaker.rating,
    recommendedBreaker: acMainBreaker.breaker,
    isDc: false,
  });

  return results;
}

// ============================================================
// Grounding Calculations
// ============================================================

export interface GroundingResult {
  groundingRodCount: number;
  groundingConductorSize: number;
  groundingResistance: number;
  groundingRodLength: number;
}

export function calculateGrounding(
  systemVoltage: number,
  totalPower: number,
): GroundingResult {
  positiveNumber(systemVoltage, "systemVoltage");
  nonNegativeNumber(totalPower, "totalPower");

  const rodLength = 3;

  // Preliminary estimate only. Power alone cannot determine
  // the correct number of electrodes or conductor cross-section.
  const rodCount =
    totalPower > 10000 ? 3 : totalPower > 5000 ? 2 : 1;

  const conductorSize = systemVoltage > 48 ? 16 : 10;

  // Approximate resistance of one rod in soil with assumed
  // resistivity of 25 ohm-metres.
  const assumedSoilResistivity = 25;

  const singleRodResistance =
    assumedSoilResistivity / (2 * Math.PI * rodLength);

  // Approximation for multiple rods, not a validated grounding model.
  const spacing = 3;

  const interactionFactor =
    rodCount > 1
      ? 1 + ((rodCount - 1) * rodLength / spacing) * 0.2
      : 1;

  const estimatedResistance =
    singleRodResistance / (rodCount * interactionFactor);

  return {
    groundingRodCount: rodCount,
    groundingConductorSize: conductorSize,
    groundingResistance: roundTo(estimatedResistance),
    groundingRodLength: rodLength,
  };
}

// ============================================================
// Economic Analysis
// ============================================================

export interface EconomicResults {
  annualProductionKWh: number;
  monthlyProductionKWh: number[];
  paybackYears: number;
  paybackMonths: number;
  lcoe: number;
  annualSavingsVsDiesel: number;
  annualSavingsVsGrid: number;
  dieselAnnualCost: number;
  dieselAnnualFuel: number;
  co2AvoidedPerYear: number;
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
  nonNegativeNumber(totalCost, "totalCost");
  nonNegativeNumber(numberOfPanels, "numberOfPanels");
  positiveNumber(panelWattage, "panelWattage");
  nonNegativeNumber(peakSunHours, "peakSunHours");
  nonNegativeNumber(dailyConsumptionKWh, "dailyConsumptionKWh");

  if (
    !isFiniteNumber(systemEfficiency) ||
    systemEfficiency < 0 ||
    systemEfficiency > 100
  ) {
    throw new Error("systemEfficiency must be between 0 and 100.");
  }

  if (
    !isFiniteNumber(inverterEfficiency) ||
    inverterEfficiency < 0 ||
    inverterEfficiency > 100
  ) {
    throw new Error("inverterEfficiency must be between 0 and 100.");
  }

  const psh =
    governorateData &&
    isFiniteNumber(governorateData.peakSunHours) &&
    governorateData.peakSunHours > 0
      ? governorateData.peakSunHours
      : peakSunHours;

  const systemCapacityKw = (numberOfPanels * panelWattage) / 1000;

  // Assumption: systemEfficiency excludes inverter efficiency.
  // If it already includes inverter losses, avoid applying both.
  const overallEfficiency =
    (systemEfficiency / 100) * (inverterEfficiency / 100);

  const annualProductionKWh =
    systemCapacityKw * psh * 365 * overallEfficiency;

  const daysInMonth = [
    31, 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
  ];

  const monthlyProductionKWh: number[] = [];

  if (
    governorateData &&
    Array.isArray(governorateData.monthly) &&
    governorateData.monthly.length >= 12
  ) {
    for (let i = 0; i < 12; i++) {
      const monthlyPsh = governorateData.monthly[i];

      const validMonthlyPsh =
        isFiniteNumber(monthlyPsh) && monthlyPsh >= 0
          ? monthlyPsh
          : psh;

      monthlyProductionKWh.push(
        Math.round(
          systemCapacityKw *
            validMonthlyPsh *
            daysInMonth[i] *
            overallEfficiency,
        ),
      );
    }
  } else {
    for (let i = 0; i < 12; i++) {
      monthlyProductionKWh.push(
        Math.round(annualProductionKWh / 12),
      );
    }
  }

  const systemLifetimeYears = 25;
  const maintenanceCostPerYear = totalCost * 0.01;

  const totalLifetimeProduction =
    annualProductionKWh * systemLifetimeYears;

  const totalLifetimeCost =
    totalCost +
    maintenanceCostPerYear * systemLifetimeYears;

  const lcoe =
    totalLifetimeProduction > 0
      ? totalLifetimeCost / totalLifetimeProduction
      : 0;

  const dieselAnnualFuel =
    annualProductionKWh * dieselGeneratorData.fuelConsumptionPerKWh;

  const dieselAnnualCost =
    dieselAnnualFuel * dieselGeneratorData.dieselPricePerLiter +
    annualProductionKWh * dieselGeneratorData.maintenancePerKWh;

  const annualSolarCost =
    totalCost / systemLifetimeYears + maintenanceCostPerYear;

  const annualSavingsVsDiesel =
    dieselAnnualCost - annualSolarCost;

  // Default estimate only. This should become a user-configurable input.
  const gridPricePerKWh = 0.15;

  // Use energy that can actually be consumed, rather than assuming
  // all PV generation displaces grid or diesel electricity.
  const annualConsumptionKWh = dailyConsumptionKWh * 365;

  const usefulAnnualProductionKWh = Math.min(
    annualProductionKWh,
    annualConsumptionKWh,
  );

  const gridAnnualCost =
    usefulAnnualProductionKWh * gridPricePerKWh;

  const annualSavingsVsGrid =
    gridAnnualCost - annualSolarCost;

  // Simple diesel-displacement estimate; actual emissions depend
  // on generator efficiency and the electricity actually displaced.
  const co2AvoidedPerYear =
    (usefulAnnualProductionKWh * 0.5) / 1000;

  // Do not select the more favourable of two unrelated baselines.
  // This value uses the diesel comparison as the default baseline.
  const paybackYears =
    annualSavingsVsDiesel > 0
      ? totalCost / annualSavingsVsDiesel
      : 0;

  const paybackWholeYears = Math.floor(paybackYears);

  const paybackMonths =
    paybackYears > 0
      ? Math.min(
          11,
          Math.round(
            (paybackYears - paybackWholeYears) * 12,
          ),
        )
      : 0;

  return {
    annualProductionKWh: Math.round(annualProductionKWh),
    monthlyProductionKWh,
    paybackYears: paybackWholeYears,
    paybackMonths,
    lcoe: roundTo(lcoe, 4),
    annualSavingsVsDiesel: Math.round(annualSavingsVsDiesel),
    annualSavingsVsGrid: Math.round(annualSavingsVsGrid),
    dieselAnnualCost: Math.round(dieselAnnualCost),
    dieselAnnualFuel: Math.round(dieselAnnualFuel),
    co2AvoidedPerYear: roundTo(co2AvoidedPerYear),
    gridAnnualCost: Math.round(gridAnnualCost),
    gridPricePerKWh,
  };
}

// ============================================================
// Financing Calculator
// ============================================================

export interface FinancingResult {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
}

export function calculateFinancing(
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number,
): FinancingResult {
  nonNegativeNumber(loanAmount, "loanAmount");
  nonNegativeNumber(annualInterestRate, "annualInterestRate");
  positiveNumber(loanTermYears, "loanTermYears");

  if (loanAmount === 0) {
    return {
      monthlyPayment: 0,
      totalPaid: 0,
      totalInterest: 0,
    };
  }

  const numberOfPayments = Math.round(loanTermYears * 12);

  if (numberOfPayments <= 0) {
    throw new Error("Loan term must result in at least one payment.");
  }

  const monthlyRate = annualInterestRate / 100 / 12;

  if (monthlyRate === 0) {
    const monthlyPayment = loanAmount / numberOfPayments;

    return {
      monthlyPayment: roundTo(monthlyPayment),
      totalPaid: roundTo(loanAmount),
      totalInterest: 0,
    };
  }

  const growth = Math.pow(1 + monthlyRate, numberOfPayments);

  const monthlyPayment =
    loanAmount * (monthlyRate * growth) / (growth - 1);

  const totalPaid = monthlyPayment * numberOfPayments;
  const totalInterest = totalPaid - loanAmount;

  return {
    monthlyPayment: roundTo(monthlyPayment),
    totalPaid: roundTo(totalPaid),
    totalInterest: roundTo(totalInterest),
  };
}

// ============================================================
// BOM (Bill of Materials)
// ============================================================

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

  const safePanelCount = Math.max(0, Math.floor(numberOfPanels));
  const safeStringCount = Math.max(0, Math.floor(totalStrings));
  const safeBatteryCount = Math.max(0, Math.floor(totalBatteries));

  // Solar Panels
  items.push({
    id: id++,
    description: `لوح شمسي ${panelWattage} واط`,
    descriptionEn: `Solar Panel ${panelWattage}W`,
    quantity: safePanelCount,
    unit: "لوح / panel",
    unitPrice:
      safePanelCount > 0
        ? roundTo(Math.max(0, panelCost) / safePanelCount)
        : roundTo(panelWattage * 0.4),
    totalPrice: roundTo(Math.max(0, panelCost)),
    notes: "السعر تقديري ويحتاج إلى تحديث حسب السوق.",
  });

  // Panel Mounting Structure — rough budget estimate.
  items.push({
    id: id++,
    description: "هيكل تركيب الألواح (حامل)",
    descriptionEn: "Panel Mounting Structure",
    quantity: Math.ceil(safePanelCount / 2),
    unit: "مجموعة / set",
    unitPrice: 50,
    totalPrice: Math.ceil(safePanelCount / 2) * 50,
    notes:
      "تقدير أولي فقط؛ يعتمد التصميم الفعلي على أبعاد الألواح والرياح وطريقة التركيب.",
  });

  // Inverter
  items.push({
    id: id++,
    description:
      selectedInverterModelName || `عاكس ${inverterPower} واط`,
    descriptionEn:
      selectedInverterModelName || `Inverter ${inverterPower}W`,
    quantity: 1,
    unit: "وحدة / unit",
    unitPrice: roundTo(Math.max(0, inverterCost)),
    totalPrice: roundTo(Math.max(0, inverterCost)),
    notes: "",
  });

  // Battery Bank
  if (safeBatteryCount > 0) {
    items.push({
      id: id++,
      description:
        selectedBatteryModelName ||
        `بطارية ${batteryCapacity}Ah / ${batteryVoltage}V ${
          batteryType === "lithium" ? "LiFePO4" : "حمض الرصاص"
        }`,
      descriptionEn:
        selectedBatteryModelName ||
        `Battery ${batteryCapacity}Ah / ${batteryVoltage}V ${
          batteryType === "lithium" ? "LiFePO4" : "Lead-Acid"
        }`,
      quantity: safeBatteryCount,
      unit: "بطارية / battery",
      unitPrice: roundTo(
        Math.max(0, batteryCost) / safeBatteryCount,
      ),
      totalPrice: roundTo(Math.max(0, batteryCost)),
      notes:
        batteryType === "lithium"
          ? "تحقق من توافق نظام إدارة البطارية BMS."
          : "",
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
      unitPrice: roundTo(Math.max(0, controllerCost)),
      totalPrice: roundTo(Math.max(0, controllerCost)),
      notes:
        controllerType === "MPPT"
          ? "تحقق من جهد دخل PV وحدود التيار والقدرة."
          : "",
    });
  }

  // Cables
  if (cableResults) {
    const pvStringCable = cableResults.pvStringCable;
    const totalPvStringLength =
      Math.max(0, pvStringLength) * safeStringCount;

    items.push({
      id: id++,
      description: `كابل PV سلسلة ${pvStringCable.recommendedSize} مم²`,
      descriptionEn: `PV String Cable ${pvStringCable.recommendedSize} mm²`,
      quantity: totalPvStringLength,
      unit: "متر / m",
      unitPrice: pvStringCable.recommendedCable.pricePerMeter,
      totalPrice: roundTo(
        totalPvStringLength *
          pvStringCable.recommendedCable.pricePerMeter,
      ),
      notes: "تحقق من تصنيف الكابل للتيار المستمر والأشعة فوق البنفسجية.",
    });

    const pvMainCable = cableResults.pvMainCable;
    const pvMainTotalLength = Math.max(0, pvMainLength) * 2;

    items.push({
      id: id++,
      description: `كابل PV رئيسي ${pvMainCable.recommendedSize} مم²`,
      descriptionEn: `PV Main Cable ${pvMainCable.recommendedSize} mm²`,
      quantity: pvMainTotalLength,
      unit: "متر / m",
      unitPrice: pvMainCable.recommendedCable.pricePerMeter,
      totalPrice: roundTo(
        pvMainTotalLength *
          pvMainCable.recommendedCable.pricePerMeter,
      ),
      notes: "الكمية تفترض موصلين بطول المسار نفسه.",
    });

    const batteryCable = cableResults.batteryCable;
    const batteryTotalLength = Math.max(0, batteryLength) * 2;

    items.push({
      id: id++,
      description: `كابل بطاريات ${batteryCable.recommendedSize} مم²`,
      descriptionEn: `Battery Cable ${batteryCable.recommendedSize} mm²`,
      quantity: batteryTotalLength,
      unit: "متر / m",
      unitPrice: batteryCable.recommendedCable.pricePerMeter,
      totalPrice: roundTo(
        batteryTotalLength *
          batteryCable.recommendedCable.pricePerMeter,
      ),
      notes: "الكمية تفترض موصلين بطول المسار نفسه.",
    });

    const acOutputCable = cableResults.acOutputCable;
    const acMainCable = cableResults.acMainCable;

    items.push({
      id: id++,
      description: `كابل AC خرج العاكس ${acOutputCable.recommendedSize} مم²`,
      descriptionEn: `Inverter AC Output Cable ${acOutputCable.recommendedSize} mm²`,
      quantity: Math.max(0, acOutputLength),
      unit: "متر / m",
      unitPrice: acOutputCable.recommendedCable.pricePerMeter,
      totalPrice: roundTo(
        Math.max(0, acOutputLength) *
          acOutputCable.recommendedCable.pricePerMeter,
      ),
      notes: "تحقق من عدد الموصلات وطول مسار الذهاب والعودة.",
    });

    items.push({
      id: id++,
      description: `كابل AC رئيسي ${acMainCable.recommendedSize} مم²`,
      descriptionEn: `AC Main Cable ${acMainCable.recommendedSize} mm²`,
      quantity: Math.max(0, acMainLength),
      unit: "متر / m",
      unitPrice: acMainCable.recommendedCable.pricePerMeter,
      totalPrice: roundTo(
        Math.max(0, acMainLength) *
          acMainCable.recommendedCable.pricePerMeter,
      ),
      notes: "تحقق من عدد الموصلات وطول مسار الذهاب والعودة.",
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

    const quantity =
      breaker.application === "pvString" ? safeStringCount : 1;

    items.push({
      id: id++,
      description: descAr,
      descriptionEn: descEn,
      quantity,
      unit: "وحدة / unit",
      unitPrice: breaker.recommendedBreaker.price,
      totalPrice: roundTo(
        breaker.recommendedBreaker.price * quantity,
      ),
      notes: appMap[breaker.application] || "",
    });
  });

  // PV Combiner Box
  if (safeStringCount > 1) {
    const combinerPrice = 50 + safeStringCount * 10;

    items.push({
      id: id++,
      description: "صندوق تجميع PV",
      descriptionEn: "PV Combiner Box",
      quantity: 1,
      unit: "وحدة / unit",
      unitPrice: combinerPrice,
      totalPrice: combinerPrice,
      notes: `${safeStringCount} مدخل؛ تحقق من عدد القواطع وSPD وتصنيف الجهد.`,
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
      notes: "المقاومة الفعلية يجب قياسها ميدانيًا.",
    });

    items.push({
      id: id++,
      description: `موصل تأريض ${groundingResult.groundingConductorSize} مم²`,
      descriptionEn: `Grounding Conductor ${groundingResult.groundingConductorSize} mm²`,
      quantity: 10,
      unit: "متر / m",
      unitPrice: 1.5,
      totalPrice: 15,
      notes: "كمية وسعر تقديريان؛ يحدد المقطع وفق متطلبات الحماية.",
    });
  }

  // Battery Rack
  if (safeBatteryCount > 0) {
    const rackPrice = batteryType === "lithium" ? 80 : 40;

    items.push({
      id: id++,
      description: "حامل/خزانة بطاريات",
      descriptionEn: "Battery Rack/Enclosure",
      quantity: 1,
      unit: "مجموعة / set",
      unitPrice: rackPrice,
      totalPrice: rackPrice,
      notes:
        safeBatteryCount > 4
          ? "تحقق من أبعاد الخزانة والتهوية والتحميل."
          : "تقدير أولي.",
    });
  }

  // Surge Protection Device
  items.push({
    id: id++,
    description: "جهاز حماية من زيادة الجهد SPD",
    descriptionEn: "Surge Protection Device (SPD)",
    quantity: 2,
    unit: "وحدة / unit",
    unitPrice: 35,
    totalPrice: 70,
    notes: "افتراض جهاز للجانب DC وآخر AC؛ يجب اختيار النوع والتصنيف المناسبين.",
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

  // MC4 Connectors — budget estimate only.
  const connectorQuantity =
    safePanelCount * 2 + safeStringCount * 2;

  items.push({
    id: id++,
    description: "موصلات MC4",
    descriptionEn: "MC4 Connectors",
    quantity: connectorQuantity,
    unit: "زوج / pair",
    unitPrice: 0.5,
    totalPrice: roundTo(connectorQuantity * 0.5),
    notes: "الكمية الفعلية تعتمد على طريقة تمديد الكابلات وعدد نقاط الاتصال.",
  });

  // Cable Ties & Conduit
  items.push({
    id: id++,
    description: "رباطات كابلات ومواسير",
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

// ============================================================
// Save / Load Project
// ============================================================

export interface SavedProject {
  id: string;
  name: string;
  date: string;
  loads: {
    id: string;
    name: string;
    quantity: number;
    power: number;
    hours: number;
  }[];
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
  panelSpecs: {
    voc: number;
    isc: number;
    vmp: number;
    imp: number;
  };
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

function isSavedProject(value: unknown): value is SavedProject {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const project = value as Partial<SavedProject>;

  return (
    typeof project.id === "string" &&
    typeof project.name === "string" &&
    typeof project.date === "string" &&
    Array.isArray(project.loads) &&
    typeof project.params === "object" &&
    project.params !== null &&
    typeof project.panelSpecs === "object" &&
    project.panelSpecs !== null &&
    typeof project.projectInfo === "object" &&
    project.projectInfo !== null &&
    typeof project.cableLengths === "object" &&
    project.cableLengths !== null &&
    typeof project.selectedGovernorate === "string" &&
    typeof project.selectedBatteryBrand === "string" &&
    typeof project.selectedBatteryModel === "string" &&
    typeof project.selectedInverterBrand === "string" &&
    typeof project.selectedInverterModel === "string"
  );
}

export function saveProject(project: SavedProject): void {
  if (!isSavedProject(project)) {
    return;
  }

  const storage = safeLocalStorage();

  if (!storage) {
    return;
  }

  const projects = loadAllProjects();

  const existingIndex = projects.findIndex(
    (savedProject) => savedProject.id === project.id,
  );

  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Storage unavailable or full.
  }
}

export function loadAllProjects(): SavedProject[] {
  const storage = safeLocalStorage();

  if (!storage) {
    return [];
  }

  try {
    const data = storage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed: unknown = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isSavedProject);
  } catch {
    return [];
  }
}

export function deleteProject(id: string): void {
  const storage = safeLocalStorage();

  if (!storage) {
    return;
  }

  const projects = loadAllProjects().filter(
    (project) => project.id !== id,
  );

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Storage unavailable or full.
  }
}

export function exportProjects(): string {
  return JSON.stringify(loadAllProjects(), null, 2);
}

export function importProjects(json: string): boolean {
  const storage = safeLocalStorage();

  if (!storage) {
    return false;
  }

  try {
    const parsed: unknown = JSON.parse(json);

    if (!Array.isArray(parsed)) {
      return false;
    }

    // Reject the import if any item does not match the expected structure.
    if (!parsed.every(isSavedProject)) {
      return false;
    }

    const imported = parsed as SavedProject[];
    const existing = loadAllProjects();

    const merged = new Map<string, SavedProject>();

    for (const project of existing) {
      merged.set(project.id, project);
    }

    // Imported project with an existing ID updates that project.
    for (const project of imported) {
      merged.set(project.id, project);
    }

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify(Array.from(merged.values())),
    );

    return true;
  } catch {
    return false;
  }
}
