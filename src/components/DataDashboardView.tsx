import React, { useState, useMemo } from 'react';
import { PageId, DatasetColumnMeta, SummaryStatistics } from '../types';
import {
  PRESET_DATASETS,
  detectColumnMetadata,
  calculateColumnStatistics,
} from '../lib/sampleData';
import { useTheme } from '../lib/ThemeContext';
import Papa from 'papaparse';
import {
  ArrowLeft,
  Database,
  Upload,
  Download,
  Filter,
  BarChart2,
  Table as TableIcon,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface DataDashboardViewProps {
  onNavigate: (page: PageId) => void;
}

export const DataDashboardView: React.FC<DataDashboardViewProps> = ({ onNavigate }) => {
  const { theme } = useTheme();

  // Raw parsed records
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  // Filter State
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterMin, setFilterMin] = useState<number | ''>('');
  const [filterMax, setFilterMax] = useState<number | ''>('');

  // Plot Customization
  const [histogramBins, setHistogramBins] = useState<number>(10);
  const [logScaleY, setLogScaleY] = useState<boolean>(true);

  // Auto-load Core Data preset on initial render
  React.useEffect(() => {
    loadPreset('core_data');
  }, []);

  // Parse CSV File helper
  const handleParseCSV = (file: File) => {
    setParseError(null);
    setFileName(file.name);

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(`CSV Parsing Warning: ${results.errors[0].message}`);
        }
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          setRecords(results.data);
          // Set initial filter column if numeric available
          const meta = detectColumnMetadata(results.meta.fields, results.data);
          const firstNum = meta.find((m) => m.type === 'numeric');
          if (firstNum) {
            setFilterColumn(firstNum.name);
            setFilterMin(firstNum.min ?? '');
            setFilterMax(firstNum.max ?? '');
          }
        }
      },
      error: (err) => {
        setParseError(`Failed to parse CSV file: ${err.message}`);
      },
    });
  };

  // Load Preset helper
  const loadPreset = (presetId: string) => {
    const preset = PRESET_DATASETS.find((p) => p.id === presetId);
    if (!preset) return;
    setParseError(null);
    setFileName(preset.name);

    Papa.parse<Record<string, unknown>>(preset.csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          setRecords(results.data);
          const meta = detectColumnMetadata(results.meta.fields, results.data);
          const firstNum = meta.find((m) => m.type === 'numeric');
          if (firstNum) {
            setFilterColumn(firstNum.name);
            setFilterMin(firstNum.min ?? '');
            setFilterMax(firstNum.max ?? '');
          }
        }
      },
    });
  };

  // Detected Column Metadata
  const columnMetadata: DatasetColumnMeta[] = useMemo(() => {
    if (headers.length === 0 || records.length === 0) return [];
    return detectColumnMetadata(headers, records);
  }, [headers, records]);

  // Available Numeric Column Names
  const numericColumns = useMemo(() => {
    return columnMetadata.filter((m) => m.type === 'numeric').map((m) => m.name);
  }, [columnMetadata]);

  // Summary Statistics for numeric columns
  const summaryStats: SummaryStatistics[] = useMemo(() => {
    if (numericColumns.length === 0 || records.length === 0) return [];
    return numericColumns.map((col) => {
      const vals: number[] = [];
      records.forEach((r) => {
        const v = Number(r[col]);
        if (!isNaN(v) && isFinite(v)) vals.push(v);
      });
      return calculateColumnStatistics(col, vals);
    });
  }, [numericColumns, records]);

  // Filtered Records according to selected filter
  const filteredRecords = useMemo(() => {
    if (!filterColumn || filterMin === '' && filterMax === '') return records;

    return records.filter((r) => {
      const val = Number(r[filterColumn]);
      if (isNaN(val)) return false;
      if (filterMin !== '' && val < filterMin) return false;
      if (filterMax !== '' && val > filterMax) return false;
      return true;
    });
  }, [records, filterColumn, filterMin, filterMax]);

  // Detect Porosity and Permeability column candidates
  const porosityCol = useMemo(() => {
    return headers.find((h) => h.toLowerCase().includes('poros')) || numericColumns[0] || '';
  }, [headers, numericColumns]);

  const permeabilityCol = useMemo(() => {
    return (
      headers.find((h) => h.toLowerCase().includes('perm')) ||
      numericColumns.find((c) => c !== porosityCol) ||
      ''
    );
  }, [headers, numericColumns, porosityCol]);

  // Histogram Data Generation
  const histogramData = useMemo(() => {
    if (!porosityCol || filteredRecords.length === 0) return [];
    const vals = filteredRecords
      .map((r) => Number(r[porosityCol]))
      .filter((v) => !isNaN(v) && isFinite(v));
    if (vals.length === 0) return [];

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (min === max) return [{ binLabel: `${min.toFixed(1)}`, count: vals.length }];

    const binWidth = (max - min) / histogramBins;
    const bins = Array.from({ length: histogramBins }, (_, i) => ({
      binStart: min + i * binWidth,
      binEnd: min + (i + 1) * binWidth,
      binLabel: `${(min + i * binWidth).toFixed(1)} - ${(min + (i + 1) * binWidth).toFixed(1)}`,
      count: 0,
    }));

    vals.forEach((v) => {
      let idx = Math.floor((v - min) / binWidth);
      if (idx >= histogramBins) idx = histogramBins - 1;
      if (idx < 0) idx = 0;
      bins[idx].count++;
    });

    return bins;
  }, [porosityCol, filteredRecords, histogramBins]);

  // Scatter Plot Data (Porosity vs Permeability)
  const scatterData = useMemo(() => {
    if (!porosityCol || !permeabilityCol || filteredRecords.length === 0) return [];
    return filteredRecords
      .map((r) => {
        const x = Number(r[porosityCol]);
        const y = Number(r[permeabilityCol]);
        if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y) && y > 0) {
          return { x, y, id: r['Sample_ID'] || r['Depth_m'] || '' };
        }
        return null;
      })
      .filter(Boolean) as { x: number; y: number; id: unknown }[];
  }, [porosityCol, permeabilityCol, filteredRecords]);

  // Download Filtered CSV
  const handleDownloadFilteredCSV = () => {
    if (filteredRecords.length === 0) return;
    const csv = Papa.unparse(filteredRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `filtered_${fileName || 'dataset'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            ← Back to Engineering Hub
          </button>
          <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            Rock & Fluid Data Dashboard
          </h1>
        </div>

        {filteredRecords.length > 0 && (
          <button
            onClick={handleDownloadFilteredCSV}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download Filtered CSV
          </button>
        )}
      </div>

      {/* Upload & Preset Selector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Box */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <Upload className="w-4 h-4 text-emerald-600" />
            Upload Custom CSV Dataset
          </h2>

          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Click or Drag & Drop .CSV file
              </span>
              <span className="text-[10px] text-slate-500">Accepts .csv engineering data files</span>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleParseCSV(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>
        </div>

        {/* Preset Sample Datasets */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-emerald-600" />
              Pre-Loaded Preset Engineering Datasets
            </h2>
            <p className="text-xs text-slate-500 pt-1">
              Select a sample petroleum geoscience or fluid dataset for instant demonstration:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {PRESET_DATASETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset.id)}
                className="text-left p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-300 transition space-y-1 group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                  {preset.name}
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {parseError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{parseError}</span>
        </div>
      )}

      {records.length > 0 && (
        <>
          {/* Dataset Metadata Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Active Dataset</span>
              <span className="text-sm font-bold text-slate-900 truncate block">{fileName || 'Uploaded Dataset'}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Records</span>
              <span className="text-xl font-black text-slate-900 font-mono">{records.length}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Columns</span>
              <span className="text-xl font-black text-slate-900 font-mono">{headers.length}</span>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-semibold text-emerald-300 uppercase block">Filtered Records</span>
              <span className="text-xl font-black text-white font-mono">{filteredRecords.length}</span>
              <span className="text-[10px] text-slate-300 block">
                {((filteredRecords.length / records.length) * 100).toFixed(0)}% retained
              </span>
            </div>
          </div>

          {/* Dynamic Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-emerald-600" />
              Dynamic Numeric Column Filter
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Select Filter Column
                </label>
                <select
                  value={filterColumn}
                  onChange={(e) => {
                    const col = e.target.value;
                    setFilterColumn(col);
                    const meta = columnMetadata.find((m) => m.name === col);
                    if (meta) {
                      setFilterMin(meta.min ?? '');
                      setFilterMax(meta.max ?? '');
                    }
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {numericColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Minimum Threshold
                </label>
                <input
                  type="number"
                  step="any"
                  value={filterMin}
                  onChange={(e) => setFilterMin(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Min"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Maximum Threshold
                </label>
                <input
                  type="number"
                  step="any"
                  value={filterMax}
                  onChange={(e) => setFilterMax(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Max"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Porosity / Numeric Column Histogram */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  {porosityCol} Frequency Distribution
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Bins:</span>
                  <select
                    value={histogramBins}
                    onChange={(e) => setHistogramBins(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded text-xs px-1.5 py-0.5"
                  >
                    {[5, 10, 15, 20].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="binLabel"
                      tick={{ fontSize: 10 }}
                      label={{
                        value: `${porosityCol} Intervals`,
                        position: 'insideBottom',
                        offset: -15,
                        fontSize: 10,
                        fill: '#64748b',
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      label={{
                        value: 'Frequency Count',
                        angle: -90,
                        position: 'insideLeft',
                        offset: 10,
                        fontSize: 10,
                        fill: '#64748b',
                      }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" name="Sample Count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Porosity vs Permeability Crossplot */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  {porosityCol} vs. {permeabilityCol} Crossplot
                </h3>

                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logScaleY}
                    onChange={(e) => setLogScaleY(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Log Y-Axis</span>
                </label>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="x"
                      name={porosityCol}
                      tick={{ fontSize: 10 }}
                      label={{
                        value: porosityCol,
                        position: 'insideBottom',
                        offset: -15,
                        fontSize: 10,
                        fill: '#64748b',
                      }}
                    />
                    <YAxis
                      dataKey="y"
                      name={permeabilityCol}
                      scale={logScaleY ? 'log' : 'auto'}
                      domain={logScaleY ? ['auto', 'auto'] : [0, 'auto']}
                      tick={{ fontSize: 10 }}
                      label={{
                        value: permeabilityCol,
                        angle: -90,
                        position: 'insideLeft',
                        offset: 0,
                        fontSize: 10,
                        fill: '#64748b',
                      }}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Core Plug Sample" data={scatterData} fill="#059669" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary Statistics Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <TableIcon className="w-4 h-4 text-emerald-600" />
              Numeric Column Summary Statistics
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Column Name</th>
                    <th className="py-2.5 px-3 text-right">Count</th>
                    <th className="py-2.5 px-3 text-right">Mean</th>
                    <th className="py-2.5 px-3 text-right">Std Dev</th>
                    <th className="py-2.5 px-3 text-right">Min</th>
                    <th className="py-2.5 px-3 text-right">25th %</th>
                    <th className="py-2.5 px-3 text-right">Median (50%)</th>
                    <th className="py-2.5 px-3 text-right">75th %</th>
                    <th className="py-2.5 px-3 text-right">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {summaryStats.map((stat) => (
                    <tr key={stat.column} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-sans font-semibold text-slate-900">{stat.column}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{stat.count}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{stat.mean.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{stat.std.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{stat.min.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{stat.p25.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-700">{stat.median.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{stat.p75.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{stat.max.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dataset Preview Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <TableIcon className="w-4 h-4 text-emerald-600" />
                Dataset Records Preview (First 20 Rows)
              </h3>
              <span className="text-[11px] text-slate-500">
                Showing {Math.min(20, filteredRecords.length)} of {filteredRecords.length} filtered rows
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="py-2 px-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredRecords.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {headers.map((h) => (
                        <td key={h} className="py-1.5 px-3 whitespace-nowrap text-slate-700">
                          {String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
