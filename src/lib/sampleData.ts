/**
 * SAMPLE DATASETS & DATA WRANGLING HELPERS
 * Provides pre-loaded petroleum/geoscience core, PVT, and log datasets
 * alongside robust parsing, filtering, and summary statistics tools.
 */

import { DatasetColumnMeta, SummaryStatistics } from '../types';

export interface PresetDataset {
  id: string;
  name: string;
  description: string;
  csvContent: string;
}

// Preset 1: Petrophysical Core Plug Data (50 samples)
const CORE_DATA_CSV = `Sample_ID,Depth_m,Porosity_pct,Permeability_mD,Bulk_Density_g_cm3,Grain_Density_g_cm3,Water_Saturation_pct,Facies
CP-101,2150.5,18.4,125.4,2.28,2.65,22.1,Sandstone
CP-102,2151.0,19.2,168.0,2.26,2.65,20.5,Sandstone
CP-103,2151.5,17.8,98.5,2.29,2.66,24.0,Sandstone
CP-104,2152.0,15.1,42.0,2.34,2.65,28.6,Silty Sandstone
CP-105,2152.5,12.3,14.2,2.40,2.66,35.0,Silty Sandstone
CP-106,2153.0,8.5,1.8,2.48,2.67,48.2,Shale
CP-107,2153.5,6.2,0.4,2.53,2.68,58.0,Shale
CP-108,2154.0,14.6,38.5,2.35,2.65,30.2,Silty Sandstone
CP-109,2154.5,20.1,210.0,2.24,2.65,18.5,Sandstone
CP-110,2155.0,22.4,340.5,2.20,2.65,15.2,High-Quality Sandstone
CP-111,2155.5,21.8,295.0,2.21,2.65,16.0,High-Quality Sandstone
CP-112,2156.0,23.5,410.2,2.18,2.64,13.8,High-Quality Sandstone
CP-113,2156.5,20.8,245.0,2.23,2.65,17.4,Sandstone
CP-114,2157.0,18.9,145.0,2.27,2.65,21.0,Sandstone
CP-115,2157.5,16.4,65.2,2.32,2.66,26.5,Sandstone
CP-116,2158.0,13.8,22.8,2.37,2.66,32.0,Silty Sandstone
CP-117,2158.5,11.2,8.4,2.42,2.67,39.5,Silty Sandstone
CP-118,2159.0,7.8,1.2,2.50,2.68,52.0,Shale
CP-119,2159.5,16.8,78.0,2.31,2.65,25.0,Sandstone
CP-120,2160.0,19.8,185.0,2.25,2.65,19.2,Sandstone
CP-121,2160.5,22.0,310.0,2.21,2.65,15.8,High-Quality Sandstone
CP-122,2161.0,24.1,480.0,2.16,2.64,12.5,High-Quality Sandstone
CP-123,2161.5,23.0,380.0,2.19,2.65,14.0,High-Quality Sandstone
CP-124,2162.0,20.5,225.0,2.23,2.65,18.0,Sandstone
CP-125,2162.5,17.5,88.0,2.30,2.66,23.5,Sandstone
CP-126,2163.0,14.2,32.0,2.36,2.66,31.0,Silty Sandstone
CP-127,2163.5,10.5,5.6,2.44,2.67,42.0,Silty Sandstone
CP-128,2164.0,15.8,55.0,2.33,2.65,27.8,Sandstone
CP-129,2164.5,19.0,155.0,2.27,2.65,20.8,Sandstone
CP-130,2165.0,21.5,270.0,2.22,2.65,16.5,High-Quality Sandstone
CP-131,2165.5,22.8,360.0,2.19,2.65,14.5,High-Quality Sandstone
CP-132,2166.0,18.2,115.0,2.28,2.65,22.5,Sandstone
CP-133,2166.5,15.5,48.0,2.34,2.66,28.0,Sandstone
CP-134,2167.0,12.8,18.0,2.39,2.66,34.5,Silty Sandstone
CP-135,2167.5,9.2,2.8,2.46,2.67,46.0,Shale
CP-136,2168.0,16.0,60.0,2.33,2.65,27.0,Sandstone
CP-137,2168.5,19.5,175.0,2.25,2.65,19.8,Sandstone
CP-138,2169.0,21.0,250.0,2.23,2.65,17.0,Sandstone
CP-139,2169.5,22.2,325.0,2.20,2.65,15.5,High-Quality Sandstone
CP-140,2170.0,20.0,200.0,2.24,2.65,18.8,Sandstone
CP-141,2170.5,17.2,82.0,2.30,2.66,24.2,Sandstone
CP-142,2171.0,14.5,35.0,2.35,2.66,30.5,Silty Sandstone
CP-143,2171.5,11.8,11.0,2.41,2.67,38.0,Silty Sandstone
CP-144,2172.0,8.0,1.5,2.49,2.68,50.0,Shale
CP-145,2172.5,15.0,45.0,2.34,2.66,29.0,Sandstone
CP-146,2173.0,18.5,135.0,2.28,2.65,21.5,Sandstone
CP-147,2173.5,20.8,240.0,2.23,2.65,17.6,Sandstone
CP-148,2174.0,23.2,390.0,2.18,2.64,13.2,High-Quality Sandstone
CP-149,2174.5,19.6,180.0,2.25,2.65,19.5,Sandstone
CP-150,2175.0,16.5,68.0,2.32,2.66,26.0,Sandstone`;

