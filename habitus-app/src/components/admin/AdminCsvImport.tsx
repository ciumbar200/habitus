import { useRef, useState } from "react";
import {
  downloadCsv,
  es,
  parseCsvRecords,
  type AdminImportSummary,
} from "@habitus/core";
import { Icon } from "../Icon";

type AdminCsvImportProps<T> = {
  title: string;
  hint: string;
  exampleFilename: string;
  exampleContent: string;
  headers: readonly string[];
  mapRecords: (records: Record<string, string>[]) => T[];
  importRows: (rows: T[], accessToken?: string) => Promise<AdminImportSummary>;
  getAccessToken?: () => Promise<string | null>;
  onComplete?: (summary: AdminImportSummary) => void;
  /** Si se define, valida columnas requeridas (p. ej. con alias) en lugar de exigir todas las headers. */
  validateRecords?: (records: Record<string, string>[]) => string | null;
  /** Acción extra junto al botón de ejemplo (p. ej. exportar usuarios actuales). */
  extraAction?: { label: string; onClick: () => void | Promise<void>; busy?: boolean };
  /** Deshabilita importación (p. ej. servidor sin service role). */
  importDisabled?: boolean;
};

export function AdminCsvImport<T>({
  title,
  hint,
  exampleFilename,
  exampleContent,
  headers,
  mapRecords,
  importRows,
  getAccessToken,
  onComplete,
  validateRecords,
  extraAction,
  importDisabled = false,
}: AdminCsvImportProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [parsedRows, setParsedRows] = useState<T[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminImportSummary | null>(null);

  function downloadExample() {
    downloadCsv(exampleFilename, exampleContent);
  }

  async function handleFile(file: File | null) {
    setError(null);
    setSummary(null);
    if (!file) {
      setFileName(null);
      setPreviewCount(0);
      setParsedRows([]);
      return;
    }

    const text = await file.text();
    const records = parseCsvRecords(text);
    if (records.length === 0) {
      setError(es.admin.import.invalidFile);
      setFileName(null);
      setPreviewCount(0);
      setParsedRows([]);
      return;
    }

    const missing = validateRecords
      ? validateRecords(records)
      : headers.filter((h) => !(h in records[0])).join(", ") || null;
    if (missing) {
      setError(
        validateRecords
          ? es.admin.import.missingColumns.replace("{cols}", missing)
          : es.admin.import.missingColumns.replace("{cols}", missing),
      );
      setFileName(null);
      setPreviewCount(0);
      setParsedRows([]);
      return;
    }

    setFileName(file.name);
    setPreviewCount(records.length);
    setParsedRows(mapRecords(records));
  }

  async function runImport() {
    if (parsedRows.length === 0) return;
    setBusy(true);
    setError(null);
    setSummary(null);

    try {
      const token = getAccessToken ? await getAccessToken() : null;
      if (getAccessToken && !token) {
        setError(es.admin.import.authRequired);
        setBusy(false);
        return;
      }
      const result = await importRows(parsedRows, token ?? undefined);
      setSummary(result);
      onComplete?.(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : es.common.errorLoad);
    } finally {
      setBusy(false);
    }
  }

  const imp = es.admin.import;

  return (
    <section className="mt-8 rounded-xl border border-border-light bg-surface-container-lowest p-stack-md card-shadow">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-headline-md text-deep-navy">{title}</h2>
          <p className="mt-1 max-w-2xl text-body-md text-warm-slate">{hint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadExample}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-teal-accent px-4 py-2.5 text-label-md text-teal-accent transition-colors hover:bg-teal-accent/5"
          >
            <Icon name="download" className="text-[18px]" />
            {imp.downloadExample}
          </button>
          {extraAction && (
            <button
              type="button"
              disabled={extraAction.busy}
              onClick={() => void extraAction.onClick()}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-deep-navy px-4 py-2.5 text-label-md text-deep-navy transition-colors hover:bg-surface-container disabled:opacity-50"
            >
              <Icon name="download" className="text-[18px]" />
              {extraAction.busy ? es.common.pleaseWait : extraAction.label}
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 text-label-sm text-warm-slate">
        {imp.columns}: {headers.join(", ")}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-4 py-2.5 text-label-md text-on-primary"
        >
          <Icon name="upload_file" className="text-[18px]" />
          {imp.chooseFile}
        </button>
        {fileName && (
          <span className="text-label-sm text-warm-slate">
            {fileName} · {previewCount} {imp.rows}
          </span>
        )}
        <button
          type="button"
          disabled={busy || parsedRows.length === 0 || importDisabled}
          onClick={() => void runImport()}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-accent px-4 py-2.5 text-label-md text-on-primary disabled:opacity-50"
        >
          <Icon name="play_arrow" className="text-[18px]" />
          {busy ? es.common.pleaseWait : imp.runImport}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-error-container/30 px-4 py-2 text-body-sm text-error">
          {error}
        </p>
      )}

      {summary && (
        <div className="mt-4">
          <p className="text-label-md text-deep-navy">
            {imp.resultSummary
              .replace("{success}", String(summary.success))
              .replace("{failed}", String(summary.failed))
              .replace("{total}", String(summary.total))}
          </p>
          <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border-light">
            <table className="w-full text-left text-body-sm">
              <thead className="sticky top-0 bg-surface-container">
                <tr>
                  <th className="px-3 py-2 text-label-sm">{imp.row}</th>
                  <th className="px-3 py-2 text-label-sm">{imp.item}</th>
                  <th className="px-3 py-2 text-label-sm">{imp.status}</th>
                  <th className="px-3 py-2 text-label-sm">{imp.detail}</th>
                </tr>
              </thead>
              <tbody>
                {summary.results.map((r) => (
                  <tr key={`${r.row}-${r.label}`} className="border-t border-border-light">
                    <td className="px-3 py-2 text-warm-slate">{r.row}</td>
                    <td className="px-3 py-2">{r.label}</td>
                    <td className="px-3 py-2">
                      <span className={r.ok ? "text-teal-accent" : "text-error"}>
                        {r.ok ? imp.ok : imp.failed}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-warm-slate">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
