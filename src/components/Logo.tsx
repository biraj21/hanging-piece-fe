import LogoImage from "/img/logo-compressed.png";

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img src={LogoImage} alt="Logo" className="w-10 h-10 rounded-md" />
      <h1 className="text-4xl sm:text-5xl font-extralight text-neutral-400 mb-1 tracking-tight">
        hanging <span className="text-white">piece</span>
      </h1>
    </div>
  );
};
