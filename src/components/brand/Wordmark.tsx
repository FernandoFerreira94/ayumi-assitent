/**
 * Nome "bubbly" como na marca (variação "Bolha subindo"): Nunito 900, minúsculo, em lavanda, com duas
 * bolhinhas subindo do fim do nome. A Bolha grande já aparece acima dele no login e na abertura.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block pr-[0.42em] font-brand font-black leading-none tracking-[-0.03em] text-primary ${className}`}>
      bubbly
      <span
        aria-hidden="true"
        className="absolute right-[0.06em] top-[-0.28em] size-[0.2em] rounded-full border-[0.035em] border-[#B9A6FF]"
      />
      <span
        aria-hidden="true"
        className="absolute right-[0.2em] top-[-0.02em] size-[0.12em] rounded-full border-[0.03em] border-[#FF8FB1]"
      />
    </span>
  );
}
