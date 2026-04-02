import { FileText } from 'lucide-react';

const OCRReports = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">OCR Medical Reports</h1>
          <p className="text-lg text-gray-600">Extract and digitize text from prescriptions, lab reports, and medical documents.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Upload Document</h3>
            <div className="border-4 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-cyan-500 transition-all cursor-pointer">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700 mb-1">Upload Medical Document</p>
              <p className="text-xs text-gray-500">Supports printed and handwritten text</p>
            </div>
            <button className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-all">
              Process Document
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Extraction Accuracy</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Drug Name</div>
                <div className="font-semibold text-gray-900">Accuracy: 91.8%</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Dosage</div>
                <div className="font-semibold text-gray-900">Accuracy: 87.3%</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Date</div>
                <div className="font-semibold text-gray-900">Accuracy: 93.5%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Extracted Information</h3>
          <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm min-h-[200px]">
            <p className="text-gray-600 italic">Extracted text will appear here after processing...</p>
          </div>
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Integration Point:</strong> Connect to your Tesseract/EasyOCR backend for document processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRReports;