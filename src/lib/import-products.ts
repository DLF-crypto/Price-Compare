import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import type { Product, Supplier, Currency, Country, WeightRange, CargoType, PricingMode, ProductType, SupplierType } from '@/types';

// ============================================================
// Types
// ============================================================

export interface ImportContext {
  suppliers: Supplier[];
  currencies: Currency[];
  countries: Country[];
  existingProductNames: string[];
}

export interface RowError {
  row: number;
  name: string;
  errors: string[];
}

export interface ImportResult {
  success: Product[];
  errors: RowError[];
}

// ============================================================
// Internal helpers
// ============================================================

const CARGO_TYPE_REVERSE: Record<string, CargoType> = {
  '普货': 'general',
  '带电': 'electric',
  '特敏': 'sensitive',
  'F货': 'f_cargo',
};

const PRICING_MODE_REVERSE: Record<string, PricingMode> = {
  '重量段计费': 'weight_range',
  '首重续重计费': 'first_weight',
};

const SUPPLIER_TYPE_CN: Record<string, string> = {
  full_service: '全程',
  first_mile: '头程',
  customs: '清关',
  last_mile: '尾程',
};

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function num(v: unknown): number {
  if (v == null || v === '') return NaN;
  return Number(v);
}

function resolveSupplier(
  name: string,
  requiredType: SupplierType,
  suppliers: Supplier[],
): { id: string } | { error: string } {
  if (!name) return { error: '供应商不能为空' };
  const s = suppliers.find((s) => s.name === name);
  if (!s) return { error: `供应商"${name}"不存在` };
  if (!s.supplierTypes.includes(requiredType)) {
    return { error: `供应商"${name}"类型不包含"${SUPPLIER_TYPE_CN[requiredType] || requiredType}"` };
  }
  return { id: s.id };
}

function resolveCurrency(
  name: string,
  currencies: Currency[],
): { id: string } | { error: string } | null {
  if (!name) return null; // RMB default
  const c = currencies.find((c) => c.name === name);
  if (!c) return { error: `币种"${name}"不存在` };
  return { id: c.id };
}

function resolveCargoType(cnName: string): CargoType | { error: string } {
  if (!cnName) return { error: '货物类型不能为空' };
  const v = CARGO_TYPE_REVERSE[cnName];
  if (!v) return { error: `货物类型"${cnName}"无效，仅支持：普货、带电、特敏、F货` };
  return v;
}

function resolvePricingMode(cnName: string): PricingMode | { error: string } {
  if (!cnName) return { error: '计费方式不能为空' };
  const v = PRICING_MODE_REVERSE[cnName];
  if (!v) return { error: `计费方式"${cnName}"无效，仅支持：重量段计费、首重续重计费` };
  return v;
}

function parseWeightRangeStr(s: string): WeightRange[] | { error: string } {
  if (!s) return { error: '重量段配置不能为空' };
  const segments = s.split(';').map((seg) => seg.trim()).filter(Boolean);
  if (segments.length === 0) return { error: '重量段配置格式无效' };

  const ranges: WeightRange[] = [];
  for (let i = 0; i < segments.length; i++) {
    const parts = segments[i].split(':');
    if (parts.length < 2 || parts.length > 3) {
      return { error: `重量段第${i + 1}段格式无效："${segments[i]}"` };
    }
    const rangeParts = parts[0].split('-');
    if (rangeParts.length !== 2) {
      return { error: `重量段第${i + 1}段重量范围格式无效："${parts[0]}"` };
    }
    const minW = Number(rangeParts[0]);
    const maxW = Number(rangeParts[1]);
    const unitPrice = Number(parts[1]);
    const handlingFee = parts.length === 3 ? Number(parts[2]) : 0;

    if (isNaN(minW) || isNaN(maxW) || isNaN(unitPrice) || isNaN(handlingFee)) {
      return { error: `重量段第${i + 1}段包含非数字值："${segments[i]}"` };
    }
    if (minW >= maxW) {
      return { error: `重量段第${i + 1}段下限(${minW})须小于上限(${maxW})` };
    }
    if (i > 0 && minW !== ranges[i - 1].maxWeight) {
      return { error: `重量段第${i}段上限(${ranges[i - 1].maxWeight})与第${i + 1}段下限(${minW})不衔接` };
    }
    ranges.push({ id: uuidv4(), minWeight: minW, maxWeight: maxW, unitPrice, handlingFee });
  }
  return ranges;
}