// Preset 2: PVT Black Oil Laboratory Fluid Properties
const PVT_DATA_CSV = `Pressure_bar,Oil_FVF_m3_m3,Solution_GOR_m3_m3,Oil_Viscosity_cP,Gas_FVF_m3_m3,Oil_Density_kg_m3
50,1.065,22.5,2.15,0.0210,815.0
75,1.082,34.0,1.92,0.0142,810.0
100,1.101,46.5,1.74,0.0105,804.0
125,1.122,60.2,1.58,0.0082,798.0
150,1.145,75.0,1.45,0.0068,791.0
175,1.170,91.2,1.33,0.0057,784.0
200,1.198,108.5,1.22,0.0049,776.0
210,1.210,116.0,1.18,0.0046,773.0
220,1.222,123.8,1.14,0.0044,770.0
230,1.235,132.0,1.10,0.0042,766.0
240,1.248,140.5,1.07,0.0040,763.0
250,1.262,149.5,1.04,0.0038,759.0
260,1.258,149.5,1.06,0.0038,760.5
270,1.255,149.5,1.08,0.0038,762.0
280,1.251,149.5,1.10,0.0038,763.5
290,1.248,149.5,1.12,0.0038,765.0
300,1.245,149.5,1.14,0.0038,766.5
310,1.242,149.5,1.16,0.0038,768.0
320,1.239,149.5,1.18,0.0038,769.5
330,1.236,149.5,1.20,0.0038,771.0`;

export const PRESET_DATASETS: PresetDataset[] = [
  {
    id: 'core_data',
    name: 'Petrophysical Reservoir Core Analysis Data (50 Samples)',
    description: 'Core plug measurement dataset containing Depth, Porosity, Permeability, Density, Water Saturation, and Facies lithology.',
    csvContent: CORE_DATA_CSV,
  },
  {
    id: 'pvt_data',
    name: 'Black Oil PVT Laboratory Test Series (Differential Liberation)',
    description: 'Fluid PVT laboratory dataset with Pressure, Oil Formation Volume Factor (Bo), Solution GOR (Rs), and Oil Viscosity.',
    csvContent: PVT_DATA_CSV,
  },
];

/**
 * Calculates descriptive summary statistics for an array of numbers
 */
export function calculateColumnStatistics(colName: string, numbers: number[]): SummaryStatistics {
  const validNumbers = numbers.filter((n) => typeof n === 'number' && !isNaN(n) && isFinite(n));
  if (validNumbers.length === 0) {
    return {
      column: colName,
      count: 0,
      mean: 0,
      std: 0,
      min: 0,
      p25: 0,
      median: 0,
      p75: 0,
      max: 0,
    };
  }

  const sorted = [...validNumbers].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const std = Math.sqrt(variance);

  const getPercentile = (p: number) => {
    const idx = (count - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    if (upper >= count) return sorted[count - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  return {
    column: colName,
    count,
    mean,
    std,
    min: sorted[0],
    p25: getPercentile(0.25),
    median: getPercentile(0.5),
    p75: getPercentile(0.75),
    max: sorted[count - 1],
  };
}

/**
 * Detects column metadata and numeric/string types
 */
export function detectColumnMetadata(headers: string[], records: Record<string, unknown>[]): DatasetColumnMeta[] {
  return headers.map((col) => {
    let missingCount = 0;
    const numericValues: number[] = [];

    records.forEach((row) => {
      const val = row[col];
      if (val === undefined || val === null || val === '' || String(val).trim() === '') {
        missingCount++;
      } else {
        const num = Number(val);
        if (!isNaN(num) && isFinite(num)) {
          numericValues.push(num);
        }
      }
    });

    // If over 70% of non-empty values are valid numbers, treat as numeric
    const nonMissingCount = records.length - missingCount;
    const isNumeric = nonMissingCount > 0 && numericValues.length / nonMissingCount >= 0.7;

    if (isNumeric && numericValues.length > 0) {
      const stats = calculateColumnStatistics(col, numericValues);
      return {
        name: col,
        type: 'numeric',
        missingCount,
        min: stats.min,
        max: stats.max,
        mean: stats.mean,
        std: stats.std,
        median: stats.median,
      };
    }

    return {
      name: col,
      type: 'string',
      missingCount,
    };
  });
}
