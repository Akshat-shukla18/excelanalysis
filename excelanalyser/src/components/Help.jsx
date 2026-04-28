import React from 'react';
import { HelpCircle, Upload, FileSpreadsheet, Filter, Download, TrendingUp, Award } from 'lucide-react';

const Help = () => {
  return (
    <div className="help-page">
      <div className="container">
        <div className="help-header">
          <HelpCircle size={48} className="help-icon" />
          <h1>Excel Data Analyzer Help</h1>
          <p>Learn how to upload files and understand your data analysis</p>
        </div>

        <div className="help-sections">
          {/* Upload Guide */}
          <div className="help-section">
            <div className="section-header">
              <Upload size={32} />
              <h2>1. Upload Your Data</h2>
            </div>
            <div className="section-content">
              <div className="step-grid">
                <div className="step">
                  <div className="step-number">1</div>
                  <p>Click the upload area or drag & drop CSV/Excel (.xlsx) files</p>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <p>Excel files show sheet selector, range picker (A1:F100), header row</p>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <p>Preview data before applying. Data profiling shows types, blanks, outliers</p>
                </div>
              </div>
              <div className="file-types">
                <h3>Supported Formats:</h3>
                <ul>
                  <li><strong>CSV:</strong> Auto-parsed with headers</li>
                  <li><strong>Excel (.xlsx/.xls):</strong> Multi-sheet, range selection</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Analysis Guide */}
          <div className="help-section">
            <div className="section-header">
              <TrendingUp size={32} />
              <h2>2. Data Analysis</h2>
            </div>
            <div className="section-content">
              <div className="analysis-grid">
                <div className="analysis-card">
                  <h3>Automatic Metrics</h3>
                  <ul>
                    <li>Sales/Revenue totals</li>
                    <li>Profit & margins</li>
                    <li>Order counts & AOV</li>
                    <li>Customer counts</li>
                  </ul>
                </div>
                <div className="analysis-card">
                  <h3>Visualizations</h3>
                  <ul>
                    <li>Sales trends (line/area charts)</li>
                    <li>Category pie charts</li>
                    <li>Top products bar charts</li>
                    <li>Generic histograms (no date)</li>
                  </ul>
                </div>
                <div className="analysis-card">
                  <h3>Generic Mode</h3>
                  <ul>
                    <li>Any numeric column as metric</li>
                    <li>Group by categorical fields</li>
                    <li>Sum/Average/Count aggregations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Guide */}
          <div className="help-section">
            <div className="section-header">
              <Filter size={32} />
              <h2>3. Advanced Filters</h2>
            </div>
            <div className="section-content">
              <div className="filter-grid">
                <div className="filter-item">
                  <h4>Date Range</h4>
                  <p>All time, 7/30/90 days</p>
                </div>
                <div className="filter-item">
                  <h4>Data Quality</h4>
                  <p>Remove duplicates (exact/multi-column), flag outliers (IQR/Z-score)</p>
                </div>
                <div className="filter-item">
                  <h4>Visual Builder</h4>
                  <p>Click charts to filter data instantly</p>
                </div>
                <div className="filter-item">
                  <h4>Scenario Snapshots</h4>
                  <p>Save/restore filter combinations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Export Guide */}
          <div className="help-section">
            <div className="section-header">
              <Download size={32} />
              <h2>4. Export Results</h2>
            </div>
            <div className="section-content">
              <div className="export-options">
                <div className="export-card">
                  <h3>Excel Export</h3>
                  <p>Download filtered data as .xlsx</p>
                </div>
                <div className="export-card">
                  <h3>Report Summary</h3>
                  <p>TXT report with key metrics & top lists</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="help-section tips-section">
            <div className="section-header">
              <Award size={32} />
              <h2>Pro Tips</h2>
            </div>
            <div className="tips-grid">
              <div className="tip">
                <div className="tip-icon">📊</div>
                <p>Click chart segments for instant filtering</p>
              </div>
              <div className="tip">
                <div className="tip-icon">🔍</div>
                <p>Use Data Quality filters to clean outliers before analysis</p>
              </div>
              <div className="tip">
                <div className="tip-icon">📈</div>
                <p>Generic mode analyzes any numeric data with custom grouping</p>
              </div>
              <div className="tip">
                <div className="tip-icon">💾</div>
                <p>Save snapshots to compare different analysis scenarios</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;

