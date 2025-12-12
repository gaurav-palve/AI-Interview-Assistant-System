import { useState, useEffect } from 'react';
import interviewService from '../services/interviewService';
import { fetchScreeningResults } from '../services/screeningService';
import { 
  Upload as UploadIcon,
  Description as DescriptionIcon,
  FileUpload as FileUploadIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

function ResumeScreening() {
  const [zipFile, setZipFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleZipFileChange = (e) => {
    if (e.target.files[0]) {
      setZipFile(e.target.files[0]);
    }
  };

  const handleJdFileChange = (e) => {
    if (e.target.files[0]) {
      setJdFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!zipFile || !jdFile) {
      setError('Please upload both a ZIP file of resumes and a job description PDF');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await interviewService.screenResumes(zipFile, jdFile);
      // After POST we store results in DB. Refresh persisted results.
      const persisted = await fetchScreeningResults();
      setResults(persisted);
    } catch (err) {
      setError(err.detail || 'An error occurred during resume screening');
    } finally {
      setLoading(false);
    }
  };

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const persisted = await fetchScreeningResults();
      setResults(persisted);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load persisted screening results');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <AssessmentIcon className="mr-2 text-primary-600" />
          Resume Screening
        </h1>
        <p className="text-gray-600 mb-6">
          Upload a ZIP file containing candidate resumes and a job description PDF to automatically screen and rank candidates.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ZIP File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
            <div className="flex flex-col items-center justify-center space-y-2">
              <UploadIcon className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {zipFile ? (
                    <span className="text-primary-600 font-medium flex items-center justify-center">
                      <CheckIcon className="mr-1 h-5 w-5" />
                      {zipFile.name}
                    </span>
                  ) : (
                    "Upload a ZIP file containing candidate resumes"
                  )}
                </p>
                <label className="mt-2 cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-500">
                  <span>Select ZIP file</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".zip,.pdf"
                    onChange={handleZipFileChange}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* JD File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
            <div className="flex flex-col items-center justify-center space-y-2">
              <DescriptionIcon className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {jdFile ? (
                    <span className="text-primary-600 font-medium flex items-center justify-center">
                      <CheckIcon className="mr-1 h-5 w-5" />
                      {jdFile.name}
                    </span>
                  ) : (
                    "Upload a job description PDF"
                  )}
                </p>
                <label className="mt-2 cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-500">
                  <span>Select JD file</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleJdFileChange}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading || !zipFile || !jdFile}
              className={`px-6 py-3 rounded-md text-white font-medium flex items-center ${
                loading || !zipFile || !jdFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg transition-all duration-200'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FileUploadIcon className="mr-2 h-5 w-5" />
                  Screen Resumes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
            <ErrorIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {results && results.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Screening Results</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resume
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ATS Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Strengths
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weaknesses
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.resume}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-primary-600 h-2.5 rounded-full" 
                            style={{ width: `${result.ATS_Score}%` }}
                          ></div>
                        </div>
                        <span>{result.ATS_Score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <ul className="list-disc pl-5">
                        {result.Strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <ul className="list-disc pl-5">
                        {result.Weaknesses.map((weakness, i) => (
                          <li key={i}>{weakness}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeScreening;