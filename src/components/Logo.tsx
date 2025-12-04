interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <h1 className={`text-4xl sm:text-5xl font-extralight text-neutral-500 mb-1 tracking-tight ${className}`}>
      hanging <span className="text-white">piece</span>
    </h1>
  );
};
