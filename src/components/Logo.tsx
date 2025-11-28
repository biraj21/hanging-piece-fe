interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <h1 className={`text-4xl sm:text-5xl font-extralight text-white mb-1 tracking-tight ${className}`}>
      chesstard<span className="text-neutral-500">.win</span>
    </h1>
  );
};
