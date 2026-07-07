// Elemento de firma (camión de línea). Uso reservado: login y estados vacíos
// (doc 08 §1 antipatrones — no repetirlo en pantallas con datos).
export default function CamionFirma({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M44 40V12h70v28h-8" />
      <path d="M44 40H30M8 40v-11h9l7-11h20" />
      <path d="M17 29h13" />
      <circle cx="20" cy="46" r="5.5" />
      <circle cx="56" cy="46" r="5.5" />
      <circle cx="70" cy="46" r="5.5" />
      <circle cx="98" cy="46" r="5.5" />
      <path d="M26 46h24M76 46h16" />
    </svg>
  )
}
