import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import interviewService from '../services/interviewService';
import { generateCodingQuestions } from "../services/codingService";
import {
  Home as HomeIcon,
  QuestionAnswer as QuestionIcon,
  Mic as MicIcon,
  School as SchoolIcon,
  Check as CheckIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
  Menu as MenuIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * CodingInstructions page component
 * Provides instructions and a confirmation before starting the coding round
 * Follows the Voice Interview UI format for consistency
 */
function CodingInstructions() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const requestMadeRef = useRef(false);

  // Fetch interview details and generate questions
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await interviewService.getCandidateInterview(interviewId);
        setInterview(data);

        // Generate coding questions if not already done
        if (!requestMadeRef.current) {
          requestMadeRef.current = true;
          await generateCodingQuestions(interviewId, 3, "medium");
        }
      } catch (err) {
        setError(err.detail || 'Failed to load interview details.');
        requestMadeRef.current = false;
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      loadData();
      setCameraReady(true);
    }
  }, [interviewId]);

  const handleBeginRound = () => {
    if (isStarting) return;

    if (!isConfirmed) {
      toast({
        title: "Agreement Required",
        description: "Please confirm that you have read all the instructions.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    setIsStarting(true);
    // Directly move to the coding round
    navigate(`/leetcode/${interviewId}`);
  };


  if (loading) return null; // Or a themed loader
  if (error) return <div className="p-10 text-white">{error}</div>;

  return (
    <div className="flex h-screen bg-[#020617] text-gray-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 bg-[#081433] border-r border-white/5 flex flex-shrink-0 flex-col py-6 px-6">
        <div className="flex items-center gap-2 mb-5">
          <h1 className="px-6 text-white font-bold text-lg tracking-tight">RecruitIQ</h1>
        </div>

        <nav className="space-y-1">
          {[
            { label: 'Dashboard', icon: HomeIcon, active: false },
            { label: 'Technical Assessment', icon: SchoolIcon, active: false },
            { label: 'Voice Interview', icon: MicIcon, active: false },
            { label: 'Coding Round', icon: CodeIcon, active: true }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`py-2 px-3 rounded-md flex items-center gap-3 transition-all cursor-pointer ${item.active ? 'bg-[#0E1E4C] border-l-2 border-white text-white shadow-sm' : 'text-white hover:text-white'}`}
            >
              <item.icon sx={{ fontSize: 16 }} />
              <span className="text-[12px] font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {/* Header */}
        <header className="h-12 bg-[#08143382] border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div />
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[13px] font-bold text-white">Hello, {interview?.candidate_name?.split(' ')[0] || 'Candidate'}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Candidate</p>
              </div>
              <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-400 border border-white/10">
                <MenuIcon sx={{ fontSize: 16 }} />
              </div>
            </div>
          </div>
        </header>

        {/* Static Container (No Scroll) */}
        <div className="flex-1 overflow-hidden w-full bg-[#050D27]">
          <main className="p-6 max-w-4xl mx-auto w-full h-full flex flex-col animate-fadeIn">
            {/* Page Heading */}
            <div className="mb-6 flex-shrink-0">
              <div className="flex items-baseline gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">Coding Round</h1>
                <span className="text-white text-[11px] font-normal">There are 3 coding problems in this round.</span>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="flex items-center justify-between w-full mb-8 relative px-0 flex-shrink-0">
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#1E293B] -translate-y-1/2 z-0" />
              {[
                { num: 1, label: 'Details', state: 'completed' },
                { num: 2, label: 'Technical', state: 'completed' },
                { num: 3, label: 'Voice', state: 'completed' },
                { num: 4, label: 'Coding', state: 'active' }
              ].map((step, idx) => (
                <div key={idx} className={`flex items-center gap-2 z-10 bg-[#050D27] ${idx === 0 ? 'pr-2' : idx === 3 ? 'pl-2' : 'px-2'}`}>
                  {step.state === 'completed' ? (
                    <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center text-white ring-1 ring-white shadow-lg">
                      <CheckIcon sx={{ fontSize: 11 }} />
                    </div>
                  ) : (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[8px] shadow-lg transition-all ${step.state === 'active' ? 'bg-[#2563EB] text-white ring-1 ring-white' : 'bg-[#1E293B] text-gray-400 ring-1 ring-[#343B4F]'
                      }`}>
                      {step.num}
                    </div>
                  )}
                  <span className={`text-[9px] font-bold tracking-tight ${step.state === 'active' ? 'text-white' : step.state === 'completed' ? 'text-white' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Instructions Card */}
            <div className="bg-[#0B1739] border border-[#1E293B] rounded-md flex flex-col backdrop-blur-sm overflow-hidden mb-4 flex-1 min-h-0">
              <div className="px-6 py-4 flex flex-col h-full">
                <h3 className="text-white font-semibold text-[14px] tracking-wide mb-4 flex-shrink-0">Coding Round Instructions</h3>
                <ul className="space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-[#2563EB]/20 scrollbar-track-[#0B1739] flex-1">
                  {[
                    "This is a technical coding round designed to evaluate your problem-solving skills, programming knowledge, and coding proficiency.",
                    "The round consists of 2-3 coding problems based on data structures, algorithms, and real-world problem scenarios relevant to the job role.",
                    "You will see one problem at a time. Read the problem statement, constraints, and sample inputs/outputs carefully before starting.",
                    "Write clean, efficient, and executable code. You may use the programming language specified in the instructions. Ensure your solution handles edge cases."
                  ].map((text, idx) => (
                    <li key={idx} className="flex gap-3 text-[12px] leading-relaxed text-white">
                      <div className="w-1 h-1 rounded-full bg-white mt-1.5 flex-shrink-0" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Acknowledgment Box */}
            <div
              onClick={() => !isStarting && setIsConfirmed(!isConfirmed)}
              className={`flex items-center gap-3 p-3 rounded-md border transition-all mb-4 flex-shrink-0 ${isStarting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isConfirmed ? 'bg-blue-500/5 border-blue-500/30' : 'bg-[#0B1739] border-[#1E293B] hover:border-gray-700'}`}
            >
              <div className={`w-4 h-4 border flex items-center justify-center transition-all ${isConfirmed ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-white'}`}>
                {isConfirmed && <CheckIcon sx={{ fontSize: 12 }} className="text-white" />}
              </div>
              <span className="text-[11px] font-medium text-white">
                I confirm that I have read all the instructions carefully and am ready to take this assessment.
              </span>
            </div>

            {/* Action Bar */}
            <div className="bg-[#0B1739] border border-[#1E293B] rounded-md p-2 flex items-center justify-between backdrop-blur-md flex-shrink-0 mb-4">
              <div className="flex items-center gap-2.5 px-1">
                <InfoOutlinedIcon className="text-[#2563EB]" sx={{ fontSize: 16 }} />
                <span className="text-[11px] text-[#2563EB] font-medium">Test your microphone before beginning.</span>
              </div>
              <button
                onClick={handleBeginRound}
                disabled={isStarting || !isConfirmed}
                className={`h-9 px-4 rounded-md flex items-center gap-2 font-bold text-xs transition-all ${isStarting ? 'bg-blue-600/50 text-white/50 cursor-wait' : isConfirmed ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-[0px_0px_16px_0px_rgba(37,99,235,0.80)]' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'}`}
              >
                {isStarting ? 'Starting...' : 'Begin Coding Round'}
                {!isStarting && <ArrowForwardIcon sx={{ fontSize: 14 }} />}
              </button>
            </div>
          </main>
        </div>

      </div>
    </div>
  );
}

export default CodingInstructions;
