interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ fullScreen = false, message = "Loading..." }) => {
  const content = (
    <div className="text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3" />
      <span>{message}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-950 flex flex-col items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
