export default function Logo({ expanded }) {
  return (
    <div 
      className="flex items-center justify-center gap-2 px-4 pt-4 h-[55px] animate-fadeIn transition-all duration-300" 
      style={{ marginLeft: expanded ? -25 : 0, marginBottom: 15 }}
    >
      {/* Logo image */}
      <img
        src="/ATS- RecruitIQ White Logo.png"
        alt="Logo"
        className="flex items-center justify-center gap-2 px-4 pt-2 h-[55px] animate-fadeIn transition-all duration-300"
      />

      {/* Brand text */}
      {/* <span className="text-white font-semibold text-lg tracking-wide">
        RecruitIQ
      </span> */}
    </div>
  );
}
