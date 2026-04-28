import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#84cc16'];

function inferNumericFields(headers, rows) {
  const numeric = [];
  headers.forEach(h => {
    let countNum = 0;
    for (let i = 0; i < Math.min(rows.length, 100); i++) {
      const v = rows[i]?.[h];
      if (v === undefined || v === null || v === '') continue;
      const n = Number(String(v).replace(/,/g, ''));
      if (!Number.isNaN(n)) countNum++;
    }
    if (countNum > 10) numeric.push(h);
  });
  return numeric;
}

function VisualBuilder({ dataset, onFilterSelect }) {
  const headers = useMemo(() => dataset?.headers ?? [], [dataset]);
const rows = useMemo(() => dataset?.rows ?? [], [dataset]);

  const numericFields = useMemo(() => inferNumericFields(headers, rows), [headers, rows]);

  const [xField, setXField] = useState(() => headers[0] || '');
 const [yField, setYField] = useState('');

useMemo(() => {
  if (!yField && (numericFields.length || headers.length)) {
    setYField(numericFields[0] || headers[0]);
  }
}, [numericFields, headers]);
  const [agg, setAgg] = useState('sum');
  const [chartType, setChartType] = useState('bar'); // bar | line | area | pie

  const grouped = useMemo(() => {
    if (!rows.length || !xField) return [];
    const m = new Map();
    rows.forEach(r => {
      const key = r[xField] ?? 'Unknown';
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(r);
    });
    const arr = [];
    m.forEach((groupRows, key) => {
      let value = 0;
      if (agg === 'count') {
        value = groupRows.length;
      } else {
        const nums = groupRows.map(gr => Number(String(gr[yField]).replace(/,/g, ''))).filter(v => !Number.isNaN(v));
        const sum = nums.reduce((a,b)=>a+b,0);
        if (agg === 'sum') value = sum; else if (agg === 'avg') value = nums.length ? sum/nums.length : 0;
      }
      arr.push({ name: String(key), value });
    });
    // sort by value desc for nicer charts
    arr.sort((a,b)=> b.value - a.value);
    return arr.slice(0, 50);
  }, [rows, xField, yField, agg]);

  const handleSliceClick = (name) => {
    if (!name) return;
    onFilterSelect && onFilterSelect(name, xField);
  };

  const Chart = () => {
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={grouped} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}>
              {grouped.map((entry, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} onClick={() => handleSliceClick(entry.name)} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (chartType === 'line' || chartType === 'area') {
      const Inner = chartType === 'line' ? LineChart : AreaChart;
      const Series = chartType === 'line' ? Line : Area;
      const seriesProps = chartType === 'line' ? { type: 'monotone', dataKey: 'value', stroke: '#3b82f6' } : { type: 'monotone', dataKey: 'value', stroke: '#3b82f6', fill: '#bfdbfe' };
      return (
        <ResponsiveContainer width="100%" height={300}>
          <Inner data={grouped}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Series {...seriesProps} onClick={(d)=> handleSliceClick(d?.payload?.name)} />
          </Inner>
        </ResponsiveContainer>
      );
    }
    // default bar
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={grouped}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip />
          <Bar dataKey="value" fill="#8b5cf6" onClick={(d)=> handleSliceClick(d?.payload?.name)} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (!dataset || !dataset.headers?.length) return null;

  return (
    <div className="chart-card">
      <h3>Visual Builder</h3>
      <div className="picker-grid" style={{marginBottom:'0.5rem'}}>
        <div className="picker-field">
          <label>X Field</label>
          <select value={xField} onChange={e=>setXField(e.target.value)}>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="picker-field">
          <label>Y Field</label>
          <select value={yField} onChange={e=>setYField(e.target.value)}>
            {[...new Set([...(numericFields.length?numericFields:[headers[0]]), ...headers])].map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        <div className="picker-field">
          <label>Aggregation</label>
          <select value={agg} onChange={e=>setAgg(e.target.value)}>
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="count">Count</option>
          </select>
        </div>
        <div className="picker-field">
          <label>Chart Type</label>
          <select value={chartType} onChange={e=>setChartType(e.target.value)}>
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
            <option value="pie">Pie</option>
          </select>
        </div>
      </div>
      <Chart />
      <div style={{color:'#64748b', fontSize:'0.8rem', marginTop:'0.5rem'}}>
        Tip: Click a bar/slice/point to filter other views by the X value.
      </div>
    </div>
  );
}

export default VisualBuilder;

