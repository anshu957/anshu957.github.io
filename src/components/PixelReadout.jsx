export default function PixelReadout({ label, value }) {
  return (
    <div className="sim-readout" aria-live="off">
      <span className="sim-readout-mark" aria-hidden="true">
        <span className="sim-mark-grid"></span>
        <span className="sim-mark-signal sim-mark-signal-one"></span>
        <span className="sim-mark-signal sim-mark-signal-two"></span>
        <span className="sim-mark-led"></span>
      </span>
      <span className="sim-readout-copy">
        <span className="sim-readout-label">{label}</span>
        <span className="sim-readout-value">{value}</span>
      </span>
    </div>
  );
}
