/** Nome "bubbly" como na marca: Varela Round, com o par "bb" (as duas bolhas) em lavanda. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-brand leading-none text-fg ${className}`}>
      bu<span className="text-primary">bb</span>ly
    </span>
  );
}
