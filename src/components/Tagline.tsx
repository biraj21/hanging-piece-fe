interface TaglineProps {
  className?: string;
}

export const Tagline: React.FC<TaglineProps> = ({ className = "" }) => {
  return (
    <div className={className}>
      <p className="text-sm text-neutral-300 italic">Tell me why...</p>
      <p className="text-xs text-neutral-400">ain't nothing but a blunder</p>
    </div>
  );
};
