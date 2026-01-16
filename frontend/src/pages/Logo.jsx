// No import needed for image
 
export default function Logo({ expanded }) {
  return (
    <div className="flex items-center px-4 pt-4 h-[55px] animate-fadeIn transition-all duration-300" style={{marginLeft:-25,marginBottom:15}}>
      {/* Logo image */}
      <img
        src="/Hirepool.AI White Logo.png"
        alt="Hirepool.AI Logo"
        className="h-[60px] w-[60px] transition-transform duration-300 hover:scale-110"
      />

      {/* Animated name — only when expanded */}
      {expanded && (
        <span className="ml-1 text-white text-xl font-bold font-display whitespace-nowrap tracking-wide relative overflow-hidden transition-all duration-300 translate-x-0 opacity-90">
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