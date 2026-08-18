import { useDemo } from '../lib/demo'

// Icono "?" con tooltip del demo original.
export default function Ayuda({ tip }: { tip: string }) {
  const { tipShow, tipHide } = useDemo()
  return (
    <span
      onMouseEnter={tipShow(tip)}
      onMouseLeave={tipHide}
      style={{
        width: 19,
        height: 19,
        borderRadius: '50%',
        background: '#EAE6DC',
        color: 'var(--text-muted)',
        fontSize: 12,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'help',
        flex: 'none',
      }}
    >
      ?
    </span>
  )
}
