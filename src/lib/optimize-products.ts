import * as XLSX from 'xlsx';
import type {
  Product, Currency, Country, CargoType, ProductType, PricingMode,
  WaybillRow, OptimizeCostDetail, OptimizeResult,
} from '@/types';
import { CARGO_TYPE_MAP } from '@/types';
import type { RowError } from '@/lib/import-products';

// ============================================================
// Internal helpers
// ============================================================

const CARGO_TYPE_REVERSE: Record<string, CargoType> = {
  '普货': 'general',
  '带电': 'electric',
  '特敏': 'sensitive',
  'F货': 'f_cargo',
};

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function num(v: unknown): number {
  if (v == null || v === '') return NaN;
  return Number(v);
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseVolumeStr(raw: string): { length: number; width: number; height: number } | null {
  if (!raw) return null;
  const parts = raw.replace(/[xX×]/g, '*').split('*').map((s) => s.trim());
  if (parts.length !== 3) return null;
  const [l, w, h] = parts.map(Number);
  if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) return null;
  return { length: l, width: w, height: h };
}

export function toRMB(price: number, currencyId: string, currencies: Currency[]): number {
  if (!currencyId) return price;
  const c = currencies.find((c) => c.id === currencyId);
  if (!c) return price;
  return price * (c.rate / 100);
}

function isRowEmpty(row: unknown[]): boolean {
  return row.every((cell) => cell == null || String(cell).trim() === '');
}

// ============================================================
// Template generation
// ============================================================

function buildWorkbookBlob(wb: XLSX.WorkBook): Blob {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function generateWaybillTemplate(): Blob {
  const wb = XLSX.utils.book_new();

  const headers = [
    '运单号*', '国家*', '重量(kg)*', '体积(cm)', '申报价值', '币种', '货物类型*',
  ];
  const exampleRows = [
    ['WB20240001', '美国', 2.5, '30*20*15', 50, '美元', '普货'],
    ['WB20240002', '英国', 8.0, '', '', '', '带电'],
    ['WB20240003', '美国', 0.8, '20*15*10', 120, '', 'F货'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  ws['!cols'] = [
    { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 16 },
    { wch: 12 }, { wch: 16 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, '运单数据');

  const instructions = [
    ['运单导入模板 - 填写说明'],
    [],
    ['一、整体说明'],
    ['1. 请从第2行开始填写数据（第1行为表头，带*号的为必填项）。'],
    ['2. 示例数据仅供参考格式，导入前请删除示例行。'],
    [],
    ['二、字段说明'],
    ['列', '字段名', '是否必填', '说明', '示例值'],
    ['A', '运单号', '必填', '运单唯一标识', 'WB20240001'],
    ['B', '国家', '必填', '目的国家名称', '美国'],
    ['C', '重量(kg)', '必填', '实际重量，须大于0', '2.5'],
    ['D', '体积(cm)', '选填', '格式：长*宽*高，单位cm，留空则不计算体积重', '30*20*15'],
    ['E', '申报价值', '选填', '申报货值金额，币种由F列指定', '50'],
    ['F', '币种', '选填', '系统已维护的币种名称；留空表示人民币', '美元'],
    ['G', '货物类型', '必填', '仅限：普货、带电、特敏、F货', '普货'],
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
// Parse waybill import
// ============================================================

interface WaybillImportContext {
  currencies: Currency[];
  countries: Country[];
}

export interface WaybillImportResult {
  success: WaybillRow[];
  errors: RowError[];
}

export async function parseWaybillImport(
  file: File,
  ctx: WaybillImportContext,
): Promise<WaybillImportResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const wsName = wb.SheetNames[0];
  if (!wsName) throw new Error('Excel 文件中没有工作表');
  const ws = wb.Sheets[wsName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

  const success: WaybillRow[] = [];
  const errors: RowError[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || isRowEmpty(row)) continue;

    const rowErrors: string[] = [];

    // A: 运单号
    const trackingNo = str(row[0]);
    if (!trackingNo) rowErrors.push('运单号不能为空');

    // B: 国家
    const country = str(row[1]);
    if (!country) rowErrors.push('国家不能为空');

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

    // G: 货物类型
    let cargoType: CargoType = 'general';
    const ctRaw = str(row[6]);
    if (!ctRaw) {
      rowErrors.push('货物类型不能为空');
    } else {
      const ct = CARGO_TYPE_REVERSE[ctRaw];
      if (!ct) rowErrors.push(`货物类型"${ctRaw}"无效，仅支持：普货、带电、特敏、F货`);
      else cargoType = ct;
    }

    if (rowErrors.length > 0) {
      errors.push({ row: i + 1, name: trackingNo || `(第${i + 1}行)`, errors: rowErrors });
    } else {
      success.push({
        trackingNo,
        country,
        weight,
        length,
        width,
        height,
        declaredValue,
        declaredCurrencyId,
        cargoType,
      });
    }
  }

  return { success, errors };
}

// ============================================================
// Cost calculation — pure functions extracted from Compare.tsx
// ============================================================

export interface CostResult {
  totalCost: number;
  detail: OptimizeCostDetail;
}

export function calcFullServiceCost(
  product: Product,
  waybill: WaybillRow,
  currencies: Currency[],
): CostResult | null {
  const l = waybill.length || 0;
  const w = waybill.width || 0;
  const h = waybill.height || 0;
  const vr = product.volumeRatio || 5000;
  const volumeWeight = vr > 0 ? (l * w * h) / vr : 0;
  const chargeableWeight = Math.max(waybill.weight, volumeWeight);

  // Declared value to RMB
  const dv = waybill.declaredValue || 0;
  const declaredValueRMB = toRMB(dv, waybill.declaredCurrencyId || '', currencies);

  const pm: PricingMode = product.pricingMode || 'weight_range';
  const pTaxRate = product.taxRate || 0;
  const tax = declaredValueRMB * (pTaxRate / 100);
  const discount = product.discount ?? 100;

  if (pm === 'first_weight') {
    const fw = product.firstWeight || 0.5;
    const cw = product.continuedWeight || 0.5;
    const fwp = product.firstWeightPrice || 0;
    const cwp = product.continuedWeightPrice || 0;
    const currId = product.currencyId || '';
    const fwpRMB = toRMB(fwp, currId, currencies);
    const cwpRMB = toRMB(cwp, currId, currencies);

    const totalFreight = chargeableWeight <= fw
      ? fwpRMB
      : fwpRMB + Math.ceil((chargeableWeight - fw) / cw) * cwpRMB;

    const totalCost = totalFreight * (discount / 100) + tax;

    return {
      totalCost: r2(totalCost),
      detail: {
        productType: 'full_service',
        chargeableWeight: r2(chargeableWeight),
        volumeWeight: r2(volumeWeight),
        freight: r2(totalFreight),
        handlingFee: 0,
        tax: r2(tax),
        taxRate: pTaxRate,
        discount: `${discount}%`,
      },
    };
  }

  // weight_range
  const matchedRange = (product.weightRanges || [])
    .sort((a, b) => a.minWeight - b.minWeight)
    .find((rng) => chargeableWeight >= rng.minWeight && chargeableWeight < rng.maxWeight);

  if (!matchedRange) return null;

  const currId = product.currencyId || '';
  const unitPriceRMB = toRMB(matchedRange.unitPrice, currId, currencies);
  const hfRMB = toRMB(matchedRange.handlingFee || 0, currId, currencies);
  const totalFreight = chargeableWeight * unitPriceRMB;
  const totalHandlingFee = hfRMB * 1; // pkgCount = 1

  const totalCost = (totalFreight + totalHandlingFee) * (discount / 100) + tax;

  return {
    totalCost: r2(totalCost),
    detail: {
      productType: 'full_service',
      chargeableWeight: r2(chargeableWeight),
      volumeWeight: r2(volumeWeight),
      freight: r2(totalFreight),
      handlingFee: r2(totalHandlingFee),
      tax: r2(tax),
      taxRate: pTaxRate,
      discount: `${discount}%`,
    },
  };
}

export function calcCombinedCost(
  product: Product,
  waybill: WaybillRow,
  currencies: Currency[],
): CostResult | null {
  const fm = product.firstMile;
  const cm = product.customs;
  const lm = product.lastMile;
  if (!fm || !cm || !lm) return null;

  const l = waybill.length || 0;
  const w = waybill.width || 0;
  const h = waybill.height || 0;

  // Declared value to RMB
  const dv = waybill.declaredValue || 0;
  const declaredValueRMB = toRMB(dv, waybill.declaredCurrencyId || '', currencies);

  // Head: volume weight
  const fmVolumeWeight = fm.volumeRatio > 0 ? (l * w * h) / fm.volumeRatio : 0;
  const fmChargeableWeight = Math.max(waybill.weight, fmVolumeWeight);

  // Head cost
  const fmCostRMB = fmChargeableWeight * toRMB(fm.price, fm.currencyId, currencies) * ((fm.discount ?? 100) / 100);

  // Customs cost (uses head's chargeable weight)
  const cmCostRMB = fmChargeableWeight * toRMB(cm.price, cm.currencyId, currencies) * ((cm.discount ?? 100) / 100);

  // Last mile: independent volume weight
  const lmVolumeWeight = lm.volumeRatio > 0 ? (l * w * h) / lm.volumeRatio : 0;
  const lmChargeableWeight = Math.max(waybill.weight, lmVolumeWeight);
  const lmPm: PricingMode = lm.pricingMode || 'weight_range';

  let lmFreight: number;
  let lmHandlingFee = 0;

  if (lmPm === 'first_weight') {
    const fw = lm.firstWeight || 0.5;
    const cw = lm.continuedWeight || 0.5;
    const fwp = lm.firstWeightPrice || 0;
    const cwp = lm.continuedWeightPrice || 0;
    const lmCurrId = lm.currencyId || '';
    const fwpRMB = toRMB(fwp, lmCurrId, currencies);
    const cwpRMB = toRMB(cwp, lmCurrId, currencies);

    lmFreight = lmChargeableWeight <= fw
      ? fwpRMB
      : fwpRMB + Math.ceil((lmChargeableWeight - fw) / cw) * cwpRMB;
  } else {
    const matchedLmRange = lm.weightRanges
      .sort((a, b) => a.minWeight - b.minWeight)
      .find((rng) => lmChargeableWeight >= rng.minWeight && lmChargeableWeight < rng.maxWeight);

    if (!matchedLmRange) return null;

    const lmCurrId = lm.currencyId || '';
    lmFreight = lmChargeableWeight * toRMB(matchedLmRange.unitPrice, lmCurrId, currencies);
    lmHandlingFee = toRMB(matchedLmRange.handlingFee || 0, lmCurrId, currencies) * 1; // pkgCount = 1
  }

  const lmCost = (lmFreight + lmHandlingFee) * ((lm.discount ?? 100) / 100);
  const cmTaxRate = cm.taxRate || 0;
  const cmTax = declaredValueRMB * (cmTaxRate / 100);
  const totalCost = fmCostRMB + cmCostRMB + lmCost + cmTax;

  return {
    totalCost: r2(totalCost),
    detail: {
      productType: 'combined',
      chargeableWeight: r2(Math.max(fmChargeableWeight, lmChargeableWeight)),
      volumeWeight: r2(Math.max(fmVolumeWeight, lmVolumeWeight)),
      fmChargeableWeight: r2(fmChargeableWeight),
      lmChargeableWeight: r2(lmChargeableWeight),
      firstMileCost: r2(fmCostRMB),
      customsCost: r2(cmCostRMB),
      lastMileCost: r2(lmCost),
      tax: r2(cmTax),
      taxRate: cmTaxRate,
      discount: `头程${fm.discount ?? 100}%/清关${cm.discount ?? 100}%/尾程${lm.discount ?? 100}%`,
    },
  };
}

// ============================================================
// Main optimization driver
// ============================================================

export function runOptimization(
  waybills: WaybillRow[],
  products: Product[],
  currencies: Currency[],
): OptimizeResult[] {
  const activeProducts = products.filter((p) => p.status === 'active');

  return waybills.map((wb) => {
    const candidates = activeProducts.filter(
      (p) => p.country === wb.country && p.cargoType === wb.cargoType,
    );

    if (candidates.length === 0) {
      return {
        trackingNo: wb.trackingNo,
        country: wb.country,
        cargoType: wb.cargoType,
        weight: wb.weight,
        candidateCount: 0,
        noMatchReason: `暂无匹配"${wb.country}"+"${CARGO_TYPE_MAP[wb.cargoType]}"的可用产品`,
      };
    }

    let bestResult: CostResult | null = null;
    let bestProduct: Product | null = null;
    let skippedCount = 0;

    for (const product of candidates) {
      const pt: ProductType = product.productType || 'full_service';
      const result = pt === 'full_service'
        ? calcFullServiceCost(product, wb, currencies)
        : calcCombinedCost(product, wb, currencies);

      if (!result) {
        skippedCount++;
        continue;
      }

      if (!bestResult || result.totalCost < bestResult.totalCost) {
        bestResult = result;
        bestProduct = product;
      }
    }

    if (!bestResult || !bestProduct) {
      return {
        trackingNo: wb.trackingNo,
        country: wb.country,
        cargoType: wb.cargoType,
        weight: wb.weight,
        candidateCount: candidates.length,
        noMatchReason: '货物重量超出所有候选产品的计费范围',
      };
    }

    return {
      trackingNo: wb.trackingNo,
      country: wb.country,
      cargoType: wb.cargoType,
      weight: wb.weight,
      optimalProductId: bestProduct.id,
      optimalProductName: bestProduct.name,
      optimalProductType: bestProduct.productType || 'full_service',
      chargeableWeight: bestResult.detail.chargeableWeight,
      totalCost: bestResult.totalCost,
      discount: bestResult.detail.discount,
      costDetail: bestResult.detail,
      candidateCount: candidates.length,
    };
  });
}

// ============================================================
// Export results to Excel
// ============================================================

export function exportOptimizeResults(results: OptimizeResult[]): Blob {
  const wb = XLSX.utils.book_new();

  const headers = [
    '运单号', '国家', '货物类型', '实际重量(kg)', '计费重量(kg)',
    '最优产品', '产品类型', '折扣', '最终运费(元)',
    '运费', '处理费', '头程费用', '清关费用', '尾程费用', '税金', '备注',
  ];

  const rows = results.map((r) => {
    const ct = CARGO_TYPE_MAP[r.cargoType] || r.cargoType;
    const d = r.costDetail;
    return [
      r.trackingNo,
      r.country,
      ct,
      r.weight,
      r.chargeableWeight ?? '-',
      r.optimalProductName || '-',
      r.optimalProductType === 'combined' ? '组合' : r.optimalProductType === 'full_service' ? '全程' : '-',
      r.discount || '-',
      r.totalCost != null ? r.totalCost : '-',
      d?.freight != null ? d.freight : '-',
      d?.handlingFee != null ? d.handlingFee : '-',
      d?.firstMileCost != null ? d.firstMileCost : '-',
      d?.customsCost != null ? d.customsCost : '-',
      d?.lastMileCost != null ? d.lastMileCost : '-',
      d?.tax != null ? d.tax : '-',
      r.noMatchReason || '',
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 20 }, { wch: 10 }, { wch: 24 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, '优选结果');

  return buildWorkbookBlob(wb);
}
