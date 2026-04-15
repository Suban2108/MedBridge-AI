import { useState } from 'react';
import { FileText } from 'lucide-react';

const API = 'http://localhost:8000/api/v1/ocr/extract';

const formatPercent = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return `${value.toFixed(1)}%`;
};

const formatSummaryBlock = (ocrResult) => {
  if (!ocrResult) return 'No summary available.';

  const summary = ocrResult.summary || {};
  const sections = ocrResult.sections || {};
  const unifiedSummary = summary.summary_text || summary.patient_summary || summary.clinical_summary || 'Not available.';
  const cleanedText = ocrResult.cleaned_text || ocrResult.raw_text || 'No OCR text available.';

  const lines = [];
  // lines.push('Report Summary:');
  // lines.push(`  ${unifiedSummary}`);
  lines.push('');
  lines.push('Key Details:');

  const sectionEntries = Object.entries(sections);
  if (sectionEntries.length === 0) {
    lines.push('  Not available.');
  } else {
    sectionEntries.forEach(([section, value]) => {
      const formattedKey = section.replaceAll('_', ' ');
      lines.push(`  - ${formattedKey}:`);
      lines.push(`    ${value || 'Not available.'}`);
    });
  }

  lines.push('');
  lines.push('OCR Text:');
  lines.push(`  ${cleanedText.replace(/\n/g, '\n  ')}`);

  return lines.join('\n');
};

const OCRReports = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const metrics = ocrResult?.metrics || {};

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setOcrResult(null);
    setError('');
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please choose a document image first.');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);

    try {
      setLoading(true);
      setError('');
      setOcrResult(null);

      const response = await fetch(API, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'OCR extraction failed.');
      }
      setOcrResult(data);
    } catch (err) {
      setError(err.message || 'Unable to process the document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">OCR Medical Reports</h1>
          <p className="text-lg text-gray-600">Extract and digitize text from prescriptions, lab reports, and medical documents.</p>
        </div>

        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Upload Document</h3>
            <label className="border-4 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-cyan-500 transition-all cursor-pointer block">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700 mb-1">Upload Medical Document</p>
              <p className="text-xs text-gray-500">Supports printed and handwritten text</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>

            {preview && (
              <div className="mt-4">
                <img src={preview} alt="Document preview" className="w-full rounded-lg object-contain max-h-60" />
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={loading}
              className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-60"
            >
              {loading ? 'Processing...' : 'Process Document'}
            </button>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Extraction Accuracy</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Drug Name</div>
                <div className="font-semibold text-gray-900">Accuracy: {formatPercent(metrics.drug_name_accuracy)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Dosage</div>
                <div className="font-semibold text-gray-900">Accuracy: {formatPercent(metrics.dosage_accuracy)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Date</div>
                <div className="font-semibold text-gray-900">Accuracy: {formatPercent(metrics.date_accuracy)}</div>
              </div>
            </div>
          </div> */}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Summary</h3>
          {!ocrResult ? (
            <div className="bg-gray-50 rounded-lg p-6 min-h-[200px]">
              <p className="text-gray-600 italic">The complete formatted summary will appear here after processing...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Summary of the Documents</h4>
                <pre className="font-mono text-sm whitespace-pre-wrap overflow-x-auto text-gray-800 leading-6">
                  {formatSummaryBlock(ocrResult)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCRReports;