import PsychologyIcon from '@mui/icons-material/Psychology';
 
export default function Logo({ expanded }) {
  return (
    <div className="flex items-center h-20 pl-1 animate-fadeIn transition-all duration-300">
      {/* Animated icon container */}
      <div className="relative h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-lg group">
        {/* Ping ripple */}
        <div className="absolute inset-0 rounded-full bg-primary-100 opacity-0 group-hover:opacity-20 " />
        <PsychologyIcon className="h-4 w-4 text-primary-600 transition-transform duration-300 group-hover:scale-110" />
      </div>
 
      {/* Animated name — only when expanded */}
      {expanded && (
        <span className="ml-3 text-white text-xl font-bold font-display whitespace-nowrap tracking-wide relative overflow-hidden transition-all duration-300 translate-x-0 opacity-90">
          Hirepool.AI
 
          {/* Sparkle effect */}
          <span className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <span className="w-1 h-1 bg-white rounded-full animate-ping absolute" style={{ left: '10%', top: '30%' }} />
            <span className="w-1 h-1 bg-white rounded-full animate-ping absolute" style={{ left: '70%', top: '50%' }} />
            <span className="w-1 h-1 bg-white rounded-full animate-ping absolute" style={{ left: '40%', top: '70%' }} />
          </span>
        </span>
      )}
    </div>
  );
}