interface FirstWeightConfig {
  firstWeight: number;
  continuedWeight: number;
  firstWeightPrice: number;
  continuedWeightPrice: number;
}

function parseFirstWeightStr(s: string): FirstWeightConfig | { error: string } {
  if (!s) return { error: '首重续重配置不能为空' };
  const parts = s.split(':').map((p) => p.trim());
  if (parts.length !== 4) {
    return { error: `首重续重格式无效："${s}"，应为 首重kg:续重kg:首重价格:续重价格` };
  }
  const [fw, cw, fwp, cwp] = parts.map(Number);
  if (isNaN(fw) || isNaN(cw) || isNaN(fwp) || isNaN(cwp)) {
    return { error: `首重续重配置包含非数字值："${s}"` };
  }
  if (fw !== 0.5 && fw !== 1) {
    return { error: `首重(${fw})仅支持0.5或1` };
  }
  if (cw !== 0.5 && cw !== 1) {
    return { error: `续重(${cw})仅支持0.5或1` };
  }
  return { firstWeight: fw, continuedWeight: cw, firstWeightPrice: fwp, continuedWeightPrice: cwp };
}

function readSheet(file: File): Promise<unknown[][]> {
  return file.arrayBuffer().then((buffer) => {
    const wb = XLSX.read(buffer, { type: 'array' });
    const wsName = wb.SheetNames[0];
    if (!wsName) throw new Error('Excel 文件中没有工作表');
    const ws = wb.Sheets[wsName];
    return XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
  });
}

function isRowEmpty(row: unknown[]): boolean {
  return row.every((cell) => cell == null || String(cell).trim() === '');
}

/**
 * Post-validation: check for duplicate product names.
 * - Against existing products in the system
 * - Within the file itself (multiple rows with the same name)
 * If any duplicate is found, the ENTIRE import fails: all success items
 * are moved into the errors array.
 */
function checkDuplicateNames(
  success: Product[],
  successRowNums: number[],
  errors: RowError[],
  allRowNames: Map<string, number[]>,
  existingNames: Set<string>,
): void {
  let hasDuplicate = false;

  // Check success products against existing names in system
  for (const p of success) {
    if (existingNames.has(p.name)) {
      hasDuplicate = true;
      break;
    }
  }

  // Check for within-file duplicates (across ALL parsed rows, including error rows)
  if (!hasDuplicate) {
    for (const [, rowNums] of allRowNames) {
      if (rowNums.length > 1) {
        hasDuplicate = true;
        break;
      }
    }
  }

  if (!hasDuplicate) return;

  // Move all success products to errors with specific messages
  for (let j = 0; j < success.length; j++) {
    const p = success[j];
    const reasons: string[] = [];
    if (existingNames.has(p.name)) {
      reasons.push(`产品名称"${p.name}"已存在于系统中`);
    }
    const nameRowNums = allRowNames.get(p.name);
    if (nameRowNums && nameRowNums.length > 1) {
      reasons.push(`产品名称"${p.name}"在文件中重复（第${nameRowNums.join('、')}行）`);
    }
    if (reasons.length === 0) {
      reasons.push('导入已取消：文件中存在重复的产品名称');
    }
    errors.push({ row: successRowNums[j], name: p.name, errors: reasons });
  }
  success.length = 0;
}

// ============================================================
// Template generation (browser-side, returns Blob)
// ============================================================

