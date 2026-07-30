type PageErrorStateProps = {
  message: string;
  className?: string;
};

export function PageErrorState({ message, className = "" }: PageErrorStateProps) {
  return (
    <main className={`mx-auto max-w-[1920px] ${className}`.trim()}>
      <div className="page-px py-12 text-red-600">{message}</div>
    </main>
  );
}
