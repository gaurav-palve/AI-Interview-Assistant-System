import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  Button,
  Icon,
  Container,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Home as HomeIcon,
  QuestionAnswer as QuestionIcon,
  Mic as MicMuiIcon,
  School as SchoolIcon,
  Check as CheckMuiIcon,
  ArrowForward as ArrowForwardIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import interviewService from '../services/interviewService';
import interviewcompleted from "../assets/interview_complete.gif";

const InterviewComplete = () => {
  const navigate = useNavigate();
  const { interviewId } = useParams();
  const [interview, setInterview] = useState(null);

  useEffect(() => {
    const fetchInterviewData = async () => {
      if (interviewId) {
        try {
          const data = await interviewService.getCandidateInterview(interviewId);
          setInterview(data);
        } catch (err) {
          console.error("Failed to load interview data:", err);
        }
      }
    };
    fetchInterviewData();
  }, [interviewId]);

  return (
    <div className="flex h-screen bg-[#020617] text-gray-300 font-sans overflow-hidden">
      {/* Sidebar - Matching LeetCodeLayout exactly */}
      <aside className="w-52 bg-[#081433] border-r border-white/5 flex flex-shrink-0 flex-col py-6 px-6">
        <div className="px-8 flex items-center gap-2 mb-10">
          <span className="text-white font-bold text-lg tracking-tight">RecruitIQ</span>
        </div>

        <nav className="space-y-1">
          {[
            { label: 'Dashboard', icon: HomeIcon, active: false },
            { label: 'Technical Assessment', icon: SchoolIcon, active: false },
            { label: 'Voice Interview', icon: MicMuiIcon, active: false },
            { label: 'Coding Round', icon: QuestionIcon, active: true }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`py-2 px-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${item.active ? 'bg-[#0E1E4C] text-white border-l-2 border-white shadow-sm' : 'text-white hover:text-white'}`}
            >
              <item.icon sx={{ fontSize: 16 }} />
              <span className="text-[12px] font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden bg-[#050D27]">

        {/* Header - Matching LeetCodeLayout exactly */}
        <header className="h-10 bg-[#08143382] border-b border-white/5 flex items-center justify-end px-6 flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[11px] font-bold text-white leading-tight">Hello, {interview?.candidate_name?.split(' ')[0] || 'Candidate'}</p>
              <p className="text-[8px] text-gray-400 font-medium uppercase tracking-wider">Candidate</p>
            </div>
            <div className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-gray-400 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
              <MenuIcon sx={{ fontSize: 14 }} />
            </div>
          </div>
        </header>

        <div className="px-10 flex-1 overflow-y-auto w-full custom-scrollbar pt-4">
          <div className="max-w-7xl mx-auto w-full">

            <h1 className="text-3xl font-semibold text-white mb-4 tracking-tight">Coding Test</h1>

            {/* Progress Tracker - Showing all steps completed */}
            <div className="flex items-center justify-between w-full relative px-0 mb-6 pt-2">
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#1E293B] -translate-y-1/2 z-0" />
              {[
                { num: 1, label: 'Details' },
                { num: 2, label: 'Technical' },
                { num: 3, label: 'Voice' },
                { num: 4, label: 'Coding' }
              ].map((step, idx) => (
                <div key={idx} className={`flex items-center gap-2 z-10 bg-[#050D27] ${idx === 0 ? 'pr-3' : idx === 3 ? 'pl-3' : 'px-3'}`}>
                  <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center text-white ring-1 ring-white shadow-lg">
                    <CheckMuiIcon sx={{ fontSize: 14 }} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Congratulations Card */}
            <div className="flex justify-center items-center py-4">
              <div className="w-[400px] h-[370px] bg-[radial-gradient(ellipse_45.36%_45.36%_at_50.00%_24.95%,_#112662_0%,_#0B1739_100%)] rounded-md px-10 py-4 border border-white/5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">

                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />

                {/* Achievement Icon */}
                {/* Animated Checkmark/GIF Area */}
                <div className="relative z-10 w-32 h-32 flex items-center justify-center mb-0">
                  <img
                    src={interviewcompleted}
                    alt="Completed"
                    className="w-full h-full object-contain"
                  />
                </div>

                <h2 className="text-[28px] font-semibold text-white mb-4 tracking-tight z-10">
                  Congratulations!
                </h2>

                <p className="text-white text-[12px] leading-[1.6] mb-8 max-w-[220px] z-10">
                  You've successfully submitted all the rounds. Our talent acquisition team will reach out to you shortly.
                </p>

                <Button
                  onClick={() => window.location.href = 'https://neutrinotechsystems.com/'}
                  bg="#2563EB"
                  _hover={{ bg: '#1d4ed8' }}
                  color="white"
                  h="50px"
                  px="10"
                  borderRadius="md"
                  fontWeight="semibold"
                  fontSize="md"
                  rightIcon={<ArrowForwardIcon />}
                  boxShadow="0px 8px 24px rgba(37,99,235,0.4)"
                  className="z-10"
                >
                  Visit our site
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default InterviewComplete;