function buildWorkbookBlob(wb: XLSX.WorkBook): Blob {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function generateFullServiceTemplate(): Blob {
  const wb = XLSX.utils.book_new();

  const headers = [
    '产品名称*', '全程供应商*', '目的国家*', '货物类型*', '计费方式*',
    '泡比系数', '结算币种', '税率(%)', '折扣(%)',
    '重量段配置', '首重(kg)', '续重(kg)', '首重价格(元)', '续重价格(元)',
  ];
  const exampleRows = [
    ['美国专线-标准', '锅盔全程物流', '美国', '普货', '重量段计费', 5000, '', 0, 100, '0-5:45:15;5-10:40:15;10-30:35:15;30-9999:30:15', '', '', '', ''],
    ['美国专线-首重版', '锅盔全程物流', '美国', '普货', '首重续重计费', 5000, '', 0, 95, '', 0.5, 0.5, 25, 12],
    ['英国带电专线', '锅盔全程物流', '英国', '带电', '重量段计费', 6000, '英镑', 5, 90, '0-5:8:2;5-20:6.5:2;20-9999:5:2', '', '', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  ws['!cols'] = [
    { wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 14 },
    { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
    { wch: 50 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, '产品数据');

  const instructions = [
    ['全程产品导入模板 - 填写说明'],
    [],
    ['一、整体说明'],
    ['1. 请从第2行开始填写数据（第1行为表头，带*号的为必填项）。'],
    ['2. 示例数据仅供参考格式，导入前请删除示例行。'],
    ['3. 导入前请确保系统中已存在对应的供应商、国家和币种记录，否则该行会导入失败。'],
    [],
    ['二、字段说明'],
    ['列', '字段名', '是否必填', '说明', '示例值'],
    ['A', '产品名称', '必填', '产品的唯一标识名称', '美国专线-标准'],
    ['B', '全程供应商', '必填', '系统中已存在的供应商名称，该供应商类型须包含"全程"', '锅盔全程物流'],
    ['C', '目的国家', '必填', '系统中已存在的国家名称', '美国'],
    ['D', '货物类型', '必填', '仅限：普货、带电、特敏、F货', '普货'],
    ['E', '计费方式', '必填', '仅限：重量段计费 或 首重续重计费', '重量段计费'],
    ['F', '泡比系数', '选填', '体积重=长x宽x高/泡比，留空默认5000', '5000'],
    ['G', '结算币种', '选填', '留空=人民币；外币填写系统中"货币维护"页面的货币名称', '英镑'],
    ['H', '税率(%)', '选填', '数字，0~100，留空默认0', '5'],
    ['I', '折扣(%)', '选填', '数字，0~100，100表示不打折，留空默认100', '90'],
    ['J', '重量段配置', '条件必填', '计费方式=重量段计费时必填，格式见下方说明', '0-5:45:15;5-10:40:15'],
    ['K', '首重(kg)', '条件必填', '计费方式=首重续重计费时必填，仅支持0.5或1', '0.5'],
    ['L', '续重(kg)', '条件必填', '计费方式=首重续重计费时必填，仅支持0.5或1', '0.5'],
    ['M', '首重价格(元)', '条件必填', '计费方式=首重续重计费时必填，首重区间的收费金额', '25'],
    ['N', '续重价格(元)', '条件必填', '计费方式=首重续重计费时必填，每个续重步长的加价金额', '12'],
    [],
    ['三、重量段配置格式说明（J列）'],
    [],
    ['格式：最小重量-最大重量:单价:操作费;最小重量-最大重量:单价:操作费;...'],
    ['规则：'],
    ['1. 每个重量段用英文分号 ; 分隔'],
    ['2. 每段内用英文冒号 : 分隔三个值：最小重量-最大重量 : 单价(元/kg) : 操作费(元/票)'],
    ['3. 最后一段的最大重量填 9999 代表不封顶'],
    ['4. 操作费可省略（默认为0），如 0-5:45 等同于 0-5:45:0'],
    ['5. 相邻段必须衔接，即前段上限 = 后段下限'],
    [],
    ['四、首重续重说明（K/L/M/N列）'],
    [],
    ['当计费方式=首重续重计费时，填写K/L/M/N列（J列留空）：'],
    ['  K列（首重kg）：仅支持 0.5 或 1'],
    ['  L列（续重kg）：仅支持 0.5 或 1，可与首重不同'],
    ['  M列（首重价格）：首重区间的收费金额'],
    ['  N列（续重价格）：每超出一个续重步长加收的金额'],
    [],
    ['五、供应商/国家/币种匹配规则'],
    [],
    ['1. 系统采用完全匹配（区分大小写、全半角）'],
    ['2. 若名称找不到匹配项，该行将导入失败'],
    ['3. 币种名称须与系统中"货币维护"页面的货币名称完全一致'],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(instructions);
  ws2['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 10 }, { wch: 70 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws2, '填写说明');

  return buildWorkbookBlob(wb);
}

export function generateCombinedTemplate(): Blob {
  const wb = XLSX.utils.book_new();

  const headers = [
    '产品名称*', '目的国家*', '货物类型*', '状态',
    '头程供应商*', '头程单价(元/kg)*', '头程币种', '头程泡比', '头程折扣(%)',
    '清关供应商*', '清关单价(元/kg)*', '清关币种', '税率(%)', '清关折扣(%)',
    '尾程供应商*', '尾程币种', '尾程泡比', '尾程折扣(%)', '尾程计费方式*', '尾程定价配置*',
  ];
  const exampleRows = [
    ['美国组合专线', '美国', 'F货', '启用', '顺丰国际', 3.5, '', 5000, 100, '中通国际', 1.2, '', 0, 100, '圆通速递', '', 5000, 100, '重量段计费', '0-5:8:10;5-10:7:10;10-30:6:10;30-9999:5:10'],
    ['英国组合经济线', '英国', '普货', '启用', '顺丰国际', 4.0, '', 5000, 100, '中通国际', 1.5, '', 5, 95, '圆通速递', '', 6000, 100, '首重续重计费', '0.5:0.5:20:10'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  ws['!cols'] = [
    { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 8 },
    { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 50 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, '产品数据');

  const instructions = [
    ['组合产品导入模板 - 填写说明'],
    [],
    ['一、整体说明'],
    ['1. 组合产品由"头程 + 清关 + 尾程"三段构成，三段供应商均须填写。'],
    ['2. 请从第2行开始填写数据（第1行为表头，带*号的为必填项）。'],
    ['3. 示例数据仅供参考格式，导入前请删除示例行。'],
    [],
    ['二、字段说明'],
    [],
    ['【基础信息 A~D列】'],
    ['A: 产品名称(必填)  B: 目的国家(必填)  C: 货物类型(必填, 普货/带电/特敏/F货)  D: 状态(选填, 启用/停用, 默认启用)'],
    [],
    ['【头程配置 E~I列】'],
    ['E: 头程供应商(必填)  F: 头程单价元/kg(必填)  G: 头程币种(选填)  H: 头程泡比(选填,默认5000)  I: 头程折扣%(选填,默认100)'],
    [],
    ['【清关配置 J~N列】'],
    ['J: 清关供应商(必填)  K: 清关单价元/kg(必填)  L: 清关币种(选填)  M: 税率%(选填,默认0)  N: 清关折扣%(选填,默认100)'],
    [],
    ['【尾程配置 O~T列】'],
    ['O: 尾程供应商(必填)  P: 尾程币种(选填)  Q: 尾程泡比(选填,默认5000)  R: 尾程折扣%(选填,默认100)'],
    ['S: 尾程计费方式(必填, 重量段计费/首重续重计费)  T: 尾程定价配置(必填, 格式见下方)'],
    [],
    ['三、T列格式说明'],
    [],
    ['重量段计费时：最小-最大:单价:操作费;...  示例：0-5:8:10;5-10:7:10;30-9999:5:10'],
    ['首重续重计费时：首重kg:续重kg:首重价格:续重价格  示例：0.5:0.5:20:10'],
    [],
    ['四、供应商类型匹配规则'],
    ['E列供应商须为头程类型  J列须为清关类型  O列须为尾程类型'],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(instructions);
  ws2['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, ws2, '填写说明');

  return buildWorkbookBlob(wb);
}

// ============================================================
// Parse functions
// ============================================================

export async function parseFullServiceImport(file: File, ctx: ImportContext): Promise<ImportResult> {
  const rows = await readSheet(file);
  const success: Product[] = [];
  const successRowNums: number[] = [];
  const errors: RowError[] = [];
  const allRowNames = new Map<string, number[]>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || isRowEmpty(row)) continue;

    const rowErrors: string[] = [];
    const name = str(row[0]);
    if (!name) rowErrors.push('产品名称不能为空');

    // Track all names for within-file duplicate detection
    if (name) {
      const arr = allRowNames.get(name) || [];
      arr.push(i + 1);
      allRowNames.set(name, arr);
    }

    // Supplier
    let supplierId = '';
    const supplierResult = resolveSupplier(str(row[1]), 'full_service', ctx.suppliers);
    if ('error' in supplierResult) rowErrors.push(supplierResult.error);
    else supplierId = supplierResult.id;

    // Country
    const country = str(row[2]);
    if (!country) {
      rowErrors.push('目的国家不能为空');
    } else if (!ctx.countries.find((c) => c.name === country)) {
      rowErrors.push(`国家"${country}"不存在`);
    }

    // Cargo type
    let cargoType: CargoType = 'general';
    const ctResult = resolveCargoType(str(row[3]));
    if (typeof ctResult === 'object') rowErrors.push(ctResult.error);
    else cargoType = ctResult;

    // Pricing mode
    let pricingMode: PricingMode = 'weight_range';
    const pmResult = resolvePricingMode(str(row[4]));
    if (typeof pmResult === 'object') rowErrors.push(pmResult.error);
    else pricingMode = pmResult;

    // Optional fields
    const volumeRatio = num(row[5]);
    const taxRate = num(row[7]);
    const discount = num(row[8]);

    // Currency
    let currencyId = '';
    const currResult = resolveCurrency(str(row[6]), ctx.currencies);
    if (currResult && 'error' in currResult) rowErrors.push(currResult.error);
    else if (currResult) currencyId = currResult.id;

    // Pricing-specific fields
    let weightRanges: WeightRange[] = [];
    let firstWeight: number | undefined;
    let continuedWeight: number | undefined;
    let firstWeightPrice: number | undefined;
    let continuedWeightPrice: number | undefined;

    if (pricingMode === 'weight_range') {
      const wrResult = parseWeightRangeStr(str(row[9]));
      if ('error' in wrResult) rowErrors.push(wrResult.error);
      else weightRanges = wrResult;
    } else if (pricingMode === 'first_weight') {
      const fw = num(row[10]);
      const cw = num(row[11]);
      const fwp = num(row[12]);
      const cwp = num(row[13]);
      if (isNaN(fw)) rowErrors.push('首重(kg)不能为空');
      else if (fw !== 0.5 && fw !== 1) rowErrors.push(`首重(${fw})仅支持0.5或1`);
      else firstWeight = fw;

      if (isNaN(cw)) rowErrors.push('续重(kg)不能为空');
      else if (cw !== 0.5 && cw !== 1) rowErrors.push(`续重(${cw})仅支持0.5或1`);
      else continuedWeight = cw;

      if (isNaN(fwp)) rowErrors.push('首重价格不能为空');
      else firstWeightPrice = fwp;

      if (isNaN(cwp)) rowErrors.push('续重价格不能为空');
      else continuedWeightPrice = cwp;
    }

    if (rowErrors.length > 0) {
      errors.push({ row: i + 1, name: name || `(第${i + 1}行)`, errors: rowErrors });
    } else {
      const product: Product = {
        id: uuidv4(),
        name,
        productType: 'full_service' as ProductType,
        supplierId,
        country,
        cargoType,
        volumeRatio: isNaN(volumeRatio) ? 5000 : volumeRatio,
        currencyId,
        taxRate: isNaN(taxRate) ? 0 : taxRate,
        discount: isNaN(discount) ? 100 : discount,
        status: 'active',
        pricingMode,
        weightRanges,
        ...(pricingMode === 'first_weight' ? { firstWeight, continuedWeight, firstWeightPrice, continuedWeightPrice } : {}),
        createdAt: new Date().toISOString(),
      };
      success.push(product);
      successRowNums.push(i + 1);
    }
  }

  // Post-validation: duplicate name check
  const existingNames = new Set(ctx.existingProductNames);
  checkDuplicateNames(success, successRowNums, errors, allRowNames, existingNames);

  return { success, errors };
}

export async function parseCombinedImport(file: File, ctx: ImportContext): Promise<ImportResult> {
  const rows = await readSheet(file);
  const success: Product[] = [];
  const successRowNums: number[] = [];
  const errors: RowError[] = [];
  const allRowNames = new Map<string, number[]>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || isRowEmpty(row)) continue;

    const rowErrors: string[] = [];
    const name = str(row[0]);
    if (!name) rowErrors.push('产品名称不能为空');

    // Track all names for within-file duplicate detection
    if (name) {
      const arr = allRowNames.get(name) || [];
      arr.push(i + 1);
      allRowNames.set(name, arr);
    }

    // Country
    const country = str(row[1]);
    if (!country) {
      rowErrors.push('目的国家不能为空');
    } else if (!ctx.countries.find((c) => c.name === country)) {
      rowErrors.push(`国家"${country}"不存在`);
    }

    // Cargo type
    let cargoType: CargoType = 'general';
    const ctResult = resolveCargoType(str(row[2]));
    if (typeof ctResult === 'object') rowErrors.push(ctResult.error);
    else cargoType = ctResult;

    // Status
    const statusStr = str(row[3]);
    const status: 'active' | 'inactive' = statusStr === '停用' ? 'inactive' : 'active';

    // === First Mile (E-I, index 4-8) ===
    let fmSupplierId = '';
    const fmSupResult = resolveSupplier(str(row[4]), 'first_mile', ctx.suppliers);
    if ('error' in fmSupResult) rowErrors.push('头程: ' + fmSupResult.error);
    else fmSupplierId = fmSupResult.id;

    const fmPrice = num(row[5]);
    if (isNaN(fmPrice)) rowErrors.push('头程单价不能为空');

    let fmCurrencyId = '';
    const fmCurrResult = resolveCurrency(str(row[6]), ctx.currencies);
    if (fmCurrResult && 'error' in fmCurrResult) rowErrors.push('头程: ' + fmCurrResult.error);
    else if (fmCurrResult) fmCurrencyId = fmCurrResult.id;

    const fmVolumeRatio = num(row[7]);
    const fmDiscount = num(row[8]);

    // === Customs (J-N, index 9-13) ===
    let cmSupplierId = '';
    const cmSupResult = resolveSupplier(str(row[9]), 'customs', ctx.suppliers);
    if ('error' in cmSupResult) rowErrors.push('清关: ' + cmSupResult.error);
    else cmSupplierId = cmSupResult.id;

    const cmPrice = num(row[10]);
    if (isNaN(cmPrice)) rowErrors.push('清关单价不能为空');

    let cmCurrencyId = '';
    const cmCurrResult = resolveCurrency(str(row[11]), ctx.currencies);
    if (cmCurrResult && 'error' in cmCurrResult) rowErrors.push('清关: ' + cmCurrResult.error);
    else if (cmCurrResult) cmCurrencyId = cmCurrResult.id;

    const cmTaxRate = num(row[12]);
    const cmDiscount = num(row[13]);

    // === Last Mile (O-T, index 14-19) ===
    let lmSupplierId = '';
    const lmSupResult = resolveSupplier(str(row[14]), 'last_mile', ctx.suppliers);
    if ('error' in lmSupResult) rowErrors.push('尾程: ' + lmSupResult.error);
    else lmSupplierId = lmSupResult.id;

    let lmCurrencyId = '';
    const lmCurrResult = resolveCurrency(str(row[15]), ctx.currencies);
    if (lmCurrResult && 'error' in lmCurrResult) rowErrors.push('尾程: ' + lmCurrResult.error);
    else if (lmCurrResult) lmCurrencyId = lmCurrResult.id;

    const lmVolumeRatio = num(row[16]);
    const lmDiscount = num(row[17]);

    // Last mile pricing mode
    let lmPricingMode: PricingMode = 'weight_range';
    const lmPmResult = resolvePricingMode(str(row[18]));
    if (typeof lmPmResult === 'object') rowErrors.push('尾程: ' + lmPmResult.error);
    else lmPricingMode = lmPmResult;

    // Last mile pricing config (T column, index 19)
    let lmWeightRanges: WeightRange[] = [];
    let lmFirstWeight: number | undefined;
    let lmContinuedWeight: number | undefined;
    let lmFirstWeightPrice: number | undefined;
    let lmContinuedWeightPrice: number | undefined;

    const pricingConfigStr = str(row[19]);
    if (lmPricingMode === 'weight_range') {
      const wrResult = parseWeightRangeStr(pricingConfigStr);
      if ('error' in wrResult) rowErrors.push('尾程: ' + wrResult.error);
      else lmWeightRanges = wrResult;
    } else if (lmPricingMode === 'first_weight') {
      const fwResult = parseFirstWeightStr(pricingConfigStr);
      if ('error' in fwResult) rowErrors.push('尾程: ' + fwResult.error);
      else {
        lmFirstWeight = fwResult.firstWeight;
        lmContinuedWeight = fwResult.continuedWeight;
        lmFirstWeightPrice = fwResult.firstWeightPrice;
        lmContinuedWeightPrice = fwResult.continuedWeightPrice;
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ row: i + 1, name: name || `(第${i + 1}行)`, errors: rowErrors });
    } else {
      const product: Product = {
        id: uuidv4(),
        name,
        productType: 'combined' as ProductType,
        country,
        cargoType,
        status,
        firstMile: {
          supplierId: fmSupplierId,
          price: fmPrice,
          currencyId: fmCurrencyId,
          volumeRatio: isNaN(fmVolumeRatio) ? 5000 : fmVolumeRatio,
          discount: isNaN(fmDiscount) ? 100 : fmDiscount,
        },
        customs: {
          supplierId: cmSupplierId,
          price: cmPrice,
          currencyId: cmCurrencyId,
          taxRate: isNaN(cmTaxRate) ? 0 : cmTaxRate,
          discount: isNaN(cmDiscount) ? 100 : cmDiscount,
        },
        lastMile: {
          supplierId: lmSupplierId,
          currencyId: lmCurrencyId,
          volumeRatio: isNaN(lmVolumeRatio) ? 5000 : lmVolumeRatio,
          discount: isNaN(lmDiscount) ? 100 : lmDiscount,
          weightRanges: lmWeightRanges,
          pricingMode: lmPricingMode,
          ...(lmPricingMode === 'first_weight' ? {
            firstWeight: lmFirstWeight,
            continuedWeight: lmContinuedWeight,
            firstWeightPrice: lmFirstWeightPrice,
            continuedWeightPrice: lmContinuedWeightPrice,
          } : {}),
        },
        createdAt: new Date().toISOString(),
      };
      success.push(product);
      successRowNums.push(i + 1);
    }
  }

  // Post-validation: duplicate name check
  const existingNames = new Set(ctx.existingProductNames);
  checkDuplicateNames(success, successRowNums, errors, allRowNames, existingNames);

  return { success, errors };
}
