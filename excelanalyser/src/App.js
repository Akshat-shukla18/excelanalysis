import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Upload, DollarSign, ShoppingCart, TrendingUp, Package, Filter, Download, Calendar, Users, Award, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import './App.css';
import VisualBuilder from './components/VisualBuilder';

function App() {
  const [data, setData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');
  const [topN, setTopN] = useState({ mode: 'top', n: 10 });
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [builderFilter, setBuilderFilter] = useState(null); // { field, value }
  const [genericMode, setGenericMode] = useState(false);
  const [genericGroupBy, setGenericGroupBy] = useState('');
  const [genericMetric, setGenericMetric] = useState('');
  const [genericAgg, setGenericAgg] = useState('sum'); // sum | avg | count
  // Data quality filters
  const [dqDropExactDup, setDqDropExactDup] = useState(false);
  const [dqDedupColumn, setDqDedupColumn] = useState('');
  const [dqDedupKeys, setDqDedupKeys] = useState([]); // multi-column keys
  const [dqDupMode, setDqDupMode] = useState('exclude'); // exclude | flag
  const [dqShowOnlyFlagged, setDqShowOnlyFlagged] = useState(false);
  const [outlierEnabled, setOutlierEnabled] = useState(false);
  const [outlierColumn, setOutlierColumn] = useState('');
  const [outlierSensitivity, setOutlierSensitivity] = useState('1.5'); // 1.5 or 3
  const [outlierMethod, setOutlierMethod] = useState('iqr'); // iqr | zscore
  const [zscoreThreshold, setZscoreThreshold] = useState('3');
  const [outlierGroupBy, setOutlierGroupBy] = useState('');
  const [outlierMode, setOutlierMode] = useState('exclude'); // exclude | flag
  const [outlierShowOnlyFlagged, setOutlierShowOnlyFlagged] = useState(false);
  
  // Recommended group-by ordering (low-cardinality first)
  const groupByOptions = useMemo(() => {
    if (!data) return [];
    const rows = data.rows || [];
    const headers = data.headers || [];
    const maxSample = Math.min(rows.length, 1000);
    const distinctMap = new Map();
    headers.forEach(h => {
      const set = new Set();
      for (let i = 0; i < maxSample; i++) set.add(String(rows[i]?.[h] ?? ''));
      distinctMap.set(h, set.size);
    });
    const scored = headers.map(h => ({ h, d: distinctMap.get(h) || 0 }));
    // Prefer columns with 2..50 distinct values, then the rest
    const preferred = scored
      .filter(s => s.d >= 2 && s.d <= 50)
      .sort((a,b)=> a.d - b.d)
      .map(s => s.h);
    const rest = headers.filter(h => !preferred.includes(h));
    return [...preferred, ...rest];
  }, [data]);

  // Numeric-first options for Metric Field
  const numericOptions = useMemo(() => {
    if (!data) return [];
    const headers = data.headers || [];
    const rows = data.rows || [];
    const isNumeric = (h) => {
      let countNum = 0;
      for (let i = 0; i < Math.min(rows.length, 100); i++) {
        const v = rows[i]?.[h];
        if (v === undefined || v === null || v === '') continue;
        const n = Number(String(v).replace(/,/g, ''));
        if (!Number.isNaN(n)) countNum++;
      }
      return countNum > 10;
    };
    const nums = headers.filter(isNumeric);
    const rest = headers.filter(h => !nums.includes(h));
    return [...nums, ...rest];
  }, [data]);

  // Excel handling state
  const [excelMeta, setExcelMeta] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [a1Range, setA1Range] = useState('');
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [preview, setPreview] = useState({ headers: [], rows: [] });
  const [diffInfo, setDiffInfo] = useState(null);

  // Snapshots
  const [snapshots, setSnapshots] = useState(() => {
    try {
      const s = localStorage.getItem('dashSnapshots');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('dashSnapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const isXLSX = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    if (isCSV) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const ds = {
              headers: Object.keys(results.data[0]),
              rows: results.data
            };
            setData(ds);
            setExcelMeta(null);
            setDateRange('all');
            setSelectedCategory('all');
            setDiffInfo(null);
            // set generic defaults
            initGenericMode(ds);
          } else {
            setError('Unable to parse CSV file');
          }
        },
        error: (err) => {
          setError('Error reading file: ' + err.message);
        }
      });
      return;
    }

    if (isXLSX) {
      (async () => {
        try {
          const xlsx = await import('xlsx');
          const buf = await file.arrayBuffer();
          const wb = xlsx.read(buf, { type: 'array' });
          const sheetNames = wb.SheetNames || [];
          const first = sheetNames[0];
          const ws = wb.Sheets[first];
          // full grid for preview
          const grid = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
          setExcelMeta({ workbook: wb, sheetNames, grid });
          setSelectedSheet(first || '');
          setHeaderRowIndex(0);
          setA1Range('');
          // build preview
          const headers = (grid[0] || []).map(String);
          const rows = (grid.slice(1, 11) || []).map(r => {
            const obj = {};
            headers.forEach((h, i) => (obj[h || `Column ${i + 1}`] = r[i] ?? ''));
            return obj;
          });
          setPreview({ headers, rows });
          setData(null); // wait for user to apply
        } catch (err) {
          setError('Failed to read Excel file: ' + (err?.message || String(err)));
        }
      })();
      return;
    }

    setError('Unsupported file type. Please upload CSV or Excel (.xlsx)');
  };

  const applyExcelSelection = async () => {
    if (!excelMeta || !selectedSheet) return;
    try {
      const xlsx = await import('xlsx');
      const ws = excelMeta.workbook.Sheets[selectedSheet];
      let range = a1Range && ws ? xlsx.utils.decode_range(a1Range) : xlsx.utils.decode_range(ws['!ref']);
      // extract grid for selected range
      const grid = [];
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const row = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const addr = xlsx.utils.encode_cell({ r: R, c: C });
          row.push(ws[addr]?.w ?? ws[addr]?.v ?? '');
        }
        grid.push(row);
      }
      const hdrRow = grid[headerRowIndex] || [];
      const headers = hdrRow.map((h, i) => (h ? String(h) : `Column ${i + 1}`));
      const body = grid.slice(headerRowIndex + 1).map(r => {
        const obj = {};
        headers.forEach((h, i) => (obj[h] = r[i] ?? ''));
        return obj;
      });
      // preview
      setPreview({ headers, rows: body.slice(0, 10) });

      // compute diff vs previous dataset if any
      if (data) {
        const prevCols = new Set(data.headers);
        const newCols = new Set(headers);
        const added = [...newCols].filter(c => !prevCols.has(c));
        const removed = [...prevCols].filter(c => !newCols.has(c));
        const deltaRows = body.length - data.rows.length;
        setDiffInfo({ added, removed, deltaRows });
      } else {
        setDiffInfo(null);
      }

      // apply as dataset
      const ds = { headers, rows: body };
      setData(ds);
      setDateRange('all');
      setSelectedCategory('all');
      initGenericMode(ds);
    } catch (err) {
      setError('Failed to apply selection: ' + (err?.message || String(err)));
    }
  };

  // Initialize or update generic mode defaults when dataset changes
  const initGenericMode = (ds) => {
    if (!ds) return;
    const headers = ds.headers || [];
    const rows = ds.rows || [];
    const lower = (s) => String(s||'').toLowerCase();
    const has = (frag) => headers.some(h => lower(h).includes(frag));
    const salesLike = has('sales') || has('revenue') || has('amount') || has('profit');
    const productLike = has('product') || has('item');
    const isSales = salesLike || (productLike && (has('price') || has('qty') || has('quantity')));
    // infer numeric & categorical candidates
    const numericFields = headers.filter(h => {
      let countNum = 0;
      for (let i=0; i<Math.min(rows.length,100); i++){
        const v = rows[i]?.[h];
        if (v===undefined || v===null || v==='') continue;
        const n = Number(String(v).replace(/,/g,''));
        if (!Number.isNaN(n)) countNum++;
      }
      return countNum > 10;
    });
    const categoricalFields = headers.filter(h => !numericFields.includes(h));
    setGenericMode(!isSales);
    setGenericMetric(prev => prev || numericFields[0] || headers[0] || '');
    // choose low-cardinality categorical as default group by
    const distinctCount = (col) => {
      const set = new Set();
      for (let i=0; i<Math.min(rows.length, 1000); i++) set.add(String(rows[i]?.[col] ?? ''));
      return set.size;
    };
    const groupCandidates = headers
      .filter(h => !numericFields.includes(h))
      .map(h => ({ h, d: distinctCount(h) }))
      .sort((a,b)=> (a.d - b.d));
    const best = (groupCandidates.find(g => g.d >= 2 && g.d <= 50) || groupCandidates[0] || { h: headers[0] }).h;
    setGenericGroupBy(prev => prev || best || '');
    setGenericAgg('sum');
  };

  const filteredData = useMemo(() => {
    if (!data) return null;

    const dateCol = data.headers.find(h => h.toLowerCase().includes('date'));
    const categoryCol = data.headers.find(h => h.toLowerCase().includes('category'));

    let filtered = [...data.rows];

    if (dateRange !== 'all' && dateCol) {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch(dateRange) {
        case '7days':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          cutoffDate.setDate(now.getDate() - 90);
          break;
        default:
          break;
      }

      filtered = filtered.filter(row => {
        try {
          const rowDate = new Date(row[dateCol]);
          return rowDate >= cutoffDate;
        } catch {
          return true;
        }
      });
    }

    if (selectedCategory !== 'all' && categoryCol) {
      filtered = filtered.filter(row => row[categoryCol] === selectedCategory);
    }

    if (selectedProduct !== 'all') {
      const productCol = data.headers.find(h => h.toLowerCase().includes('product'));
      if (productCol) {
        filtered = filtered.filter(row => row[productCol] === selectedProduct);
      }
    }

    if (builderFilter && data.headers.includes(builderFilter.field)) {
      filtered = filtered.filter(row => String(row[builderFilter.field]) === String(builderFilter.value));
    }

    // Data quality: de-duplication (multi-column + exact, with flagging option)
    let dupRemoved = 0, dupFlagged = 0;
    // Work on shallow copy so we can add flags without mutating original data
    filtered = filtered.map(r => ({ ...r }));
    const keys = (dqDedupKeys && dqDedupKeys.length > 0) ? dqDedupKeys : (dqDedupColumn ? [dqDedupColumn] : []);
    if (keys.length > 0) {
      const seen = new Set();
      const next = [];
      for (const r of filtered) {
        const key = keys.map(k => String(r[k] ?? '')).join('||');
        if (seen.has(key)) {
          if (dqDupMode === 'exclude') {
            dupRemoved++;
            continue;
          } else {
            r._flag_duplicate = true; dupFlagged++;
          }
        } else {
          seen.add(key);
        }
        next.push(r);
      }
      filtered = next;
    }
    if (dqDropExactDup) {
      const seen = new Set();
      const next = [];
      for (const r of filtered) {
        const key = JSON.stringify(r);
        if (seen.has(key)) {
          if (dqDupMode === 'exclude') { dupRemoved++; continue; }
          else { r._flag_duplicate = true; dupFlagged++; }
        } else {
          seen.add(key);
        }
        next.push(r);
      }
      filtered = next;
    }
    if (dqDupMode === 'flag' && dqShowOnlyFlagged) {
      filtered = filtered.filter(r => r._flag_duplicate);
    }

    // Data quality: outlier filter on numeric column using IQR
    let outlierInfo = null; let outRemoved = 0; let outFlagged = 0;
    if (outlierEnabled && outlierColumn && data.headers.includes(outlierColumn)) {
      const column = outlierColumn;
      const byGroup = !!outlierGroupBy && data.headers.includes(outlierGroupBy);
      const groups = new Map();
      // Prepare groups
      filtered.forEach(r => {
        const g = byGroup ? String(r[outlierGroupBy] ?? 'Unknown') : '__ALL__';
        if (!groups.has(g)) groups.set(g, []);
        const n = Number(String(r[column]).replace(/,/g,''));
        groups.get(g).push({ r, n });
      });
      const boundsMap = new Map();
      groups.forEach((arr, g) => {
        const nums = arr.map(x => x.n).filter(v => !Number.isNaN(v));
        if (nums.length < 2) { boundsMap.set(g, null); return; }
        let lo, hi, methodLabel;
        if (outlierMethod === 'zscore') {
          const mean = nums.reduce((a,b)=>a+b,0)/nums.length;
          const variance = nums.reduce((a,b)=>a+(b-mean)*(b-mean),0)/Math.max(1,(nums.length-1));
          const sd = Math.sqrt(variance) || 0;
          const t = parseFloat(zscoreThreshold) || 3;
          lo = mean - t*sd; hi = mean + t*sd; methodLabel = `Z-score ±${t}`;
        } else {
          const sorted = nums.slice().sort((a,b)=>a-b);
          const q1 = sorted[Math.floor(sorted.length*0.25)];
          const q3 = sorted[Math.floor(sorted.length*0.75)];
          const iqr = q3 - q1;
          const m = parseFloat(outlierSensitivity) || 1.5;
          lo = q1 - m*iqr; hi = q3 + m*iqr; methodLabel = `IQR x${m}`;
        }
        boundsMap.set(g, { lo, hi, methodLabel });
      });
      const next = [];
      filtered.forEach(r => {
        const g = byGroup ? String(r[outlierGroupBy] ?? 'Unknown') : '__ALL__';
        const b = boundsMap.get(g);
        if (!b) { next.push(r); return; }
        const n = Number(String(r[column]).replace(/,/g,''));
        if (Number.isNaN(n)) { next.push(r); return; }
        const isOut = !(n >= b.lo && n <= b.hi);
        if (isOut) {
          if (outlierMode === 'exclude') { outRemoved++; return; }
          r._flag_outlier = true; outFlagged++;
        }
        next.push(r);
      });
      filtered = next;
      if (outlierMode === 'flag' && outlierShowOnlyFlagged) {
        filtered = filtered.filter(r => r._flag_outlier);
      }
      outlierInfo = { col: column, method: outlierMethod, groupBy: byGroup ? outlierGroupBy : null, removed: outRemoved, flagged: outFlagged };
    }

    return { ...data, rows: filtered, _dq: { dupRemoved, dupFlagged, outlier: outlierInfo } };
  }, [data, dateRange, selectedCategory, selectedProduct, builderFilter, dqDropExactDup, dqDedupColumn, dqDedupKeys, dqDupMode, dqShowOnlyFlagged, outlierEnabled, outlierColumn, outlierSensitivity, outlierMethod, zscoreThreshold, outlierGroupBy, outlierMode, outlierShowOnlyFlagged]);

  const calculateMetrics = () => {
    if (!filteredData) return null;

    const salesCol = filteredData.headers.find(h => 
      h.toLowerCase().includes('sales') || 
      h.toLowerCase().includes('revenue') || 
      h.toLowerCase().includes('amount')
    );
    
    const quantityCol = filteredData.headers.find(h => 
      h.toLowerCase().includes('quantity') || 
      h.toLowerCase().includes('qty')
    );
    
    const profitCol = filteredData.headers.find(h => h.toLowerCase().includes('profit'));
    const categoryCol = filteredData.headers.find(h => h.toLowerCase().includes('category'));
    const dateCol = filteredData.headers.find(h => h.toLowerCase().includes('date'));
    const productCol = filteredData.headers.find(h => h.toLowerCase().includes('product'));
    const customerCol = filteredData.headers.find(h => 
      h.toLowerCase().includes('customer') || 
      h.toLowerCase().includes('user')
    );

    let totalSales = 0;
    let totalProfit = 0;
    let totalQuantity = 0;
    const categoryData = {};
    const monthlyData = {};
    const productData = {};
    const customerData = new Set();
    const dailyData = {};

    filteredData.rows.forEach(row => {
      const sales = parseFloat(row[salesCol]) || 0;
      const profit = parseFloat(row[profitCol]) || 0;
      const quantity = parseFloat(row[quantityCol]) || 1;
      const category = row[categoryCol] || 'Other';
      const product = row[productCol] || 'Unknown';

      totalSales += sales;
      totalProfit += profit;
      totalQuantity += quantity;

      if (customerCol && row[customerCol]) {
        customerData.add(row[customerCol]);
      }

      if (categoryCol) {
        if (!categoryData[category]) {
          categoryData[category] = { sales: 0, profit: 0, orders: 0 };
        }
        categoryData[category].sales += sales;
        categoryData[category].profit += profit;
        categoryData[category].orders += 1;
      }

      if (productCol) {
        if (!productData[product]) {
          productData[product] = { sales: 0, quantity: 0, profit: 0 };
        }
        productData[product].sales += sales;
        productData[product].quantity += quantity;
        productData[product].profit += profit;
      }

      if (dateCol && row[dateCol]) {
        try {
          const date = new Date(row[dateCol]);
          const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          monthlyData[month] = (monthlyData[month] || 0) + sales;

          const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyData[day] = (dailyData[day] || 0) + sales;
        } catch (e) {}
      }
    });

    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    // If generic mode, compute generic aggregates instead of sales-specific ones
    if (genericMode) {
      const gBy = filteredData.headers.includes(genericGroupBy) ? genericGroupBy : filteredData.headers[0];
      const mField = filteredData.headers.includes(genericMetric) ? genericMetric : filteredData.headers.find(h => h !== gBy) || filteredData.headers[0];
      const groups = {};
      const numsAll = [];
      filteredData.rows.forEach(r => {
        const key = String(r[gBy] ?? 'Unknown');
        const raw = r[mField];
        const n = Number(String(raw).replace(/,/g,''));
        if (!groups[key]) groups[key] = [];
        if (!Number.isNaN(n)) { groups[key].push(n); numsAll.push(n); }
      });
      const aggVal = (arr) => {
        if (genericAgg === 'count') return arr.length;
        const s = arr.reduce((a,b)=>a+b,0);
        if (genericAgg === 'avg') return arr.length ? s/arr.length : 0;
        return s; // sum
      };
      const catData = Object.entries(groups).map(([name, arr]) => ({ name, value: aggVal(arr) }));
      const topGroups = catData.slice().sort((a,b)=> b.value - a.value).slice(0, topN.n);
      // Trend if date exists
      const dCol = filteredData.headers.find(h => h.toLowerCase().includes('date'));
      const monthly = {};
      const daily = {};
      if (dCol) {
        filteredData.rows.forEach(r => {
          const d = new Date(r[dCol]);
          if (isNaN(d)) return;
          const raw = r[mField];
          const n = Number(String(raw).replace(/,/g,''));
          if (Number.isNaN(n)) return;
          const month = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          monthly[month] = (monthly[month] || 0) + n;
          daily[day] = (daily[day] || 0) + n;
        });
      }
      return {
        mode: 'generic',
        metricField: mField,
        groupByField: gBy,
        aggregation: genericAgg,
        metricTotal: aggVal(numsAll.length ? numsAll : new Array(filteredData.rows.length).fill(1)),
        totalRows: filteredData.rows.length,
        distinctGroups: Object.keys(groups).length,
        categoryData: catData,
        monthlyData: Object.entries(monthly).map(([name, value]) => ({ name, value })),
        dailyData: Object.entries(daily).slice(-30).map(([name, value]) => ({ name, value })),
        topProducts: topGroups,
        categories: ['all']
      };
    }

    return {
      mode: 'sales',
      totalSales,
      totalProfit,
      totalQuantity,
      totalOrders: filteredData.rows.length,
      avgOrderValue: totalSales / filteredData.rows.length,
      profitMargin,
      totalCustomers: customerData.size,
      categoryData: Object.entries(categoryData).map(([name, data]) => ({ 
        name, 
        value: data.sales,
        profit: data.profit,
        orders: data.orders 
      })),
      monthlyData: Object.entries(monthlyData).map(([name, value]) => ({ name, value })),
      dailyData: Object.entries(dailyData).slice(-30).map(([name, value]) => ({ name, value })),
      topProducts: Object.entries(productData)
        .sort((a, b) => {
          if (sortBy === 'revenue') return b[1].sales - a[1].sales;
          if (sortBy === 'quantity') return b[1].quantity - a[1].quantity;
          return b[1].profit - a[1].profit;
        })
        .slice(0, topN.n)
        .map(([name, data]) => ({ 
          name, 
          value: data.sales,
          quantity: data.quantity,
          profit: data.profit 
        })),
      categories: categoryCol ? ['all', ...new Set(filteredData.rows.map(r => r[categoryCol]))] : ['all']
    };
  };

  // Simple data profiling
  const profile = useMemo(() => {
    if (!data) return null;
    const cols = data.headers;
    const rows = data.rows;
    const prof = cols.map(col => {
      const values = rows.map(r => r[col]).filter(v => v !== undefined);
      const total = values.length;
      const blanks = values.filter(v => v === null || v === '').length;
      const distinct = new Set(values.map(v => String(v))).size;
      // type inference
      let num = 0, dt = 0, bool = 0;
      const nums = [];
      values.forEach(v => {
        const s = String(v).trim();
        if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'na') return;
        if (s.toLowerCase() === 'true' || s.toLowerCase() === 'false') { bool++; return; }
        const cur = s.replace(/^[₹$€£,\s]+/, '').replace(/,/g,'');
        const n = Number(cur);
        if (!Number.isNaN(n) && isFinite(n)) { num++; nums.push(n); return; }
        const d = Date.parse(s);
        if (!Number.isNaN(d)) { dt++; return; }
      });
      const dominant = num > dt && num > bool ? 'number' : dt > bool ? 'date' : bool > 0 ? 'boolean' : 'text';
      // outliers via IQR
      let outliers = 0;
      if (nums.length > 8) {
        const sorted = nums.slice().sort((a,b)=>a-b);
        const q1 = sorted[Math.floor(sorted.length*0.25)];
        const q3 = sorted[Math.floor(sorted.length*0.75)];
        const iqr = q3 - q1;
        const lo = q1 - 1.5*iqr, hi = q3 + 1.5*iqr;
        outliers = sorted.filter(v => v < lo || v > hi).length;
      }
      return { col, total, blanks, distinct, type: dominant, outliers };
    });
    // duplicates across entire rows
    const dupCount = rows.length - new Set(rows.map(r => JSON.stringify(r))).size;
    return { columns: prof, duplicates: dupCount };
  }, [data]);

  const exportToExcel = async () => {
    if (!filteredData) return;
    try {
      const xlsx = await import('xlsx');
      const wsData = [filteredData.headers, ...filteredData.rows.map(r => filteredData.headers.map(h => r[h]))];
      const ws = xlsx.utils.aoa_to_sheet(wsData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Filtered');
      const fname = `export-${new Date().toISOString().slice(0,10)}.xlsx`;
      xlsx.writeFile(wb, fname);
    } catch (err) {
      setError('Failed to export: ' + (err?.message || String(err)));
    }
  };

  const metrics = filteredData ? calculateMetrics() : null;
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#84cc16'];

  const formatNumber = (value) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value ?? 0);
  const formatCurrency = (value) => {
    if (metrics?.mode === 'generic') return formatNumber(value);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const downloadReport = () => {
    if (!metrics) return;

    let report = '';
    if (metrics.mode === 'generic') {
      report = `DATA SUMMARY REPORT
Generated: ${new Date().toLocaleString()}
Date Range: ${dateRange}

GENERIC SETTINGS
----------------
Group By: ${metrics.groupByField}
Metric: ${metrics.metricField}
Aggregation: ${metrics.aggregation}

KEY METRICS
-----------
Metric Total: ${formatNumber(metrics.metricTotal)}
Total Rows: ${formatNumber(metrics.totalRows)}
Distinct Groups: ${formatNumber(metrics.distinctGroups)}

TOP ${topN.n} ${metrics.groupByField}
${metrics.topProducts.map((p, i) => `${i + 1}. ${p.name}: ${formatNumber(p.value)}`).join('\n')}
`;
    } else {
      report = `E-COMMERCE SALES REPORT
Generated: ${new Date().toLocaleString()}
Date Range: ${dateRange}
Category: ${selectedCategory}

KEY METRICS
-----------
Total Revenue: ${formatCurrency(metrics.totalSales)}
Total Profit: ${formatCurrency(metrics.totalProfit)}
Profit Margin: ${metrics.profitMargin.toFixed(2)}%
Total Orders: ${metrics.totalOrders}
Average Order Value: ${formatCurrency(metrics.avgOrderValue)}
Total Customers: ${metrics.totalCustomers}

TOP PRODUCTS BY ${sortBy.toUpperCase()}
${metrics.topProducts.map((p, i) => `${i + 1}. ${p.name}: ${formatCurrency(p.value)}`).join('\n')}

CATEGORY PERFORMANCE
${metrics.categoryData.map(c => `${c.name}: ${formatCurrency(c.value)}`).join('\n')}
`;
    }

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setDateRange('all');
    setSelectedCategory('all');
    setSortBy('revenue');
    setTopN({ mode: 'top', n: 10 });
    setSelectedProduct('all');
    setBuilderFilter(null);
    setDqDropExactDup(false);
    setDqDedupColumn('');
    setDqDedupKeys([]);
    setDqDupMode('exclude');
    setDqShowOnlyFlagged(false);
    setOutlierEnabled(false);
    setOutlierColumn('');
    setOutlierSensitivity('1.5');
    setOutlierMethod('iqr');
    setZscoreThreshold('3');
    setOutlierGroupBy('');
    setOutlierMode('exclude');
    setOutlierShowOnlyFlagged(false);
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header-section">
          <div className="header-text">
            <h1>E-commerce Sales Dashboard</h1>
            <p>Upload CSV and analyze your sales data with advanced filters</p>
          </div>
          {metrics && (
            <div className="header-actions">
              <button onClick={downloadReport} className="btn btn-primary">
                <Download size={20} />
                Export Report
              </button>
              <button onClick={exportToExcel} className="btn btn-secondary">
                <Download size={20} />
                Export to Excel
              </button>
              <button onClick={resetFilters} className="btn btn-secondary">
                <RefreshCw size={20} />
                Reset
              </button>
            </div>
          )}
        </div>

        <div className="upload-card">
          <label className="upload-area">
            <Upload size={48} className="upload-icon" />
            <span className="upload-text">
              {fileName || 'Click to upload CSV or Excel (.xlsx)'}
            </span>
            <span className="upload-subtext">
              Supports: CSV and Excel; preview and profile before applying
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="file-input"
            />
          </label>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Excel sheet/range picker */}
          {excelMeta && (
            <div>
              <div className="picker-grid">
                <div className="picker-field">
                  <label>Sheet</label>
                  <select value={selectedSheet} onChange={(e)=>setSelectedSheet(e.target.value)}>
                    {excelMeta.sheetNames.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="picker-field">
                  <label>A1 Range (optional)</label>
                  <input placeholder="e.g., A1:F100" value={a1Range} onChange={e=>setA1Range(e.target.value)} />
                </div>
                <div className="picker-field">
                  <label>Header Row Index</label>
                  <select value={headerRowIndex} onChange={e=>setHeaderRowIndex(parseInt(e.target.value||'0',10))}>
                    {Array.from({length: 10}).map((_,i)=> (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="picker-actions">
                <button className="btn btn-primary" onClick={applyExcelSelection}>Apply Selection</button>
              </div>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {preview.headers.map((h,i)=>(<th key={i}>{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((r,ri)=>(
                      <tr key={ri}>
                        {preview.headers.map((h,ci)=>(<td key={ci}>{String(r[h] ?? '')}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {diffInfo && (
                <div className="error-message" style={{background:'#eff6ff', borderColor:'#bfdbfe', color:'#1e40af'}}>
                  Changes vs previous: Rows Δ {diffInfo.deltaRows >=0 ? '+' : ''}{diffInfo.deltaRows}, Added cols: {diffInfo.added.join(', ')||'none'}, Removed cols: {diffInfo.removed.join(', ')||'none'}
                </div>
              )}
            </div>
          )}
        </div>

        {metrics && (
          <>
            {/* Active Filters tags */}
            <div className="snapshots-card" style={{padding:'0.75rem 1rem'}}>
              <div className="snapshots-list">
                {dateRange !== 'all' && (
                  <span className="tag">Date: {dateRange} <button onClick={()=>setDateRange('all')}>×</button></span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="tag">Category: {selectedCategory} <button onClick={()=>setSelectedCategory('all')}>×</button></span>
                )}
                {selectedProduct !== 'all' && (
                  <span className="tag">Product: {selectedProduct} <button onClick={()=>setSelectedProduct('all')}>×</button></span>
                )}
                {builderFilter && (
                  <span className="tag">{builderFilter.field}: {String(builderFilter.value)} <button onClick={()=>setBuilderFilter(null)}>×</button></span>
                )}
                {(dqDropExactDup || dqDedupColumn || (dqDedupKeys && dqDedupKeys.length>0)) && (
                  <span className="tag">De-dup {dqDedupKeys && dqDedupKeys.length>0 ? `by ${dqDedupKeys.join(', ')}` : (dqDedupColumn ? `by ${dqDedupColumn}` : 'exact rows')} ({dqDupMode}) <button onClick={()=>{setDqDropExactDup(false); setDqDedupColumn(''); setDqDedupKeys([]);}}>×</button></span>
                )}
                {outlierEnabled && (
                  <span className="tag">Outliers: {outlierColumn||'n/a'} {outlierMethod==='iqr' ? `IQR×${outlierSensitivity}` : `Z±${zscoreThreshold}`} {outlierGroupBy?`by ${outlierGroupBy}`:''} ({outlierMode}) <button onClick={()=>setOutlierEnabled(false)}>×</button></span>
                )}
                {(dateRange !== 'all' || selectedCategory !== 'all' || selectedProduct !== 'all' || builderFilter || dqDropExactDup || dqDedupColumn || (dqDedupKeys&&dqDedupKeys.length>0) || outlierEnabled) && (
                  <span className="tag"><button onClick={resetFilters}>Clear All</button></span>
                )}
              </div>
            </div>
            {/* Data profile */}
            {profile && (
              <div className="profile-card">
                <h3>Data Profile</h3>
                <div className="profile-grid">
                  <table>
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Distinct</th>
                        <th>Blanks</th>
                        <th>Outliers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.columns.map((c)=> (
                        <tr key={c.col}>
                          <td className="font-medium">{c.col}</td>
                          <td>{c.type}</td>
                          <td>{c.distinct}</td>
                          <td>{c.blanks}</td>
                          <td>{c.outliers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{marginTop:'0.5rem', color:'#475569', fontSize:'0.85rem'}}>
                  Duplicate rows detected: {profile.duplicates}
                </div>
              </div>
            )}
            <div className="filter-card">
              <div className="filter-header">
                <Filter size={20} />
                <h3>Filters</h3>
              </div>
              <div className="filter-grid">
                <div className="filter-group">
                  <label>
                    <Calendar size={16} />
                    Date Range
                  </label>
                  <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option value="all">All Time</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                  </select>
                </div>
                {metrics.mode !== 'generic' && (
                  <>
                    <div className="filter-group">
                      <label>
                        <Package size={16} />
                        Category
                      </label>
                      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        {metrics.categories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat === 'all' ? 'All Categories' : cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>
                        <Award size={16} />
                        Sort Products By
                      </label>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="revenue">Revenue</option>
                        <option value="quantity">Quantity Sold</option>
                        <option value="profit">Profit</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="filter-group">
                  <label>
                    <Award size={16} />
                    Top/Bottom N
                  </label>
                  <div style={{display:'flex', gap:'0.5rem'}}>
                    <select value={topN.mode} onChange={e=>setTopN(s=>({...s, mode:e.target.value}))}>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                    <select value={topN.n} onChange={e=>setTopN(s=>({...s, n: parseInt(e.target.value,10)}))}>
                      {[5,10,15,20].map(n=>(<option key={n} value={n}>{n}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Generic controls */}
            {metrics.mode === 'generic' && (
              <div className="filter-card">
                <div className="filter-header">
                  <Filter size={20} />
                  <h3>Generic Controls</h3>
                </div>
                <div className="filter-grid">
                  <div className="filter-group">
                    <label>Group By</label>
                    <select value={genericGroupBy} onChange={(e)=> setGenericGroupBy(e.target.value)}>
                      {groupByOptions.map((h, idx) => (
                        <option key={h} value={h}>{h}{idx < 5 ? ' (rec)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Metric Field</label>
                    <select value={genericMetric} onChange={(e)=> setGenericMetric(e.target.value)}>
                      {numericOptions.map(h => (<option key={h} value={h}>{h}</option>))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Aggregation</label>
                    <select value={genericAgg} onChange={(e)=> setGenericAgg(e.target.value)}>
                      <option value="sum">Sum</option>
                      <option value="avg">Average</option>
                      <option value="count">Count</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Data Quality Filters */}
            <div className="filter-card">
              <div className="filter-header">
                <Filter size={20} />
                <h3>Data Quality Filters</h3>
              </div>
              <div className="filter-grid">
                <div className="filter-group">
                  <label>Duplicates</label>
                  <div style={{display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap'}}>
                    <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                      <span style={{color:'#475569', fontSize:'0.85rem'}}>Action</span>
                      <select value={dqDupMode} onChange={e=>setDqDupMode(e.target.value)}>
                        <option value="exclude">Exclude</option>
                        <option value="flag">Flag</option>
                      </select>
                      {dqDupMode === 'flag' && (
                        <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                          <input type="checkbox" checked={dqShowOnlyFlagged} onChange={e=>setDqShowOnlyFlagged(e.target.checked)} />
                          Show flagged only
                        </label>
                      )}
                    </div>
                    <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                      <input type="checkbox" checked={dqDropExactDup} onChange={e=>setDqDropExactDup(e.target.checked)} />
                      Treat exact duplicate rows as duplicates
                    </label>
                    <div style={{display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap'}}>
                      <span style={{color:'#475569', fontSize:'0.85rem'}}>De-duplicate by columns</span>
                      <select multiple value={dqDedupKeys} onChange={(e)=> setDqDedupKeys(Array.from(e.target.selectedOptions, o=>o.value))} style={{minWidth:'200px', height:'80px'}}>
                        {filteredData.headers.map(h => (<option key={h} value={h}>{h}</option>))}
                      </select>
                      <span style={{color:'#94a3b8', fontSize:'0.8rem'}}>(Ctrl/Cmd-click to select multiple)</span>
                    </div>
                  </div>
                  {filteredData?._dq && (
                    <div style={{color:'#64748b', fontSize:'0.8rem', marginTop:'0.25rem'}}>
                      Removed: {filteredData._dq.dupRemoved} | Flagged: {filteredData._dq.dupFlagged || 0}
                    </div>
                  )}
                </div>
                <div className="filter-group">
                  <label>Outliers</label>
                  <div style={{display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                      <input type="checkbox" checked={outlierEnabled} onChange={e=>setOutlierEnabled(e.target.checked)} />
                      Enable outlier handling
                    </label>
                    <select disabled={!outlierEnabled} value={outlierColumn} onChange={e=>setOutlierColumn(e.target.value)}>
                      <option value="">Select column</option>
                      {numericOptions.map(h => (<option key={h} value={h}>{h}</option>))}
                    </select>
                    <select disabled={!outlierEnabled} value={outlierMethod} onChange={e=>setOutlierMethod(e.target.value)}>
                      <option value="iqr">IQR</option>
                      <option value="zscore">Z-score</option>
                    </select>
                    {outlierMethod === 'iqr' ? (
                      <select disabled={!outlierEnabled} value={outlierSensitivity} onChange={e=>setOutlierSensitivity(e.target.value)}>
                        <option value="1.5">IQR x1.5 (Standard)</option>
                        <option value="3">IQR x3 (Conservative)</option>
                      </select>
                    ) : (
                      <select disabled={!outlierEnabled} value={zscoreThreshold} onChange={e=>setZscoreThreshold(e.target.value)}>
                        <option value="2">Z ±2</option>
                        <option value="3">Z ±3</option>
                        <option value="4">Z ±4</option>
                      </select>
                    )}
                    <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                      <span style={{color:'#475569', fontSize:'0.85rem'}}>Per group</span>
                      <select disabled={!outlierEnabled} value={outlierGroupBy} onChange={e=>setOutlierGroupBy(e.target.value)}>
                        <option value="">None</option>
                        {groupByOptions.map(h => (<option key={h} value={h}>{h}</option>))}
                      </select>
                    </div>
                    <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                      <span style={{color:'#475569', fontSize:'0.85rem'}}>Action</span>
                      <select disabled={!outlierEnabled} value={outlierMode} onChange={e=>setOutlierMode(e.target.value)}>
                        <option value="exclude">Exclude</option>
                        <option value="flag">Flag</option>
                      </select>
                      {outlierMode === 'flag' && (
                        <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                          <input type="checkbox" disabled={!outlierEnabled} checked={outlierShowOnlyFlagged} onChange={e=>setOutlierShowOnlyFlagged(e.target.checked)} />
                          Show flagged only
                        </label>
                      )}
                    </div>
                  </div>
                  {filteredData?._dq?.outlier && (
                    <div style={{color:'#64748b', fontSize:'0.8rem', marginTop:'0.25rem'}}>
                      Method: {filteredData._dq.outlier.method}{filteredData._dq.outlier.groupBy ? ` by ${filteredData._dq.outlier.groupBy}` : ''} | Removed: {filteredData._dq.outlier.removed} | Flagged: {filteredData._dq.outlier.flagged}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="kpi-grid">
              {metrics.mode !== 'generic' ? (
                <>
                  <div className="kpi-card blue">
                    <div className="kpi-header">
                      <span>Total Revenue</span>
                      <DollarSign size={32} />
                    </div>
                    <div className="kpi-value">{formatCurrency(metrics.totalSales)}</div>
                    <div className="kpi-subtext">Margin: {metrics.profitMargin.toFixed(1)}%</div>
                  </div>
                  <div className="kpi-card purple">
                    <div className="kpi-header">
                      <span>Total Orders</span>
                      <ShoppingCart size={32} />
                    </div>
                    <div className="kpi-value">{metrics.totalOrders.toLocaleString()}</div>
                    <div className="kpi-subtext">Items: {metrics.totalQuantity.toLocaleString()}</div>
                  </div>
                  <div className="kpi-card green">
                    <div className="kpi-header">
                      <span>Total Profit</span>
                      <TrendingUp size={32} />
                    </div>
                    <div className="kpi-value">{formatCurrency(metrics.totalProfit)}</div>
                    <div className="kpi-subtext">AOV: {formatCurrency(metrics.avgOrderValue)}</div>
                  </div>
                  <div className="kpi-card orange">
                    <div className="kpi-header">
                      <span>Customers</span>
                      <Users size={32} />
                    </div>
                    <div className="kpi-value">{metrics.totalCustomers > 0 ? metrics.totalCustomers.toLocaleString() : 'N/A'}</div>
                    <div className="kpi-subtext">{metrics.totalCustomers > 0 ? `Avg: ${formatCurrency(metrics.totalSales / metrics.totalCustomers)}` : 'No data'}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="kpi-card blue">
                    <div className="kpi-header"><span>Metric Total</span></div>
                    <div className="kpi-value">{formatNumber(metrics.metricTotal)}</div>
                    <div className="kpi-subtext">Field: {metrics.metricField}, Agg: {metrics.aggregation}</div>
                  </div>
                  <div className="kpi-card purple">
                    <div className="kpi-header"><span>Total Rows</span></div>
                    <div className="kpi-value">{formatNumber(metrics.totalRows)}</div>
                    <div className="kpi-subtext">Records</div>
                  </div>
                  <div className="kpi-card green">
                    <div className="kpi-header"><span>Distinct Groups</span></div>
                    <div className="kpi-value">{formatNumber(metrics.distinctGroups)}</div>
                    <div className="kpi-subtext">Group By: {metrics.groupByField}</div>
                  </div>
                  <div className="kpi-card orange">
                    <div className="kpi-header"><span>Builder Active</span></div>
                    <div className="kpi-value">{builderFilter ? 'Yes' : 'No'}</div>
                    <div className="kpi-subtext">Click charts to filter</div>
                  </div>
                </>
              )}
            </div>

            <div className="charts-grid">
              {/* Visual Builder Card */}
              {filteredData && (
                <div className="chart-card">
                  <VisualBuilder
                    dataset={filteredData}
                    onFilterSelect={(value, field)=> setBuilderFilter({ field, value })}
                  />
                </div>
              )}
              {(metrics.dailyData.length > 0 || metrics.monthlyData.length > 0) && (
                <div className="chart-card">
                  <h3>{metrics.mode === 'generic' ? `Trend of ${metrics.metricField}` : 'Sales Trend'}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={metrics.dailyData.length > 0 ? metrics.dailyData : metrics.monthlyData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Generic histogram when no date */}
              {metrics.mode === 'generic' && metrics.dailyData.length === 0 && metrics.monthlyData.length === 0 && filteredData && (
                (()=>{
                  // Build histogram buckets for the selected metric
                  const field = metrics.metricField;
                  const values = filteredData.rows
                    .map(r => Number(String(r[field]).replace(/,/g,'')))
                    .filter(v => !Number.isNaN(v))
                    .sort((a,b)=>a-b);
                  if (values.length < 2) return null;
                  const n = values.length;
                  const k = Math.min(20, Math.max(5, Math.ceil(Math.log2(n) + 1))); // Sturges
                  const min = values[0];
                  const max = values[values.length-1];
                  const width = (max - min) / k || 1;
                  const buckets = new Array(k).fill(0);
                  values.forEach(v => {
                    let idx = Math.floor((v - min) / width);
                    if (idx >= k) idx = k - 1;
                    if (idx < 0) idx = 0;
                    buckets[idx]++;
                  });
                  const dataH = buckets.map((c,i) => {
                    const lo = Math.round(min + i*width);
                    const hi = Math.round(min + (i+1)*width);
                    return { name: `${lo}–${hi}`, count: c };
                  });
                  return (
                    <div className="chart-card">
                      <h3>Distribution of {metrics.metricField}</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dataH}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip />
                          <Bar dataKey="count" fill="#06b6d4" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()
              )}

              {metrics.categoryData.length > 0 && (
                <div className="chart-card">
                  <h3>{metrics.mode === 'generic' ? `Share by ${metrics.groupByField}` : 'Sales by Category'}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {metrics.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} onClick={() => {
                            if (metrics.mode === 'generic') setBuilderFilter({ field: metrics.groupByField, value: entry.name });
                            else setSelectedCategory(entry.name);
                          }} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {metrics.topProducts.length > 0 && (
              <div className="chart-card full-width">
                <h3>{metrics.mode === 'generic' ? `Top ${topN.n} ${metrics.groupByField}` : `Top 10 Products by ${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}`}</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topN.mode === 'top' ? metrics.topProducts : [...metrics.topProducts].reverse()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" />
                    <YAxis dataKey="name" type="category" stroke="#64748b" width={150} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} onClick={(d)=> {
                      const name = d?.payload?.name;
                      if (!name) return;
                      if (metrics.mode === 'generic') setBuilderFilter({ field: metrics.groupByField, value: name });
                      else setSelectedProduct(name);
                    }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Snapshots */}
            <div className="snapshots-card">
              <div className="filter-header"><h3>Scenario Snapshots</h3></div>
              <div className="picker-actions">
                <button className="btn btn-secondary" onClick={()=>{
                  const snap = {
                    name: `Snap ${snapshots.length+1}`,
                    date: new Date().toISOString(),
                    state: { dateRange, selectedCategory, sortBy, topN, selectedSheet, a1Range, headerRowIndex, genericMode, genericGroupBy, genericMetric, genericAgg, dqDropExactDup, dqDedupColumn, dqDedupKeys, dqDupMode, dqShowOnlyFlagged, outlierEnabled, outlierColumn, outlierSensitivity, outlierMethod, zscoreThreshold, outlierGroupBy, outlierMode, outlierShowOnlyFlagged }
                  };
                  setSnapshots([...snapshots, snap]);
                }}>Save Snapshot</button>
              </div>
              <div className="snapshots-list" style={{marginTop:'0.5rem'}}>
                {snapshots.map((s, idx) => (
                  <span key={idx} className="tag">
                    {s.name}
                    <button title="Apply" onClick={()=>{
                      const st = s.state;
                      setDateRange(st.dateRange);
                      setSelectedCategory(st.selectedCategory);
                      setSortBy(st.sortBy);
                      setTopN(st.topN);
                      setA1Range(st.a1Range||'');
                      setHeaderRowIndex(st.headerRowIndex||0);
                      if (typeof st.genericMode !== 'undefined') setGenericMode(st.genericMode);
                      if (st.genericGroupBy) setGenericGroupBy(st.genericGroupBy);
                      if (st.genericMetric) setGenericMetric(st.genericMetric);
                      if (st.genericAgg) setGenericAgg(st.genericAgg);
                      if (typeof st.dqDropExactDup !== 'undefined') setDqDropExactDup(!!st.dqDropExactDup);
                      if (typeof st.dqDedupColumn !== 'undefined') setDqDedupColumn(st.dqDedupColumn || '');
                      if (st.dqDedupKeys) setDqDedupKeys(st.dqDedupKeys);
                      if (st.dqDupMode) setDqDupMode(st.dqDupMode);
                      if (typeof st.dqShowOnlyFlagged !== 'undefined') setDqShowOnlyFlagged(!!st.dqShowOnlyFlagged);
                      if (typeof st.outlierEnabled !== 'undefined') setOutlierEnabled(!!st.outlierEnabled);
                      if (typeof st.outlierColumn !== 'undefined') setOutlierColumn(st.outlierColumn || '');
                      if (typeof st.outlierSensitivity !== 'undefined') setOutlierSensitivity(st.outlierSensitivity || '1.5');
                      if (st.outlierMethod) setOutlierMethod(st.outlierMethod);
                      if (st.zscoreThreshold) setZscoreThreshold(st.zscoreThreshold);
                      if (typeof st.outlierGroupBy !== 'undefined') setOutlierGroupBy(st.outlierGroupBy || '');
                      if (st.outlierMode) setOutlierMode(st.outlierMode);
                      if (typeof st.outlierShowOnlyFlagged !== 'undefined') setOutlierShowOnlyFlagged(!!st.outlierShowOnlyFlagged);
                    }}>Apply</button>
                    <button title="Delete" onClick={()=>{
                      const cp = snapshots.slice();
                      cp.splice(idx,1);
                      setSnapshots(cp);
                    }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            {metrics.categoryData.length > 0 && (
              <div className="table-card">
                <h3>Category Performance Details</h3>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Revenue</th>
                        <th>Profit</th>
                        <th>Orders</th>
                        <th>Avg Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.categoryData.map((cat, index) => (
                        <tr key={index}>
                          <td className="font-medium">{cat.name}</td>
                          <td>{formatCurrency(cat.value)}</td>
                          <td className="text-green">{formatCurrency(cat.profit)}</td>
                          <td>{cat.orders}</td>
                          <td>{formatCurrency(cat.value / cat.orders)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {!data && !error && (
          <div className="empty-state">
            <Upload size={64} className="empty-icon" />
            <h3>No Data Uploaded</h3>
            <p>Upload a CSV file with your e-commerce data to see visualizations</p>
            <div className="expected-columns">
              <p><strong>Expected CSV columns:</strong></p>
              <ul>
                <li>Sales/Revenue/Amount (required)</li>
                <li>Product/Item (optional)</li>
                <li>Category (optional)</li>
                <li>Date (optional)</li>
                <li>Quantity (optional)</li>
                <li>Profit (optional)</li>
                <li>Customer/User (optional)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
