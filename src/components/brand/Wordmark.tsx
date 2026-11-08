/** Nome "mimo" como na marca: Varela Round, com o segundo "m" em lavanda. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-brand leading-none text-fg ${className}`}>
      mi<span className="text-primary">m</span>o
    </span>
  );
}
