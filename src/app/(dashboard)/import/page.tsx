"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Clock } from "lucide-react";

type ImportJob = {
  id: string;
  file_name: string;
  business_date: string | null;
  status: string;
  rows_imported: number | null;
  error_message: string | null;
  created_at: string | null;
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ImportJob[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    const { data } = await supabase
      .from("sf_sales_import_jobs")
      .select("id, file_name, business_date, status, rows_imported, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setJobs((data || []) as ImportJob[]);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // 1. 業務日を抽出（ファイル名から YYYYMMDD or YYYY-MM-DD）
      const m1 = file.name.match(/(\d{4})-(\d{2})-(\d{2})/);
      const m2 = file.name.match(/(\d{4})(\d{2})(\d{2})/);
      const businessDate = m1
        ? `${m1[1]}-${m1[2]}-${m1[3]}`
        : m2
        ? `${m2[1]}-${m2[2]}-${m2[3]}`
        : new Date().toISOString().slice(0, 10);

      // 2. ASCII safe なファイル名にする
      const safeFileName = `${Date.now()}_${file.name.replace(/[^\w.-]/g, "_")}`;
      const path = `${businessDate}/${safeFileName}`;

      // 3. Storageへアップロード
      const { error: upErr } = await supabase.storage
        .from("sf-sales-daily-imports")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw new Error(`upload: ${upErr.message}`);

      // 4. import_jobs にレコード作成
      const { data: { user } } = await supabase.auth.getUser();
      const insertRow = {
        file_name: file.name,
        storage_path: path,
        file_size: file.size,
        business_date: businessDate,
        status: "pending",
        uploaded_by: user?.id ?? null,
      };
      const { data: jobData, error: jobErr } = await supabase
        .from("sf_sales_import_jobs")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertRow as any)
        .select("id")
        .single();
      const job = jobData as { id: string } | null;
      if (jobErr || !job) throw new Error(`job: ${jobErr?.message}`);

      // 5. Edge Function 呼び出し
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sf-sales-parse-daily-xlsx`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ import_job_id: job.id }),
        }
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Edge Function error");

      setResult(
        `✅ 取込完了: ${json.rows_imported}行 / 新規店舗 ${json.stores_created}店舗 (${json.business_date})`
      );
      setFile(null);
      await loadJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <h1 className="text-xl font-medium mb-1">Excel取込</h1>
      <div className="text-xs text-muted mb-4">日次実績Excelをアップロードして、データベースに反映します。</div>

      {/* Upload area */}
      <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
        <label
          htmlFor="file-upload"
          className="border-2 border-dashed border-black/20 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-bg/50 transition"
        >
          <FileSpreadsheet className="w-10 h-10 text-muted mb-2" />
          <div className="text-sm font-medium">
            {file ? file.name : "クリックして xlsx ファイルを選択"}
          </div>
          <div className="text-xs text-muted mt-1">
            ファイル名に YYYYMMDD (例: 20260417) を含めると業務日を自動認識
          </div>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-4 w-full h-10 bg-ink text-white text-sm rounded-md hover:bg-black/80 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "取込中... (10秒程度)" : "アップロード & 取込"}
        </button>

        {result && (
          <div className="mt-3 text-xs bg-[#E1F5EE] text-good border border-[#9FE1CB] rounded p-2.5">
            {result}
          </div>
        )}
        {error && (
          <div className="mt-3 text-xs bg-red-50 text-bad border border-red-200 rounded p-2.5">
            ❌ {error}
          </div>
        )}
      </div>

      {/* 取込履歴 */}
      <div className="bg-white border border-black/10 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-black/10">
          <span className="text-sm font-medium">取込履歴 (直近20件)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular">
            <thead className="bg-line text-[11px]">
              <tr>
                <th className="px-3 py-2 text-left font-medium">ファイル名</th>
                <th className="px-3 py-2 text-left font-medium w-24">業務日</th>
                <th className="px-3 py-2 text-center font-medium w-20">状態</th>
                <th className="px-3 py-2 text-right font-medium w-20">行数</th>
                <th className="px-3 py-2 text-left font-medium w-40">日時</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted">
                    まだ取込履歴はありません
                  </td>
                </tr>
              )}
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-black/5">
                  <td className="px-3 py-1.5">{j.file_name}</td>
                  <td className="px-3 py-1.5">{j.business_date ?? "-"}</td>
                  <td className="px-3 py-1.5 text-center">
                    {j.status === "success" && <span className="inline-flex items-center gap-1 text-good"><CheckCircle className="w-3 h-3" />成功</span>}
                    {j.status === "failed" && <span className="inline-flex items-center gap-1 text-bad"><XCircle className="w-3 h-3" />失敗</span>}
                    {j.status === "processing" && <span className="inline-flex items-center gap-1 text-warn"><Clock className="w-3 h-3" />処理中</span>}
                    {j.status === "pending" && <span className="inline-flex items-center gap-1 text-muted"><Clock className="w-3 h-3" />待機</span>}
                  </td>
                  <td className="px-3 py-1.5 text-right">{j.rows_imported ?? "-"}</td>
                  <td className="px-3 py-1.5">{j.created_at ? new Date(j.created_at).toLocaleString("ja-JP") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
