import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { useProductStore } from '@/store/products';
import { useSupplierStore } from '@/store/suppliers';
import { useCurrencyStore } from '@/store/currencies';
import type { CompareResult, ProductType } from '@/types';
import { CARGO_TYPE_OPTIONS } from '@/types';

export default function ComparePage() {
  const { products, load: loadProducts } = useProductStore();
  const { suppliers, load: loadSuppliers } = useSupplierStore();
  const { currencies, load: loadCurrencies } = useCurrencyStore();

  const [country, setCountry] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [packageCount, setPackageCount] = useState('1');
  const [cargoType, setCargoType] = useState('');
  const [results, setResults] = useState<CompareResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [declaredValue, setDeclaredValue] = useState('');
  const [declaredValueCurrencyId, setDeclaredValueCurrencyId] = useState('');

  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadCurrencies();
  }, [loadProducts, loadSuppliers, loadCurrencies]);

  const countries = [...new Set(products.filter((p) => p.status === 'active').map((p) => p.country))];

  // Convert foreign price to RMB: price * (rate / 100)
  const toRMB = (price: number, currencyId: string): number => {
    if (!currencyId) return price; // already RMB
    const currency = currencies.find((c) => c.id === currencyId);
    if (!currency) return price;
    return price * (currency.rate / 100);
  };

  const handleCompare = () => {
    const w = parseFloat(weight) || 0;
    const l = parseFloat(length) || 0;
    const wi = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const pkgCount = parseInt(packageCount) || 1;

    if (!country || !cargoType) return;

    const dv = parseFloat(declaredValue) || 0;
    const declaredValueRMB = toRMB(dv, declaredValueCurrencyId);

    const activeProducts = products.filter(
      (p) => p.status === 'active' && p.country === country && p.cargoType === cargoType
    );

    const compareResults: CompareResult[] = [];

    for (const product of activeProducts) {
      const pt: ProductType = product.productType || 'full_service';

      if (pt === 'full_service') {
        // Full service logic (unchanged)
        const supplier = suppliers.find((s) => s.id === product.supplierId);
        if (!supplier || supplier.status !== 'active') continue;

        const vr = product.volumeRatio || 5000;
        const volumeWeight = vr > 0 ? (l * wi * h) / vr : 0;
        const chargeableWeight = Math.max(w, volumeWeight);
        const pm = product.pricingMode || 'weight_range';

        if (pm === 'first_weight') {
          const fw = product.firstWeight || 0.5;
          const cw = product.continuedWeight || 0.5;
          const fwp = product.firstWeightPrice || 0;
          const cwp = product.continuedWeightPrice || 0;
          const currId = product.currencyId || '';
          const fwpRMB = toRMB(fwp, currId);
          const cwpRMB = toRMB(cwp, currId);

          const totalFreight = chargeableWeight <= fw
            ? fwpRMB
            : fwpRMB + Math.ceil((chargeableWeight - fw) / cw) * cwpRMB;

          const pTaxRate = product.taxRate || 0;
          const tax = declaredValueRMB * (pTaxRate / 100);
          const discount = product.discount ?? 100;
          const totalCost = totalFreight * (discount / 100) + tax;
          compareResults.push({
            productType: 'full_service',
            pricingMode: 'first_weight',
            supplierId: supplier.id,
            supplierName: supplier.name,
            productName: product.name,
            productId: product.id,
            volumeWeight: Math.round(volumeWeight * 100) / 100,
            chargeableWeight: Math.round(chargeableWeight * 100) / 100,
            unitPrice: 0,
            weightRange: `首重${fw}kg/¥${fwp} 续重${cw}kg/¥${cwp}`,
            handlingFee: 0,
            totalFreight: Math.round(totalFreight * 100) / 100,
            totalHandlingFee: 0,
            totalCost: Math.round(totalCost * 100) / 100,
            taxRate: pTaxRate,
            tax: Math.round(tax * 100) / 100,
          });
        } else {
          const matchedRange = (product.weightRanges || [])
            .sort((a, b) => a.minWeight - b.minWeight)
            .find((r) => chargeableWeight >= r.minWeight && chargeableWeight < r.maxWeight);

          if (!matchedRange) continue;

          const currId = product.currencyId || '';
          const unitPriceRMB = toRMB(matchedRange.unitPrice, currId);
          const hf = matchedRange.handlingFee || 0;
          const hfRMB = toRMB(hf, currId);
          const totalHandlingFee = hfRMB * pkgCount;
          const totalFreight = chargeableWeight * unitPriceRMB;

          const pTaxRate = product.taxRate || 0;
          const tax = declaredValueRMB * (pTaxRate / 100);
          const discount = product.discount ?? 100;
          const totalCost = (totalFreight + totalHandlingFee) * (discount / 100) + tax;

          compareResults.push({
            productType: 'full_service',
            pricingMode: 'weight_range',
            supplierId: supplier.id,
            supplierName: supplier.name,
            productName: product.name,
            productId: product.id,
            volumeWeight: Math.round(volumeWeight * 100) / 100,
            chargeableWeight: Math.round(chargeableWeight * 100) / 100,
            unitPrice: unitPriceRMB,
            weightRange: `${matchedRange.minWeight}-${matchedRange.maxWeight}kg`,
            handlingFee: hfRMB,
            totalFreight: Math.round(totalFreight * 100) / 100,
            totalHandlingFee: Math.round(totalHandlingFee * 100) / 100,
            totalCost: Math.round(totalCost * 100) / 100,
            taxRate: pTaxRate,
            tax: Math.round(tax * 100) / 100,
          });
        }
      } else {
        // Combined product logic
        const fm = product.firstMile;
        const cm = product.customs;
        const lm = product.lastMile;
        if (!fm || !cm || !lm) continue;

        const fmSupplier = suppliers.find((s) => s.id === fm.supplierId);
        const cmSupplier = suppliers.find((s) => s.id === cm.supplierId);
        const lmSupplier = suppliers.find((s) => s.id === lm.supplierId);
        if (!fmSupplier?.status || fmSupplier.status !== 'active') continue;
        if (!cmSupplier?.status || cmSupplier.status !== 'active') continue;
        if (!lmSupplier?.status || lmSupplier.status !== 'active') continue;

        // Head: volume weight based on firstMile volumeRatio
        const fmVolumeWeight = fm.volumeRatio > 0 ? (l * wi * h) / fm.volumeRatio : 0;
        const fmChargeableWeight = Math.max(w, fmVolumeWeight);

        // Head cost (convert to RMB)
        const fmCostRMB = fmChargeableWeight * toRMB(fm.price, fm.currencyId) * ((fm.discount ?? 100) / 100);

        // Customs cost: uses HEAD's chargeable weight
        const cmCostRMB = fmChargeableWeight * toRMB(cm.price, cm.currencyId) * ((cm.discount ?? 100) / 100);

        // Last mile: independent volume weight
        const lmVolumeWeight = lm.volumeRatio > 0 ? (l * wi * h) / lm.volumeRatio : 0;
        const lmChargeableWeight = Math.max(w, lmVolumeWeight);
        const lmPm = lm.pricingMode || 'weight_range';

        let lmFreight: number;
        let lmWeightRangeLabel: string;
        let lmPricingMode = lmPm;
        let lmHandlingFee = 0;

        if (lmPm === 'first_weight') {
          const fw = lm.firstWeight || 0.5;
          const cw = lm.continuedWeight || 0.5;
          const fwp = lm.firstWeightPrice || 0;
          const cwp = lm.continuedWeightPrice || 0;
          const lmCurrId = lm.currencyId || '';
          const fwpRMB = toRMB(fwp, lmCurrId);
          const cwpRMB = toRMB(cwp, lmCurrId);

          lmFreight = lmChargeableWeight <= fw
            ? fwpRMB
            : fwpRMB + Math.ceil((lmChargeableWeight - fw) / cw) * cwpRMB;
          lmWeightRangeLabel = `首重${fw}kg/¥${fwp} 续重${cw}kg/¥${cwp} (尾程)`;
        } else {
          const matchedLmRange = lm.weightRanges
            .sort((a, b) => a.minWeight - b.minWeight)
            .find((r) => lmChargeableWeight >= r.minWeight && lmChargeableWeight < r.maxWeight);

          if (!matchedLmRange) continue;

          const lmCurrId = lm.currencyId || '';
          lmFreight = lmChargeableWeight * toRMB(matchedLmRange.unitPrice, lmCurrId);
          lmHandlingFee = toRMB(matchedLmRange.handlingFee || 0, lmCurrId) * pkgCount;
          lmWeightRangeLabel = `${matchedLmRange.minWeight}-${matchedLmRange.maxWeight}kg (尾程)`;
        }

        const lmCost = (lmFreight + lmHandlingFee) * ((lm.discount ?? 100) / 100);
        const cmTaxRate = cm.taxRate || 0;
        const cmTax = declaredValueRMB * (cmTaxRate / 100);
        const totalCost = fmCostRMB + cmCostRMB + lmCost + cmTax;

        const supplierNames = `${fmSupplier.name} / ${cmSupplier.name} / ${lmSupplier.name}`;

        compareResults.push({
          productType: 'combined',
          pricingMode: lmPricingMode as import('@/types').PricingMode,
          supplierId: fmSupplier.id,
          supplierName: supplierNames,
          productName: product.name,
          productId: product.id,
          volumeWeight: Math.round(Math.max(fmVolumeWeight, lmVolumeWeight) * 100) / 100,
          chargeableWeight: Math.round(Math.max(fmChargeableWeight, lmChargeableWeight) * 100) / 100,
          unitPrice: 0,
          weightRange: lmWeightRangeLabel,
          handlingFee: lmPm === 'first_weight' ? 0 : (lmHandlingFee / pkgCount),
          totalFreight: Math.round((fmCostRMB + cmCostRMB + lmFreight) * 100) / 100,
          totalHandlingFee: Math.round(lmHandlingFee * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          taxRate: cmTaxRate,
          tax: Math.round(cmTax * 100) / 100,
          firstMileCost: Math.round(fmCostRMB * 100) / 100,
          customsCost: Math.round(cmCostRMB * 100) / 100,
          lastMileCost: Math.round(lmCost * 100) / 100,
        });
      }
    }

    compareResults.sort((a, b) => a.totalCost - b.totalCost);
    setResults(compareResults);
    setHasSearched(true);
  };

  const minCost = results.length > 0 ? results[0].totalCost : 0;

  const columns: Column<CompareResult>[] = [
    {
      key: 'rank',
      title: '排名',
      render: (_, index) => (
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
          index === 0 ? 'bg-amber-100 text-amber-700' :
          index === 1 ? 'bg-slate-200 text-slate-600' :
          index === 2 ? 'bg-orange-100 text-orange-600' :
          'text-slate-400'
        }`}>
          {index + 1}
        </span>
      ),
      className: 'w-16',
    },
    {
      key: 'productName',
      title: '产品',
      render: (row) => (
        <div>
          <div>{row.productName}</div>
          {row.productType === 'combined' && (
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '9999px',
              backgroundColor: '#ede9fe',
              color: '#7c3aed',
            }}>组合</span>
          )}
        </div>
      ),
    },
    {
      key: 'supplierName',
      title: '供应商',
      render: (row) => (
        <span style={{ fontSize: row.productType === 'combined' ? '12px' : '14px' }}>
          {row.supplierName}
        </span>
      ),
    },
    {
      key: 'volumeWeight',
      title: '体积重(kg)',
      render: (row) => row.volumeWeight.toFixed(2),
    },
    {
      key: 'chargeableWeight',
      title: '计费重(kg)',
      render: (row) => <span className="font-semibold">{row.chargeableWeight.toFixed(2)}</span>,
    },
    { key: 'weightRange', title: '匹配重量段' },
    {
      key: 'unitPrice',
      title: '单价(元/kg)',
      render: (row) => (row.productType === 'combined' || row.pricingMode === 'first_weight') ? '-' : `¥${row.unitPrice.toFixed(2)}`,
    },
    {
      key: 'totalFreight',
      title: '运费(元)',
      render: (row) => {
        if (row.productType === 'combined') {
          return (
            <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
              <div>头程: ¥{row.firstMileCost?.toFixed(2)}</div>
              <div>清关: ¥{row.customsCost?.toFixed(2)}</div>
              <div>尾程: ¥{row.lastMileCost?.toFixed(2)}</div>
            </div>
          );
        }
        return `¥${row.totalFreight.toFixed(2)}`;
      },
    },
    {
      key: 'totalHandlingFee',
      title: '处理费(元)',
      render: (row) => `¥${row.totalHandlingFee.toFixed(2)}`,
    },
    {
      key: 'tax',
      title: '税金(元)',
      render: (row) => {
        const tax = row.tax || 0;
        return tax > 0 ? `¥${tax.toFixed(2)}` : '-';
      },
    },
    {
      key: 'totalCost',
      title: '总费用(元)',
      render: (row) => (
        <span className={`font-bold text-base ${row.totalCost === minCost ? 'text-green-600' : 'text-slate-800'}`}>
          ¥{row.totalCost.toFixed(2)}
          {row.totalCost === minCost && (
            <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
              最低
            </span>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div>
        <h2 className="text-xl font-bold text-slate-800">运费比价</h2>
        <p className="text-sm text-slate-500 page-title-desc">输入包裹信息，快速对比各供应商报价</p>
      </div>

      <Card>
        <div className="form-grid grid-cols-2 md:grid-cols-3">
          <Select
            label="目的国家"
            options={countries.map((c) => ({ value: c, label: c }))}
            placeholder="选择国家"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
          <Select
            label="货物类型"
            options={CARGO_TYPE_OPTIONS}
            placeholder="请选择货物类型"
            value={cargoType}
            onChange={(e) => setCargoType(e.target.value)}
          />
          <Input
            label="实际重量(kg)"
            type="number"
            placeholder="0.00"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-grid grid-cols-2" style={{ marginTop: '12px' }}>
          <Input
            label="申报价值"
            type="number"
            placeholder="0.00"
            value={declaredValue}
            onChange={(e) => setDeclaredValue(e.target.value)}
            min="0"
            step="0.01"
          />
          <Select
            label="申报币种"
            options={[
              { value: '', label: '人民币 (默认)' },
              ...currencies.filter((c) => c.status === 'active').map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={declaredValueCurrencyId}
            onChange={(e) => setDeclaredValueCurrencyId(e.target.value)}
          />
        </div>
        <div className="form-grid grid-cols-2 md:grid-cols-4" style={{ marginTop: '12px' }}>
          <Input
            label="长(cm)"
            type="number"
            placeholder="0"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            min="0"
          />
          <Input
            label="宽(cm)"
            type="number"
            placeholder="0"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            min="0"
          />
          <Input
            label="高(cm)"
            type="number"
            placeholder="0"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            min="0"
          />
          <Input
            label="包裹数量"
            type="number"
            placeholder="1"
            value={packageCount}
            onChange={(e) => setPackageCount(e.target.value)}
            min="1"
          />
        </div>
        <div style={{ marginTop: '16px' }} className="flex justify-end">
          <Button onClick={handleCompare} disabled={!country || !cargoType}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            开始比价
          </Button>
        </div>
      </Card>

      {hasSearched && (
        <Card title={`比价结果 (${results.length} 条)`}>
          <Table
            columns={columns}
            data={results}
            rowKey={(row) => row.productId}
            highlightRow={(row) => row.totalCost === minCost}
            emptyText="未找到匹配的产品报价"
          />
          {results.length > 0 && (
            <div className="mt-4 p-3 bg-sky-50 rounded-lg text-sm text-sky-700">
              <strong>计费说明：</strong>
              <br />
              重量段计费：体积重 = 长 x 宽 x 高 / 泡比系数；计费重 = max(实际重量, 体积重)；总费用 = 计费重 x 单价 + 匹配重量段处理费 x 包裹数
              <br />
              首重续重计费：若计费重 &le; 首重，运费 = 首重价格；若计费重 &gt; 首重，运费 = 首重价格 + &lceil;(计费重 - 首重) / 续重&rceil; x 续重价格
              <br />
              组合产品：头程费用 + 清关费用 + 尾程费用 + 税金，外币按汇率(100外币 = ?人民币)折算
              <br />
              税金计算：税金 = 申报价值(折合人民币) × 税率(%)
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
