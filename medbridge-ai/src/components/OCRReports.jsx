import { useState } from 'react';
import { FileText, AlertTriangle, User } from 'lucide-react';
import { cachedFormPost } from '../utils/offlineCache';

const API = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/ocr/extract`;

// // Component for displaying structured OCR results
const StructuredOCRDisplay = ({ ocrResult }) => {
  const [activeTab, setActiveTab] = useState('patient');

  if (!ocrResult) return null;

  const patientDemographics = ocrResult.patient_demographics || {};
  const rawText = ocrResult.raw_text || '';
  const notes = ocrResult.notes || '';

  const tabs = [
    // { id: 'patient', label: 'Patient Information', icon: User },
    { id: 'raw', label: 'Raw OCR Text', icon: FileText }
  ];

  const isNotFound = (value) => !value || value === 'Not found' || value === '';

  const renderPatientInfo = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h5 className="font-semibold text-gray-900 mb-4 text-lg">Patient Demographics</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-600">Full Name</label>
            <p className={`text-lg mt-1 ${isNotFound(patientDemographics.patient_name) ? 'text-gray-400' : 'text-gray-900 font-semibold'}`}>
              {patientDemographics.patient_name || 'Not found'}
            </p>
          </div>

          {/* Age */}
          <div>
            <label className="text-sm font-medium text-gray-600">Age</label>
            <p className={`text-lg mt-1 ${isNotFound(patientDemographics.age) ? 'text-gray-400' : 'text-gray-900 font-semibold'}`}>
              {patientDemographics.age || 'Not found'}
            </p>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="text-sm font-medium text-gray-600">Date of Birth</label>
            <p className={`text-lg mt-1 ${isNotFound(patientDemographics.date_of_birth) ? 'text-gray-400' : 'text-gray-900 font-semibold'}`}>
              {patientDemographics.date_of_birth || 'Not found'}
            </p>
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm font-medium text-gray-600">Gender</label>
            <p className={`text-lg mt-1 ${isNotFound(patientDemographics.gender) ? 'text-gray-400' : 'text-gray-900 font-semibold'}`}>
              {patientDemographics.gender || 'Not found'}
            </p>
          </div>

          {/* Contact Number */}
          <div>
            <label className="text-sm font-medium text-gray-600">Contact Number</label>
            <p className={`text-lg mt-1 ${isNotFound(patientDemographics.contact_number) ? 'text-gray-400' : 'text-gray-900 font-semibold'}`}>
              {patientDemographics.contact_number || 'Not found'}
            </p>
          </div>

          {/* Patient ID */}
          <div>
            <label className="text-sm font-medium text-gray-600">Patient ID / MRN</label>
            <p className={`text-lg mt-1 ${isNotFound(patientDemographics.patient_id) ? 'text-gray-400' : 'text-gray-900 font-semibold'}`}>
              {patientDemographics.patient_id || 'Not found'}
            </p>
          </div>
        </div>

        {/* Address */}
        {!isNotFound(patientDemographics.address) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-600">Address</label>
            <p className="text-gray-900 mt-2">{patientDemographics.address}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderRawText = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Raw OCR Extracted Text</h4>
      <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto border border-gray-200">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
          {rawText || 'No text extracted'}
        </pre>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">{notes}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'patient' && renderPatientInfo()}
        {activeTab === 'raw' && renderRawText()}
      </div>
    </div>
  );
};

// const OCRReports = () => {
//   const [file, setFile] = useState(null);
//   const [preview, setPreview] = useState(null);
//   const [ocrResult, setOcrResult] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleFileChange = (event) => {
//     const selectedFile = event.target.files?.[0];
//     if (selectedFile) {
//       setFile(selectedFile);
//       setError('');
      
//       // Create preview
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setPreview(e.target?.result);
//       };
//       reader.readAsDataURL(selectedFile);
//     }
//   };

//   const handleProcess = async () => {
//     if (!file) {
//       setError('Please select an image first');
//       return;
//     }

//     setLoading(true);
//     setError('');
    
//     const formData = new FormData();
//     formData.append('file', file);

//     try {
//       const response = await fetch(API, {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error(`OCR processing failed: ${response.statusText}`);
//       }

//       const data = await response.json();
//       setOcrResult(data);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to process document');
//       console.error('OCR Error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-12 bg-cover bg-center relative" style={{ backgroundImage: "url('/Hospital_bg.png')" }}>
//       <div className="absolute inset-0 bg-white/30"></div>
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
//         <div className="mb-8">
//           <h1 className="text-4xl font-bold text-gray-900 mb-4">OCR Medical Reports</h1>
//           <p className="text-lg text-gray-700">Extract patient information from prescriptions, lab reports, and medical documents using Tesseract OCR.</p>
//         </div>
//         <div className="grid gap-8 lg:grid-cols-[500px_minmax(150px,1fr)]">
//           <div className="bg-white rounded-xl shadow-lg p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Upload Document</h3>
//             <label className="border-4 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-cyan-500 transition-all cursor-pointer block">
//               <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
//               <p className="font-semibold text-gray-700 mb-1">Upload Medical Document</p>
//               <p className="text-xs text-gray-500">Supports printed and handwritten text (JPG, PNG)</p>
//               <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
//             </label>

//             {preview && (
//               <div className="mt-4">
//                 <p className="text-sm font-medium text-gray-600 mb-2">Preview</p>
//                 <img src={preview} alt="Document preview" className="w-full rounded-lg object-contain max-h-[400px]" />
//               </div>
//             )}

//             <button
//               onClick={handleProcess}
//               disabled={loading || !file}
//               className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
//             >
//               {loading ? 'Processing...' : 'Extract Patient Information'}
//             </button>

//             {error && (
//               <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
//                 {error}
//               </div>
//             )}
//           </div>

//           <div className="bg-white rounded-xl shadow-lg p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Extracted Information</h3>
//             {!ocrResult ? (
//               <div className="bg-gray-50 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
//                 <p className="text-gray-600 italic">Upload and process a document to extract patient information...</p>
//               </div>
//             ) : (
//               <StructuredOCRDisplay ocrResult={ocrResult} />
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OCRReports;

// // Component for displaying structured OCR results
// const StructuredOCRDisplay = ({ ocrResult }) => {
//   const [activeTab, setActiveTab] = useState('patient');

//   if (!ocrResult) return null;

//   const patientDemographics = ocrResult.patient_demographics || {};
//   const rawText = ocrResult.raw_text || '';
//   const notes = ocrResult.notes || '';

//   const tabs = [
//     { id: 'patient', label: 'Patient Information', icon: User },
//     { id: 'raw', label: 'Raw OCR Text', icon: FileText }
//   ];

//   const renderOverview = () => (
//     <div className="space-y-6">
//       {/* Document Header */}
//       <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
//         <h4 className="text-lg font-bold text-blue-800 mb-2">Document Overview</h4>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div>
//             <span className="text-sm font-medium text-blue-600">Document Type:</span>
//             <p className="text-gray-800">{structuredData.facility_info?.facility_name ? 'Medical Report' : 'Medical Document'}</p>
//           </div>
//           <div>
//             <span className="text-sm font-medium text-blue-600">Extraction Confidence:</span>
//             <p className="text-gray-800">{(extractionConfidence * 100).toFixed(1)}%</p>
//           </div>
//           <div>
//             <span className="text-sm font-medium text-blue-600">Data Completeness:</span>
//             <p className="text-gray-800">{missingData.length === 0 ? 'Complete' : `${missingData.length} fields missing`}</p>
//           </div>
//         </div>
//       </div>

//       {/* Key Findings */}
//       {observations && (
//         <div className="bg-white border border-gray-200 rounded-lg p-4">
//           <h4 className="text-lg font-bold text-blue-800 mb-3">Key Findings</h4>
//           <div className="text-gray-700 whitespace-pre-wrap">{observations}</div>
//         </div>
//       )}

//       {/* Missing Data Alert */}
//       {/* {missingData.length > 0 && (
//         <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
//           <h4 className="text-lg font-bold text-orange-800 mb-2 flex items-center">
//             <AlertTriangle className="w-5 h-5 mr-2" />
//             Missing Data Generated
//           </h4>
//           <p className="text-orange-700 mb-2">
//             The following data was not found in the document and has been generated for completeness:
//           </p>
//           <div className="flex flex-wrap gap-2">
//             {missingData.map((item, index) => (
//               <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
//                 {item}
//               </span>
//             ))}
//           </div>
//         </div>
//       )} */}
//     </div>
//   );

//   const renderPatientInfo = () => {
//     const demo = structuredData.patient_demographics || {};
//     return (
//       <div className="space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="bg-white border border-gray-200 rounded-lg p-4">
//             <h5 className="font-semibold text-gray-800 mb-3">Basic Information</h5>
//             <div className="space-y-2">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Name:</span>
//                 <span className="font-medium">{demo.patient_name || 'Not available'}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">ID:</span>
//                 <span className="font-medium">{demo.patient_id || 'Not available'}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">DOB:</span>
//                 <span className="font-medium">{demo.date_of_birth || 'Not available'}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Age:</span>
//                 <span className="font-medium">{demo.age || 'Not available'}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Gender:</span>
//                 <span className="font-medium">{demo.gender || 'Not available'}</span>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white border border-gray-200 rounded-lg p-4">
//             <h5 className="font-semibold text-gray-800 mb-3">Contact Information</h5>
//             <div className="space-y-2">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Phone:</span>
//                 <span className="font-medium">{demo.phone || 'Not available'}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Address:</span>
//                 <span className="font-medium text-right">{demo.address || 'Not available'}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {(demo.insurance_provider || demo.insurance_id) && (
//           <div className="bg-white border border-gray-200 rounded-lg p-4">
//             <h5 className="font-semibold text-gray-800 mb-3">Insurance</h5>
//             <div className="space-y-2">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Provider:</span>
//                 <span className="font-medium">{demo.insurance_provider || 'Not available'}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Policy ID:</span>
//                 <span className="font-medium">{demo.insurance_id || 'Not available'}</span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const renderVitals = () => {
//     const vitals = structuredData.vital_signs || {};
//     return (
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {Object.entries(vitals).map(([key, value]) => (
//           <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
//             <h5 className="font-semibold text-gray-800 mb-2 capitalize">
//               {key.replace('_', ' ')}
//             </h5>
//             <p className="text-2xl font-bold text-blue-600">{value || 'N/A'}</p>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   const renderLabs = () => {
//     const labs = structuredData.lab_results || {};
//     return (
//       <div className="space-y-4">
//         {Object.entries(labs).map(([test, data]) => (
//           <div key={test} className="bg-white border border-gray-200 rounded-lg p-4">
//             <h5 className="font-semibold text-gray-800 mb-3 capitalize">
//               {test.replace('_', ' ')}
//             </h5>
//             {typeof data === 'object' ? (
//               <div className="space-y-2">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Value:</span>
//                   <span className="font-medium">{data.value || 'N/A'}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Reference Range:</span>
//                   <span className="font-medium">{data.range || 'N/A'}</span>
//                 </div>
//                 {data.status && (
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Status:</span>
//                     <span className={`font-medium ${
//                       data.status.toLowerCase().includes('high') || data.status.toLowerCase().includes('low')
//                         ? 'text-red-600' : 'text-green-600'
//                     }`}>
//                       {data.status}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <p className="text-gray-700">{data}</p>
//             )}
//           </div>
//         ))}
//       </div>
//     );
//   };

//   const renderEmptyState = (title, message) => (
//     <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
//       <div className="mx-auto inline-flex items-center justify-center rounded-full bg-yellow-100 h-12 w-12 mb-4">
//         <AlertTriangle className="w-6 h-6 text-yellow-800" />
//       </div>
//       <h5 className="text-lg font-semibold text-yellow-900 mb-2">{title}</h5>
//       <p className="text-sm text-yellow-700">{message}</p>
//     </div>
//   );

//   const renderDiagnosis = () => {
//     const diagnosis = structuredData.diagnosis || {};
//     const hasDiagnosis = diagnosis.primary_diagnosis || (diagnosis.secondary_diagnoses && diagnosis.secondary_diagnoses.length > 0) || (diagnosis.icd_codes && diagnosis.icd_codes.length > 0) || diagnosis.severity;

//     if (!hasDiagnosis) {
//       return renderEmptyState('No Diagnosis Found', 'This report does not contain a diagnosis suggestion.');
//     }

//     return (
//       <div className="space-y-4">
//         <div className="bg-white border border-gray-200 rounded-lg p-4">
//           <h5 className="font-semibold text-gray-800 mb-3">Primary Diagnosis</h5>
//           <p className="text-gray-700">{diagnosis.primary_diagnosis || 'Not specified'}</p>
//         </div>

//         {diagnosis.secondary_diagnoses && diagnosis.secondary_diagnoses.length > 0 && (
//           <div className="bg-white border border-gray-200 rounded-lg p-4">
//             <h5 className="font-semibold text-gray-800 mb-3">Secondary Diagnoses</h5>
//             <ul className="list-disc list-inside text-gray-700">
//               {diagnosis.secondary_diagnoses.map((diag, index) => (
//                 <li key={index}>{diag}</li>
//               ))}
//             </ul>
//           </div>
//         )}

//         {diagnosis.icd_codes && diagnosis.icd_codes.length > 0 && (
//           <div className="bg-white border border-gray-200 rounded-lg p-4">
//             <h5 className="font-semibold text-gray-800 mb-3">ICD Codes</h5>
//             <div className="flex flex-wrap gap-2">
//               {diagnosis.icd_codes.map((code, index) => (
//                 <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
//                   {code}
//                 </span>
//               ))}
//             </div>
//           </div>
//         )}

//         {diagnosis.severity && (
//           <div className="bg-white border border-gray-200 rounded-lg p-4">
//             <h5 className="font-semibold text-gray-800 mb-3">Severity</h5>
//             <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
//               diagnosis.severity.toLowerCase() === 'critical' ? 'bg-red-100 text-red-800' :
//               diagnosis.severity.toLowerCase() === 'severe' ? 'bg-orange-100 text-orange-800' :
//               diagnosis.severity.toLowerCase() === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
//               'bg-green-100 text-green-800'
//             }`}>
//               {diagnosis.severity}
//             </span>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const renderMedications = () => {
//     const meds = structuredData.medications || {};
//     const hasMedications = (meds.current_medications && meds.current_medications.length > 0) || (meds.allergies && meds.allergies.length > 0);

//     if (!hasMedications) {
//       return renderEmptyState('No Medications Found', 'This report does not contain any medication details.');
//     }

//     return (
//       <div className="space-y-4">
//         {meds.current_medications && meds.current_medications.length > 0 && (
//           <div className="bg-white border border-gray-200 rounded-lg p-4">
//             <h5 className="font-semibold text-gray-800 mb-3">Current Medications</h5>
//             <div className="space-y-3">
//               {meds.current_medications.map((med, index) => (
//                 <div key={index} className="border border-gray-100 rounded p-3">
//                   <div className="font-medium text-gray-900">{med.name || 'Unknown'}</div>
//                   <div className="text-sm text-gray-600 mt-1">
//                     {med.dosage && <span>Dosage: {med.dosage} • </span>}
//                     {med.frequency && <span>Frequency: {med.frequency} • </span>}
//                     {med.duration && <span>Duration: {med.duration}</span>}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {meds.allergies && meds.allergies.length > 0 && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//             <h5 className="font-semibold text-red-800 mb-3">Allergies</h5>
//             <div className="flex flex-wrap gap-2">
//               {meds.allergies.map((allergy, index) => (
//                 <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
//                   {allergy}
//                 </span>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const renderRawText = () => (
//     <div className="bg-white border border-gray-200 rounded-lg p-4">
//       <h4 className="text-lg font-bold text-gray-900 mb-4">Raw OCR Text</h4>
//       <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
//         {cleanedText}
//       </pre>
//     </div>
//   );

//   return (
//     <div className="space-y-2">
//       {/* Tab Navigation */}
//       <div className="bg-white border border-gray-200 rounded-lg p-4">
//         <div className="flex flex-wrap gap-2">
//           {tabs.map((tab) => {
//             const Icon = tab.icon;
//             return (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`flex items-center px-[9.5px] py-2 rounded-lg text-sm font-medium transition-all ${
//                   activeTab === tab.id
//                     ? 'bg-blue-100 text-blue-800 border border-blue-300'
//                     : 'text-gray-600 hover:bg-gray-100'
//                 }`}
//               >
//                 <Icon className="w-4 h-4 mr-2" />
//                 {tab.label}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* Tab Content */}
//       <div className="min-h-[200px]">
//         {activeTab === 'overview' && renderOverview()}
//         {activeTab === 'patient' && renderPatientInfo()}
//         {activeTab === 'vitals' && renderVitals()}
//         {activeTab === 'labs' && renderLabs()}
//         {activeTab === 'diagnosis' && renderDiagnosis()}
//         {activeTab === 'medications' && renderMedications()}
//         {activeTab === 'raw' && renderRawText()}
//       </div>

//       {/* Confidence Score */}
//       <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
//         <h4 className="text-sm font-medium text-gray-600 mb-2">Data Extraction Confidence</h4>
//         <div className="w-full bg-gray-200 rounded-full h-2">
//           <div
//             className="bg-blue-600 h-2 rounded-full"
//             style={{ width: `${Math.min(extractionConfidence * 100, 100)}%` }}
//           ></div>
//         </div>
//         <p className="text-xs text-gray-500 mt-1">
//           {(extractionConfidence * 100).toFixed(1)}% - {extractionConfidence > 0.8 ? 'High confidence' : extractionConfidence > 0.5 ? 'Medium confidence' : 'Low confidence'}
//         </p>
//         {ocrResult.extraction_notes && (
//           <p className="text-xs text-gray-500 mt-2">{ocrResult.extraction_notes}</p>
//         )}
//       </div>
//     </div>
//   );
// };

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

      const response = await cachedFormPost(API, formData);
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
    <div className="min-h-screen bg-gray-50 py-12 bg-cover bg-center relative" style={{ backgroundImage: "url('/Hospital_bg.png')" }}>
      <div className="absolute inset-0 bg-white/30"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">OCR Medical Reports</h1>
          <p className="text-lg text-black-700">Extract and digitize text from prescriptions, lab reports, and medical documents.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[500px_minmax(150px,1fr)]">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Upload Document</h3>
            <label className="border-4 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-cyan-500 transition-all cursor-pointer block">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700 mb-1">Upload Medical Document</p>
              <p className="text-xs text-gray-500">Supports printed and handwritten text</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>

            {preview && (
              <div className="mt-4">
                <img src={preview} alt="Document preview" className="w-full rounded-lg object-contain max-h-[500px]" />
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

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">OCR Results</h3>
            {!ocrResult ? (
              <div className="bg-gray-50 rounded-lg p-6 min-h-[200px]">
                <p className="text-gray-600 italic">The structured OCR results will appear here after processing...</p>
              </div>
            ) : (
              <StructuredOCRDisplay ocrResult={ocrResult} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRReports;