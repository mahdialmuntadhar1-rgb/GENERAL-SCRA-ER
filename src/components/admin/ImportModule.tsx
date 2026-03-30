import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X, 
  Loader2,
  Table as TableIcon,
  MapPin,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  Download
} from 'lucide-react';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'summary';

export function ImportModule() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setStep('mapping');
      }, 1500);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="max-w-2xl mx-auto py-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight mb-2">Import Business Data</h2>
              <p className="text-zinc-500">Upload CSV, XLSX, or JSON files to start the verification workflow.</p>
            </div>
            
            <label className="relative group cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept=".csv,.xlsx,.json" 
                onChange={handleFileUpload}
              />
              <div className="border-2 border-dashed border-zinc-200 rounded-3xl p-16 flex flex-col items-center justify-center bg-white hover:border-orange-500 hover:bg-orange-50/30 transition-all">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
                    <p className="font-bold text-zinc-900">Processing file...</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-orange-100 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="text-lg font-bold text-zinc-900 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-zinc-500 mb-8">CSV, XLSX, or JSON (max. 50MB)</p>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <FileText className="w-3.5 h-3.5" /> CSV
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <FileSpreadsheet className="w-3.5 h-3.5" /> XLSX
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <FileJson className="w-3.5 h-3.5" /> JSON
                      </div>
                    </div>
                  </>
                )}
              </div>
            </label>

            <div className="mt-12 bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h4 className="font-bold text-amber-900 mb-1">City Center Policy Reminder</h4>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Our system automatically filters for central urban zones. Records outside approved central districts will be flagged as "Outside Central Coverage" and will require manual approval.
                </p>
              </div>
            </div>
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Column Mapping</h2>
                <p className="text-zinc-500 text-sm">Map your file columns to our system fields.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setStep('preview')}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  Next: Preview <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">System Field</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">File Column</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Sample Value</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {[
                    { field: 'Business Name', required: true, mapped: 'business_name', sample: 'Al-Mansour Restaurant' },
                    { field: 'City', required: true, mapped: 'city_name', sample: 'Baghdad' },
                    { field: 'District', required: true, mapped: 'area_district', sample: 'Mansour' },
                    { field: 'Phone Number', required: true, mapped: 'contact_phone', sample: '+964 770 123 4567' },
                    { field: 'Address', required: false, mapped: 'full_address', sample: 'Mansour District, 14 Ramadan St.' },
                    { field: 'Category', required: true, mapped: 'biz_type', sample: 'Restaurant' },
                    { field: 'Map Link', required: false, mapped: 'google_maps_url', sample: 'https://maps.google.com/...' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{row.field}</span>
                          {row.required && <span className="text-red-500 text-xs">*</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full">
                          <option>{row.mapped}</option>
                          <option>None</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 italic">{row.sample}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Data Preview & Validation</h2>
                <p className="text-zinc-500 text-sm">Reviewing first 100 rows for quality and central coverage.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep('summary')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  Start Final Import <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Name</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">City</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">District</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Issue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {[
                          { name: 'Al-Amal Cafe', city: 'Baghdad', district: 'Karrada', status: 'Valid', issue: null },
                          { name: 'Erbil Tech Hub', city: 'Erbil', district: 'Ankawa', status: 'Valid', issue: null },
                          { name: 'Basra Fish Market', city: 'Basra', district: 'Ashar', status: 'Valid', issue: null },
                          { name: 'Village Resto', city: 'Baghdad', district: 'Abu Ghraib', status: 'Flagged', issue: 'Outside Central Zone' },
                          { name: 'Duplicate Biz', city: 'Baghdad', district: 'Mansour', status: 'Flagged', issue: 'Duplicate Suspect' },
                        ].map((row, i) => (
                          <tr key={i} className="hover:bg-zinc-50 transition-colors text-sm">
                            <td className="px-4 py-3 font-medium">{row.name}</td>
                            <td className="px-4 py-3 text-zinc-500">{row.city}</td>
                            <td className="px-4 py-3 text-zinc-500">{row.district}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                row.status === 'Valid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {row.issue && (
                                <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  {row.issue}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-zinc-400" />
                    Preview Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Total Rows</span>
                      <span className="font-bold">1,250</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Valid Records</span>
                      <span className="font-bold text-emerald-600">1,120</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Outside Central</span>
                      <span className="font-bold text-amber-600">85</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Duplicates</span>
                      <span className="font-bold text-red-600">45</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-lg">
                  <h3 className="font-bold mb-2">Ready to Import?</h3>
                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                    Once you start the final import, records will be moved to the Review Queue for manual cleaning and verification.
                  </p>
                  <button 
                    onClick={() => setStep('summary')}
                    className="w-full bg-orange-600 hover:bg-orange-700 py-3 rounded-xl font-bold text-sm transition-all"
                  >
                    Confirm & Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="max-w-2xl mx-auto py-12 text-center">
            <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">Import Successful!</h2>
            <p className="text-zinc-500 mb-12">1,120 records have been added to the Review Queue.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
              {[
                { label: 'Imported', value: '1,120', color: 'text-emerald-600' },
                { label: 'Rejected', value: '45', color: 'text-red-600' },
                { label: 'Duplicates', value: '32', color: 'text-amber-600' },
                { label: 'Outside Central', value: '53', color: 'text-amber-600' },
                { label: 'Missing Fields', value: '12', color: 'text-zinc-400' },
                { label: 'Total Scanned', value: '1,250', color: 'text-zinc-900' },
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setStep('upload')}
                className="px-8 py-4 bg-white border border-zinc-200 rounded-2xl font-bold hover:bg-zinc-50 transition-all shadow-sm"
              >
                Import Another File
              </button>
              <button className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg">
                Go to Review Queue
              </button>
            </div>
            
            <button className="mt-8 text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-2 mx-auto">
              <Download className="w-4 h-4" /> Download Rejected Rows (CSV)
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)]">
      {renderStep()}
    </div>
  );
}
