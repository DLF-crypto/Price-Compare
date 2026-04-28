import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useProductStore } from '@/store/products';
import { useCurrencyStore } from '@/store/currencies';
import { useCountryStore } from '@/store/countries';
import type { WaybillRow, OptimizeResult } from '@/types';
import type { RowError } from '@/lib/import-products';
import {
  generateWaybillTemplate,
  parseWaybillImport,
  runOptimization,
  exportOptimizeResults,
} from '@/lib/optimize-products';

export default function ProductOptimizePage() {
  const { products, load: loadProducts } = useProductStore();
  const { currencies, load: loadCurrencies } = useCurrencyStore();
  const { countries, load: loadCountries } = useCountryStore();

  const [phase, setPhase] = useState<'idle' | 'preview' | 'result'>('idle');
  const [waybills, setWaybills] = useState<WaybillRow[]>([]);
  const [parseErrors, setParseErrors] = useState<RowError[]>([]);
  const [results, setResults] = useState<OptimizeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<OptimizeResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
    loadCurrencies();
    loadCountries();
  }, [loadProducts, loadCurrencies, loadCountries]);

  const handleDownloadTemplate = () => {
    const blob = generateWaybillTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '运单导入模板.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const ctx = { currencies, countries };
      const result = await parseWaybillImport(file, ctx);
      setWaybills(result.success);
      setParseErrors(result.errors);
      setPhase('preview');
    } catch (err) {
      alert('解析文件失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleStartOptimize = () => {
    if (waybills.length === 0) return;
    const optimized = runOptimization(waybills, products, currencies);
    setResults(optimized);
    setPhase('result');
  };

  const handleExport = () => {
    const blob = exportOptimizeResults(results);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `产品优选结果_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setPhase('idle');
    setWaybills([]);
    setParseErrors([]);
    setResults([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openDetail = (row: OptimizeResult) => {
    if (!row.costDetail) return;
    setDetailRow(row);
    setDetailOpen(true);
  };

  const matchedCount = results.filter((r) => r.optimalProductId).length;
  const unmatchedCount = results.filter((r) => !r.optimalProductId).length;

  const columns: Column<OptimizeResult>[] = [
    { key: 'trackingNo', title: '运单号' },
    { key: 'country', title: '国家' },
    {
      key: 'optimalProductName',
      title: '最优产品',
      render: (row) => {
        if (row.noMatchReason) {
          return (
            <span style={{ color: '#ef4444', fontSize: '13px' }}>
              {row.noMatchReason}
            </span>
          );
        }
        return (
          <div>
            <span>{row.optimalProductName}</span>
            {row.optimalProductType === 'combined' && (
              <span style={{
                marginLeft: '6px',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
              }}>
                组合
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'chargeableWeight',
      title: '计费重量',
      render: (row) => row.chargeableWeight != null ? `${row.chargeableWeight.toFixed(2)} kg` : '-',
    },
    {
      key: 'discount',
      title: '折扣',
      render: (row) => {
        if (!row.discount) return '-';
        return <span style={{ fontSize: '12px' }}>{row.discount}</span>;
      },
    },
    {
      key: 'totalCost',
      title: '最终运费',
      render: (row) => {
        if (row.totalCost == null) return <span style={{ color: '#94a3b8' }}>-</span>;
        return (
          <button
            onClick={() => openDetail(row)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#2563eb',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted' as const,
              textUnderlineOffset: '3px',
              padding: 0,
            }}
          >
            ￥{row.totalCost.toFixed(2)}
          </button>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <div>
        <h2 className="text-xl font-bold text-slate-800">产品优选</h2>
        <p className="text-sm text-slate-500 page-title-desc">批量上传运单，自动为每票货物匹配最优产品</p>
      </div>

      {/* Upload section */}
      {phase !== 'result' && (
        <Card>
          {/* Template download */}
          <div style={{
            padding: '16px',
            backgroundColor: '#eff6ff',
            borderRadius: '10px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e40af', marginBottom: '8px' }}>
              第一步：下载模板
            </div>
            <p style={{ fontSize: '13px', color: '#3b82f6', marginBottom: '12px' }}>
              请先下载运单 Excel 模板，按照模板中的说明填写运单数据后再上传。
            </p>
            <Button size="sm" variant="secondary" onClick={handleDownloadTemplate}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              下载运单模板
            </Button>
          </div>

          {/* File upload */}
          <div style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            border: '2px dashed #cbd5e1',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>
              第二步：上传运单文件
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
              选择填写好的 Excel 文件（.xlsx 格式），系统将自动解析并校验数据。
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  解析中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  选择文件上传
                </>
              )}
            </Button>
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div style={{
              marginBottom: '16px',
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '12px',
              backgroundColor: '#fff5f5',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>
                {parseErrors.length} 行存在错误，将跳过：
              </div>
              {parseErrors.map((err, idx) => (
                <div key={idx} style={{
                  padding: '8px 10px',
                  marginBottom: '6px',
                  backgroundColor: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #fee2e2',
                  fontSize: '12px',
                }}>
                  <span style={{ fontWeight: 600, color: '#991b1b' }}>
                    第{err.row}行 "{err.name}"：
                  </span>
                  <span style={{ color: '#b91c1c' }}>
                    {err.errors.join('；')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Preview summary */}
          {phase === 'preview' && waybills.length > 0 && (
            <div style={{
              padding: '16px',
              backgroundColor: '#f0fdf4',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a' }}>
                  已解析 {waybills.length} 条有效运单
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                  点击"开始优选"为每条运单匹配最优产品
                </div>
              </div>
              <Button onClick={handleStartOptimize}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                开始优选
              </Button>
            </div>
          )}

          {phase === 'preview' && waybills.length === 0 && parseErrors.length > 0 && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              borderRadius: '10px',
              textAlign: 'center',
              color: '#dc2626',
              fontSize: '14px',
            }}>
              所有行均存在错误，无法进行优选
            </div>
          )}
        </Card>
      )}

      {/* Results section */}
      {phase === 'result' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                优选结果
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                共 {results.length} 条运单，
                <span style={{ color: '#16a34a', fontWeight: 500 }}>{matchedCount} 条匹配成功</span>
                {unmatchedCount > 0 && (
                  <span style={{ color: '#ef4444', fontWeight: 500 }}>，{unmatchedCount} 条无匹配</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleReset}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新上传
              </Button>
              {matchedCount > 0 && (
                <Button onClick={handleExport}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  导出结果
                </Button>
              )}
            </div>
          </div>

          <Table
            columns={columns}
            data={results}
            rowKey={(row) => row.trackingNo + row.country + row.weight}
            highlightRow={(row) => !!row.optimalProductId}
            emptyText="无优选结果"
          />
        </Card>
      )}

      {/* Cost detail modal */}
      <Modal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailRow(null); }}
        title={`费用明细 - ${detailRow?.trackingNo || ''}`}
      >
        {detailRow?.costDetail && (
          <div>
            <div style={{
              display: 'flex', gap: '12px', marginBottom: '16px',
            }}>
              <div style={{
                flex: 1, padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px',
              }}>
                <div style={{ fontSize: '12px', color: '#0369a1' }}>最优产品</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0c4a6e', marginTop: '4px' }}>
                  {detailRow.optimalProductName}
                  {detailRow.optimalProductType === 'combined' && (
                    <span style={{
                      marginLeft: '6px', fontSize: '10px', padding: '1px 6px',
                      borderRadius: '9999px', backgroundColor: '#ede9fe', color: '#7c3aed',
                    }}>组合</span>
                  )}
                </div>
              </div>
              <div style={{
                flex: 1, padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px',
              }}>
                <div style={{ fontSize: '12px', color: '#15803d' }}>最终运费</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                  ￥{detailRow.totalCost?.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Weight info */}
            <div style={{
              padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px',
              marginBottom: '16px', fontSize: '13px', color: '#475569',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>实际重量</span>
                <span style={{ fontWeight: 500 }}>{detailRow.weight} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>体积重</span>
                <span style={{ fontWeight: 500 }}>{detailRow.costDetail.volumeWeight} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>计费重量</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{detailRow.costDetail.chargeableWeight} kg</span>
              </div>
            </div>

            {/* Cost breakdown */}
            <div style={{
              border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 16px', backgroundColor: '#f1f5f9',
                fontSize: '13px', fontWeight: 600, color: '#334155',
              }}>
                费用组成
              </div>

              {detailRow.costDetail.productType === 'full_service' ? (
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>运费</span>
                    <span style={{ fontWeight: 500 }}>￥{detailRow.costDetail.freight?.toFixed(2)}</span>
                  </div>
                  {(detailRow.costDetail.handlingFee || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                      <span style={{ color: '#64748b' }}>处理费</span>
                      <span style={{ fontWeight: 500 }}>￥{detailRow.costDetail.handlingFee?.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>折扣</span>
                    <span style={{ fontWeight: 500 }}>{detailRow.costDetail.discount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>税金（税率 {detailRow.costDetail.taxRate}%）</span>
                    <span style={{ fontWeight: 500 }}>￥{detailRow.costDetail.tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '15px', fontWeight: 700 }}>
                    <span>合计</span>
                    <span style={{ color: '#16a34a' }}>￥{detailRow.totalCost?.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>头程费用（折扣 {detailRow.costDetail.discount.split('/')[0]?.replace('头程', '')}）</span>
                    <span style={{ fontWeight: 500 }}>￥{detailRow.costDetail.firstMileCost?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>清关费用（折扣 {detailRow.costDetail.discount.split('/')[1]?.replace('清关', '')}）</span>
                    <span style={{ fontWeight: 500 }}>￥{detailRow.costDetail.customsCost?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>尾程费用（折扣 {detailRow.costDetail.discount.split('/')[2]?.replace('尾程', '')}）</span>
                    <span style={{ fontWeight: 500 }}>￥{detailRow.costDetail.lastMileCost?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>税金（税率 {detailRow.costDetail.taxRate}%）</span>
                    <span style={{ fontWeight: 500 }}>￥{detailRow.costDetail.tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '15px', fontWeight: 700 }}>
                    <span>合计</span>
                    <span style={{ color: '#16a34a' }}>￥{detailRow.totalCost?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
