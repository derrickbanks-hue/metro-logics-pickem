import metroIcon from '../assets/metro-icon.png'

// Metro's real icon mark (Metro_Logics_Brand_Guidance.pdf: "use the icon-only
// version in familiar settings or where space is limited") paired with the
// wordmark in Poppins Bold, plus a small "PICK'EM" tag for this app.
export default function MetroMark({ className = 'h-9' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img src={metroIcon} alt="Metro Logics" className="h-full w-auto shrink-0" />
      <div className="flex flex-col leading-none justify-center">
        <span className="font-display font-bold text-metroAccentWhite text-sm tracking-wide">
          METRO LOGICS
        </span>
        <span className="font-display font-bold text-amber text-[11px] tracking-widest">
          PICK&apos;EM
        </span>
      </div>
    </div>
  )
}
