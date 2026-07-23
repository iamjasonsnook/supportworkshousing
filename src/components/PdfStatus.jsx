const REPORT_URL = `${import.meta.env.BASE_URL}impact-report-2025.pdf`;

/**
 * Shared loading / error state for the PDF viewers. Shows a progress percentage
 * while pages rasterize and a graceful "open the PDF directly" fallback on error.
 * Renders nothing once status is 'ready'.
 */
function PdfStatus({ status, loaded, numPages }) {
  if (status === 'ready') return null;

  if (status === 'error') {
    return (
      <div className="irx-status">
        <p>
          We couldn't load the report viewer. You can still{' '}
          <a href={REPORT_URL} target="_blank" rel="noopener noreferrer">open the PDF directly</a>.
        </p>
      </div>
    );
  }

  const pct = numPages ? Math.round((loaded / numPages) * 100) : 0;
  return (
    <div className="irx-status">
      <div className="irx-spinner" aria-hidden="true" />
      <p>Preparing your booklet{numPages ? ` — ${pct}%` : '…'}</p>
    </div>
  );
}

export default PdfStatus;
