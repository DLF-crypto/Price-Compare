import * as XLSX from 'xlsx';
import type { Product, Currency, Country, ProductType } from '@/types';
import type { BatchCalcRow, BatchCalcResult } from '@/types';
import type { RowError } from '@/lib/import-products';
import {
  calcFullServiceCost,
  calcCombinedCost,
  type CostResult,
} from '@/lib/optimize-products';

// ============================================================
// Internal helpers
// ============================================================

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function num(v: unknown): number {
  if (v == null || v === '') return NaN;
  return Number(v);
}

function parseVolumeStr(raw: string): { length: number; width: number; height: number } | null {
  if (!raw) return null;
  const parts = raw.replace(/[xX×]/g, '*').split('*').map((s) => s.trim());
  if (parts.length !== 3) return null;
  const [l, w, h] = parts.map(Number);
  if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) return null;
  return { length: l, width: w, height: h };
}

function isRowEmpty(row: unknown[]): boolean {
  return row.every((cell) => cell == null || String(cell).trim() === '');
}

function buildWorkbookBlob(wb: XLSX.WorkBook): Blob {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ============================================================
// Template generation
// ============================================================

export function generateBatchCalcTemplate(): Blob {
  const wb = XLSX.utils.book_new();

  const headers = [
    '运单号*', '产品名称*', '重量(kg)*', '体积(cm)', '申报价值', '币种',
  ];
  const exampleRows = [
    ['WB20240001', '美国专线-标准', 2.5, '30*20*15', 50, '美元'],
    ['WB20240002', '英国组合经济线', 8.0, '', '', ''],
    ['WB20240003', '美国专线-首重版', 0.8, '20*15*10', 120, ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  ws['!cols'] = [
    { wch: 18 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, '运单数据');

  const instructions = [
    ['批量产品试算模板 - 填写说明'],
    [],
    ['一、整体说明'],
    ['1. 请从第2行开始填写数据（第1行为表头，带*号的为必填项）。'],
    ['2. 示例数据仅供参考格式，导入前请删除示例行。'],
    ['3. 每条运单直接指定产品名称，系统按产品名称精确匹配并计算运费。'],
    [],
    ['二、字段说明'],
    ['列', '字段名', '是否必填', '说明', '示例值'],
    ['A', '运单号', '必填', '运单标识', 'WB20240001'],
    ['B', '产品名称', '必填', '须与系统中"产品维护"页面的产品名称完全一致', '美国专线-标准'],
    ['C', '重量(kg)', '必填', '实际重量，须大于0', '2.5'],
    ['D', '体积(cm)', '选填', '格式：长*宽*高，单位cm，留空则不计算体积重', '30*20*15'],
    ['E', '申报价值', '选填', '申报货值金额，币种由F列指定', '50'],
    ['F', '币种', '选填', '系统已维护的币种名称；留空表示人民币', '美元'],
    [],
    ['三、体积格式说明（D列）'],
    [],
    ['格式：长*宽*高，使用英文星号 * 或 x 分隔，单位为厘米(cm)'],
    ['示例：30*20*15 表示长30cm、宽20cm、高15cm'],
    ['系统将使用产品的泡比系数计算体积重：体积重 = 长 × 宽 × 高 / 泡比系数'],
    ['计费重 = max(实际重量, 体积重)'],
    [],
    ['四、币种与申报价值说明'],
    [],
    ['1. E列填写申报价值金额，F列填写对应币种'],
    ['2. 若E列有值但F列留空，视为人民币'],
    ['3. F列币种名称须与系统中"货币维护"页面的货币名称完全一致'],
    ['4. 申报价值将按汇率换算为人民币后计算税金'],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(instructions);
  ws2['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 60 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, '填写说明');

  return buildWorkbookBlob(wb);
}

// ============================================================
// Parse batch calc import
// ============================================================

interface BatchCalcImportContext {
  currencies: Currency[];
  countries: Country[];
  products: Product[];
}

export interface BatchCalcImportResult {
  success: BatchCalcRow[];
  errors: RowError[];
}

export async function parseBatchCalcImport(
  file: File,
  ctx: BatchCalcImportContext,
): Promise<BatchCalcImportResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const wsName = wb.SheetNames[0];
  if (!wsName) throw new Error('Excel 文件中没有工作表');
  const ws = wb.Sheets[wsName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

  const success: BatchCalcRow[] = [];
  const errors: RowError[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || isRowEmpty(row)) continue;

    const rowErrors: string[] = [];

    // A: 运单号
    const trackingNo = str(row[0]);
    if (!trackingNo) rowErrors.push('运单号不能为空');

    // B: 产品名称
    const productName = str(row[1]);
    if (!productName) {
      rowErrors.push('产品名称不能为空');
    } else {
      const p = ctx.products.find((p) => p.name === productName);
      if (!p) rowErrors.push(`产品"${productName}"不存在`);
      else if (p.status !== 'active') rowErrors.push(`产品"${productName}"已停用`);
    }

    // C: 重量
    const weight = num(row[2]);
    if (isNaN(weight)) rowErrors.push('重量不能为空');
    else if (weight <= 0) rowErrors.push('重量须大于0');

    // D: 体积 (optional)
    let length: number | undefined;
    let width: number | undefined;
    let height: number | undefined;
    const volumeRaw = str(row[3]);
    if (volumeRaw) {
      const vol = parseVolumeStr(volumeRaw);
      if (!vol) {
        rowErrors.push(`体积格式无效："${volumeRaw}"，应为 长*宽*高（如 30*20*15）`);
      } else {
        length = vol.length;
        width = vol.width;
        height = vol.height;
      }
    }

    // E: 申报价值 (optional)
    let declaredValue: number | undefined;
    const dvRaw = num(row[4]);
    if (!isNaN(dvRaw)) {
      if (dvRaw < 0) rowErrors.push('申报价值不能为负数');
      else declaredValue = dvRaw;
    }

    // F: 币种 (optional)
    let declaredCurrencyId: string | undefined;
    const currencyName = str(row[5]);
    if (currencyName) {
      const c = ctx.currencies.find((c) => c.name === currencyName);
      if (!c) rowErrors.push(`币种"${currencyName}"不存在`);
      else declaredCurrencyId = c.id;
    }

    if (rowErrors.length > 0) {
      errors.push({ row: i + 1, name: trackingNo || `(第${i + 1}行)`, errors: rowErrors });
    } else {
      // Resolve country from product
      const product = ctx.products.find((p) => p.name === productName)!;
      success.push({
        trackingNo,
        productName,
        country: product.country,
        weight,
        length,
        width,
        height,
        declaredValue,
        declaredCurrencyId,
      });
    }
  }

  return { success, errors };
}

// ============================================================
// Batch calculate
// ============================================================

export function runBatchCalculate(
  rows: BatchCalcRow[],
  products: Product[],
  currencies: Currency[],
): BatchCalcResult[] {
  return rows.map((row) => {
    const product = products.find((p) => p.name === row.productName && p.status === 'active');
    if (!product) {
      return {
        trackingNo: row.trackingNo,
        productName: row.productName,
        country: row.country,
        weight: row.weight,
        errorReason: `产品"${row.productName}"不存在或已停用`,
      };
    }

    // Build a WaybillRow-compatible object for the calc functions
    const waybill = {
      trackingNo: row.trackingNo,
      country: row.country,
      weight: row.weight,
      length: row.length,
      width: row.width,
      height: row.height,
      declaredValue: row.declaredValue,
      declaredCurrencyId: row.declaredCurrencyId,
      cargoType: product.cargoType || 'general' as const,
    };

    const pt: ProductType = product.productType || 'full_service';
    let result: CostResult | null;

    if (pt === 'full_service') {
      result = calcFullServiceCost(product, waybill, currencies);
    } else {
      result = calcCombinedCost(product, waybill, currencies);
    }

    if (!result) {
      return {
        trackingNo: row.trackingNo,
        productName: row.productName,
        productType: pt,
        country: row.country,
        weight: row.weight,
        errorReason: '货物重量超出该产品的计费范围',
      };
    }

    return {
      trackingNo: row.trackingNo,
      productName: row.productName,
      productType: pt,
      country: row.country,
      weight: row.weight,
      chargeableWeight: result.detail.chargeableWeight,
      totalCost: result.totalCost,
      discount: result.detail.discount,
      costDetail: result.detail,
    };
  });
}

// ============================================================
// Export results
// ============================================================

export function exportBatchCalcResults(results: BatchCalcResult[]): Blob {
  const wb = XLSX.utils.book_new();

  const headers = [
    '运单号', '产品名称', '产品类型', '国家', '实际重量(kg)', '计费重量(kg)',
    '折扣', '最终运费(元)',
    '运费', '处理费', '头程费用', '清关费用', '尾程费用', '税金', '备注',
  ];

  const dataRows = results.map((r) => {
    const d = r.costDetail;
    return [
      r.trackingNo,
      r.productName,
      r.productType === 'combined' ? '组合' : r.productType === 'full_service' ? '全程' : '-',
      r.country,
      r.weight,
      r.chargeableWeight ?? '-',
      r.discount || '-',
      r.totalCost != null ? r.totalCost : '-',
      d?.freight != null ? d.freight : '-',
      d?.handlingFee != null ? d.handlingFee : '-',
      d?.firstMileCost != null ? d.firstMileCost : '-',
      d?.customsCost != null ? d.customsCost : '-',
      d?.lastMileCost != null ? d.lastMileCost : '-',
      d?.tax != null ? d.tax : '-',
      r.errorReason || '',
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws['!cols'] = [
    { wch: 18 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 24 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, '试算结果');

  return buildWorkbookBlob(wb);
}
