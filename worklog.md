# Solar Calculator - Brand & Model Enhancements Worklog

## Task ID: 1
## Date: 2024-03-05

## Summary of Changes

Updated `/home/z/my-project/src/components/solar-calculator.tsx` with comprehensive brand and model data for batteries and inverters, based on user's real product images (DYNess Powerbox G2 and POWERTEK SNA-EU 14000).

### Changes Made

#### 1. Replaced `lithiumBatteryBrands` (lines 118-177)
- **Before**: Simple brand records with `name`, `capacities`, `notes`
- **After**: Detailed model records with `name`, `models[]` (each having `name`, `voltage`, `capacityAh`, `energyKWh`, `price`), `notes`
- Added **DYNess** as first brand with Powerbox G2 models (100Ah/5.12kWh, 200Ah/10.24kWh, 280Ah/14.34kWh)
- Updated **Pylontech** with US2000C, US3000C, Force H2 models
- Updated **BYD** with Battery Box Premium HVS/HVM models
- Updated **CATL** with EnerOne, EnerOne Plus, EnerOne Mega models
- Updated **SolaX** with Triple Power LFP models (65Ah, 100Ah, 130Ah)
- Updated **Victron Energy** with Lynx Smart BMS models (50Ah, 100Ah)
- Removed Tesla Powerwall and Egyptian Lithium (replaced with DYNess)

#### 2. Replaced `inverterBrands` (lines 179-255)
- **Before**: Simple brand records with `name`, `range`, `type`, `notes`
- **After**: Detailed model records with `name`, `models[]` (each having `name`, `powerW`, `pvVoltageRange`, `mpptCount`, `maxPvPower`, `batteryVoltage`, `notes`, `price`), `type`, `notes`
- Added **Lux Power / POWERTEK** as first brand with SNA-EU 5000-14000 models
- Updated **Growatt** with SPF 5000ES, SPF 8000ES, SPH 10000TL3
- Updated **Deye** with SUN-5K/8K/12K-SG04LP3 models
- Updated **SMA** with Sunny Island 6048, Sunny Boy Storage
- Updated **Victron Energy** with MultiPlus-II and Quattro models
- Updated **Huawei** with SUN2000-5KTL/10KTL
- Updated **Sungrow** with SH5.0RT/SH10RT
- Removed Sol-Ark and MPP Solar brands

#### 3. Updated `CalculationResults` interface (lines 65-105)
- Added `selectedBatteryModelName: string`
- Added `selectedInverterModelName: string`
- Added `selectedBatterySpecs: string`
- Added `selectedInverterSpecs: string`
- Added `matchingBatteryModels: { brand, model, voltage, capacityAh, energyKWh, price }[]`
- Added `matchingInverterModels: { brand, model, powerW, pvVoltageRange, mpptCount, maxPvPower, price }[]`

#### 4. Added new state variables (lines 301-304)
- `selectedBatteryBrand` - tracks selected battery brand key
- `selectedBatteryModel` - tracks selected battery model index
- `selectedInverterBrand` - tracks selected inverter brand key
- `selectedInverterModel` - tracks selected inverter model index

#### 5. Added 51.2V battery voltage option (line 935-937)
- Conditional `SelectItem` for 51.2V shown only when `batteryType === "lithium"`
- This matches the actual voltage of 48V-nominal LiFePO4 batteries

#### 6. Added battery brand/model selection dropdowns (lines 942-996)
- Battery brand dropdown: shown when lithium selected and system is not on-grid
- Battery model dropdown: shows models for selected brand with specs and price
- Auto-fills `batteryCapacity` and `batteryVoltage` from selected model

#### 7. Added inverter brand/model selection dropdowns (lines 999-1053)
- Inverter brand dropdown: filtered by system type compatibility
- Inverter model dropdown: shows models for selected brand with power and price
- Shows brief specs hint below dropdown when model is selected

#### 8. Updated calculate function (lines 448-560)
- **Battery cost**: Uses model's price when specific model selected, falls back to per-Ah calculation
- **Inverter cost**: Uses model's price when specific model selected, falls back to per-watt calculation
- Computes `selectedBatteryModelName`, `selectedInverterModelName`, `selectedBatterySpecs`, `selectedInverterSpecs`
- Computes `matchingBatteryModels` - sorted by closest energy to required storage
- Computes `matchingInverterModels` - filtered by system type and sorted by closest power to recommended
- Added new state variables to useCallback dependency array
- Fixed `seriesBatteries` calculation to use `Math.round()` for 51.2V compatibility

#### 9. Enhanced Card 3 (Batteries) (lines 1356-1368)
- Added "البطارية المحددة" section showing selected model name and specs

#### 10. Enhanced Card 4 (Inverter) (lines 1397-1409)
- Added "العاكس المحدد" section showing selected model name and detailed specs

#### 11. Enhanced Card 8 (Brand Recommendations) (lines 1593-1771)
- Changed to `lg:col-span-2` for wider display
- **Inverter models table**: Shows matching inverter models with brand, model, power, PV range, MPPT, max PV, price
- DYNess/POWERTEK models highlighted with ★ badge and amber background
- Falls back to simple brand list if no matching models
- **Battery models table**: Shows matching battery models with brand, model, voltage, Ah, kWh, price
- DYNess models highlighted with ★ badge and amber background
- Falls back to simple brand list if no matching models
- Added lead-acid battery recommendation section
- Kept charge controller recommendation section

## Build Status
- ✅ Build compiles successfully (`npx next build`)
- ✅ No ESLint errors (`bun run lint`)
- ✅ Dev server running without errors

## Arabic RTL Interface
- All new labels and text are in Arabic
- RTL layout preserved throughout
