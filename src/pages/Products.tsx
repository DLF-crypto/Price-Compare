import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useProductStore } from '@/store/products';
import { useSupplierStore } from '@/store/suppliers';
import { useCountryStore } from '@/store/countries';
import { useCurrencyStore } from '@/store/currencies';
import type { Product, ProductType, WeightRange, CargoType, PricingMode } from '@/types';
import { CARGO_TYPE_OPTIONS, CARGO_TYPE_MAP, PRICING_MODE_OPTIONS, WEIGHT_STEP_OPTIONS } from '@/types';

export default function ProductsPage() {
  const { products, load: loadProducts, add, update, remove } = useProductStore();
  const { suppliers, load: loadSuppliers } = useSupplierStore();
  const { countries, load: loadCountries } = useCountryStore();
  const { currencies, load: loadCurrencies } = useCurrencyStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  // Step control
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [productType, setProductType] = useState<ProductType>('full_service');

  // Full service form state
  const [name, setName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [country, setCountry] = useState('');
  const [volumeRatio, setVolumeRatio] = useState('5000');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [cargoType, setCargoType] = useState('');
  const [weightRanges, setWeightRanges] = useState<WeightRange[]>([
    { id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 0 },
  ]);
  const [pricingMode, setPricingMode] = useState('weight_range');
  const [firstWeight, setFirstWeight] = useState('0.5');
  const [continuedWeight, setContinuedWeight] = useState('0.5');
  const [firstWeightPrice, setFirstWeightPrice] = useState('');
  const [continuedWeightPrice, setContinuedWeightPrice] = useState('');
  const [fullCurrencyId, setFullCurrencyId] = useState('');
  const [fullTaxRate, setFullTaxRate] = useState('0');

  // Combined product form state - first mile
  const [fmSupplierId, setFmSupplierId] = useState('');
  const [fmPrice, setFmPrice] = useState('');
  const [fmCurrencyId, setFmCurrencyId] = useState('');
  const [fmVolumeRatio, setFmVolumeRatio] = useState('5000');

  // Combined product form state - customs
  const [cmSupplierId, setCmSupplierId] = useState('');
  const [cmPrice, setCmPrice] = useState('');
  const [cmCurrencyId, setCmCurrencyId] = useState('');
  const [cmTaxRate, setCmTaxRate] = useState('0');

  // Combined product form state - last mile
  const [lmSupplierId, setLmSupplierId] = useState('');
  const [lmCurrencyId, setLmCurrencyId] = useState('');
  const [lmVolumeRatio, setLmVolumeRatio] = useState('5000');
  const [lmWeightRanges, setLmWeightRanges] = useState<WeightRange[]>([
    { id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 0 },
  ]);
  const [lmPricingMode, setLmPricingMode] = useState('weight_range');
  const [lmFirstWeight, setLmFirstWeight] = useState('0.5');
  const [lmContinuedWeight, setLmContinuedWeight] = useState('0.5');
  const [lmFirstWeightPrice, setLmFirstWeightPrice] = useState('');
  const [lmContinuedWeightPrice, setLmContinuedWeightPrice] = useState('');

  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadCountries();
    loadCurrencies();
  }, [loadProducts, loadSuppliers, loadCountries, loadCurrencies]);

  const resetForm = () => {
    setFormStep(1);
    setProductType('full_service');
    setName('');
    setSupplierId('');
    setCountry('');
    setVolumeRatio('5000');
    setStatus('active');
    setCargoType('');
    setWeightRanges([{ id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 0, handlingFee: 0 }]);
    setFmSupplierId('');
    setFmPrice('');
    setFmCurrencyId('');
    setFmVolumeRatio('5000');
    setCmSupplierId('');
    setCmPrice('');
    setCmCurrencyId('');
    setCmTaxRate('0');
    setLmSupplierId('');
    setLmCurrencyId('');
    setLmVolumeRatio('5000');
    setLmWeightRanges([{ id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 0, handlingFee: 0 }]);
    setPricingMode('weight_range');
    setFirstWeight('0.5');
    setContinuedWeight('0.5');
    setFirstWeightPrice('');
    setContinuedWeightPrice('');
    setLmPricingMode('weight_range');
    setLmFirstWeight('0.5');
    setLmContinuedWeight('0.5');
    setLmFirstWeightPrice('');
    setLmContinuedWeightPrice('');
    setFullCurrencyId('');
    setFullTaxRate('0');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    const pt = product.productType || 'full_service';
    setProductType(pt);
    setFormStep(2);
    setName(product.name);
    setCountry(product.country);
    setStatus(product.status);
    setCargoType(product.cargoType || '');

    if (pt === 'full_service') {
      setSupplierId(product.supplierId || '');
      setVolumeRatio(String(product.volumeRatio ?? 5000));
      setFullCurrencyId(product.currencyId || '');
      setFullTaxRate(String(product.taxRate ?? 0));
      setWeightRanges(
        product.weightRanges && product.weightRanges.length > 0
          ? [...product.weightRanges]
          : [{ id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 0, handlingFee: 0 }]
      );
      setPricingMode(product.pricingMode || 'weight_range');
      setFirstWeight(String(product.firstWeight ?? 0.5));
      setContinuedWeight(String(product.continuedWeight ?? 0.5));
      setFirstWeightPrice(product.firstWeightPrice != null ? String(product.firstWeightPrice) : '');
      setContinuedWeightPrice(product.continuedWeightPrice != null ? String(product.continuedWeightPrice) : '');
    } else {
      // combined
      if (product.firstMile) {
        setFmSupplierId(product.firstMile.supplierId);
        setFmPrice(String(product.firstMile.price));
        setFmCurrencyId(product.firstMile.currencyId);
        setFmVolumeRatio(String(product.firstMile.volumeRatio));
      }
      if (product.customs) {
        setCmSupplierId(product.customs.supplierId);
        setCmPrice(String(product.customs.price));
        setCmCurrencyId(product.customs.currencyId);
        setCmTaxRate(String(product.customs.taxRate ?? 0));
      }
      if (product.lastMile) {
        setLmSupplierId(product.lastMile.supplierId);
        setLmCurrencyId(product.lastMile.currencyId || '');
        setLmVolumeRatio(String(product.lastMile.volumeRatio));
        setLmWeightRanges(
          product.lastMile.weightRanges.length > 0
            ? [...product.lastMile.weightRanges]
            : [{ id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 0, handlingFee: 0 }]
        );
        setLmPricingMode(product.lastMile.pricingMode || 'weight_range');
        setLmFirstWeight(String(product.lastMile.firstWeight ?? 0.5));
        setLmContinuedWeight(String(product.lastMile.continuedWeight ?? 0.5));
        setLmFirstWeightPrice(product.lastMile.firstWeightPrice != null ? String(product.lastMile.firstWeightPrice) : '');
        setLmContinuedWeightPrice(product.lastMile.continuedWeightPrice != null ? String(product.lastMile.continuedWeightPrice) : '');
      }
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name || !country || !cargoType) return;

    if (productType === 'full_service') {
      if (!supplierId) return;
      const data = {
        name,
        productType: 'full_service' as ProductType,
        supplierId,
        country,
        cargoType: cargoType as CargoType,
        volumeRatio: parseFloat(volumeRatio) || 5000,
        currencyId: fullCurrencyId,
        taxRate: parseFloat(fullTaxRate) || 0,
        status,
        weightRanges,
        pricingMode: pricingMode as PricingMode,
        ...(pricingMode === 'first_weight' ? {
          firstWeight: parseFloat(firstWeight) || 0.5,
          continuedWeight: parseFloat(continuedWeight) || 0.5,
          firstWeightPrice: parseFloat(firstWeightPrice) || 0,
          continuedWeightPrice: parseFloat(continuedWeightPrice) || 0,
        } : {}),
      };
      if (editing) {
        update(editing.id, data);
      } else {
        add(data);
      }
    } else {
      // combined
      if (!fmSupplierId || !cmSupplierId || !lmSupplierId) return;
      const data = {
        name,
        productType: 'combined' as ProductType,
        country,
        cargoType: cargoType as CargoType,
        status,
        firstMile: {
          supplierId: fmSupplierId,
          price: parseFloat(fmPrice) || 0,
          currencyId: fmCurrencyId,
          volumeRatio: parseFloat(fmVolumeRatio) || 5000,
        },
        customs: {
          supplierId: cmSupplierId,
          price: parseFloat(cmPrice) || 0,
          currencyId: cmCurrencyId,
          taxRate: parseFloat(cmTaxRate) || 0,
        },
        lastMile: {
          supplierId: lmSupplierId,
          currencyId: lmCurrencyId,
          volumeRatio: parseFloat(lmVolumeRatio) || 5000,
          weightRanges: lmWeightRanges,
          pricingMode: lmPricingMode as PricingMode,
          ...(lmPricingMode === 'first_weight' ? {
            firstWeight: parseFloat(lmFirstWeight) || 0.5,
            continuedWeight: parseFloat(lmContinuedWeight) || 0.5,
            firstWeightPrice: parseFloat(lmFirstWeightPrice) || 0,
            continuedWeightPrice: parseFloat(lmContinuedWeightPrice) || 0,
          } : {}),
        },
      };
      if (editing) {
        update(editing.id, data);
      } else {
        add(data);
      }
    }

    setModalOpen(false);
    resetForm();
  };

  // Weight range helpers (full service)
  const addWeightRange = () => {
    const last = weightRanges[weightRanges.length - 1];
    setWeightRanges([
      ...weightRanges,
      { id: uuidv4(), minWeight: last?.maxWeight || 0, maxWeight: (last?.maxWeight || 0) + 10, unitPrice: 0, handlingFee: 0 },
    ]);
  };
  const removeWeightRange = (id: string) => {
    if (weightRanges.length <= 1) return;
    setWeightRanges(weightRanges.filter((r) => r.id !== id));
  };
  const updateWeightRange = (id: string, field: keyof WeightRange, value: number) => {
    setWeightRanges(weightRanges.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // Weight range helpers (last mile)
  const addLmWeightRange = () => {
    const last = lmWeightRanges[lmWeightRanges.length - 1];
    setLmWeightRanges([
      ...lmWeightRanges,
      { id: uuidv4(), minWeight: last?.maxWeight || 0, maxWeight: (last?.maxWeight || 0) + 10, unitPrice: 0, handlingFee: 0 },
    ]);
  };
  const removeLmWeightRange = (id: string) => {
    if (lmWeightRanges.length <= 1) return;
    setLmWeightRanges(lmWeightRanges.filter((r) => r.id !== id));
  };
  const updateLmWeightRange = (id: string, field: keyof WeightRange, value: number) => {
    setLmWeightRanges(lmWeightRanges.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const getProductType = (p: Product): ProductType => p.productType || 'full_service';

  const filtered = products.filter(
    (p) =>
      p.name.includes(search) ||
      p.country.includes(search) ||
      suppliers.find((s) => s.id === p.supplierId)?.name.includes(search)
  );

  const getSupplierDisplay = (p: Product) => {
    const pt = getProductType(p);
    if (pt === 'full_service') {
      return suppliers.find((s) => s.id === p.supplierId)?.name || '-';
    }
    const names: string[] = [];
    if (p.firstMile) {
      const s = suppliers.find((s) => s.id === p.firstMile!.supplierId);
      names.push(`头程: ${s?.name || '-'}`);
    }
    if (p.customs) {
      const s = suppliers.find((s) => s.id === p.customs!.supplierId);
      names.push(`清关: ${s?.name || '-'}`);
    }
    if (p.lastMile) {
      const s = suppliers.find((s) => s.id === p.lastMile!.supplierId);
      names.push(`尾程: ${s?.name || '-'}`);
    }
    return names.join(' / ');
  };

  const columns: Column<Product>[] = [
    { key: 'name', title: '产品名称' },
    {
      key: 'productType',
      title: '产品类型',
      render: (row) => {
        const pt = getProductType(row);
        return (
          <span
            style={{
              padding: '2px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: pt === 'full_service' ? '#dbeafe' : '#ede9fe',
              color: pt === 'full_service' ? '#1d4ed8' : '#7c3aed',
            }}
          >
            {pt === 'full_service' ? '全程' : '组合'}
          </span>
        );
      },
    },
    {
      key: 'cargoType',
      title: '货物类型',
      render: (row) => {
        if (!row.cargoType) return '-';
        const colorMap: Record<string, string> = {
          general: 'bg-slate-100 text-slate-600',
          electric: 'bg-amber-100 text-amber-700',
          sensitive: 'bg-orange-100 text-orange-700',
          f_cargo: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[row.cargoType] || ''}`}>
            {CARGO_TYPE_MAP[row.cargoType]}
          </span>
        );
      },
    },
    {
      key: 'supplierName',
      title: '供应商',
      render: (row) => (
        <span style={{ fontSize: '13px' }}>{getSupplierDisplay(row)}</span>
      ),
    },
    { key: 'country', title: '国家' },
    {
      key: 'status',
      title: '状态',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {row.status === 'active' ? '启用' : '停用'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (row) => (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>编辑</Button>
          <Button size="sm" variant="danger" onClick={() => {
            if (confirm('确定删除该产品？')) remove(row.id);
          }}>删除</Button>
        </div>
      ),
    },
  ];

  const canSave = () => {
    if (!name || !country || !cargoType) return false;
    if (productType === 'full_service') {
      if (!supplierId) return false;
      if (pricingMode === 'first_weight') return !!firstWeightPrice && !!continuedWeightPrice;
      return true;
    }
    if (!fmSupplierId || !cmSupplierId || !lmSupplierId) return false;
    if (lmPricingMode === 'first_weight') return !!lmFirstWeightPrice && !!lmContinuedWeightPrice;
    return true;
  };

  const activeSuppliersByType = (type: string) =>
    suppliers.filter((s) => s.status === 'active' && s.supplierTypes.includes(type as import('@/types').SupplierType));

  const activeCurrencies = currencies.filter((c) => c.status === 'active');

  // Render weight range editor
  const renderWeightRangeEditor = (
    ranges: WeightRange[],
    onAdd: () => void,
    onRemove: (id: string) => void,
    onUpdate: (id: string, field: keyof WeightRange, value: number) => void,
  ) => (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
        <label className="text-sm font-medium text-slate-700">重量段配置</label>
        <Button size="sm" variant="secondary" onClick={onAdd}>+ 添加重量段</Button>
      </div>
      <div className="space-y-3">
        {ranges.map((range, idx) => (
          <div key={range.id} className="flex items-center gap-3 bg-slate-50 rounded-lg" style={{ padding: '12px' }}>
            <span className="text-xs text-slate-400" style={{ width: '20px' }}>{idx + 1}.</span>
            <Input
              type="number"
              placeholder="下限"
              value={range.minWeight}
              onChange={(e) => onUpdate(range.id, 'minWeight', parseFloat(e.target.value) || 0)}
              className="flex-1"
            />
            <span className="text-slate-400 text-sm">~</span>
            <Input
              type="number"
              placeholder="上限"
              value={range.maxWeight}
              onChange={(e) => onUpdate(range.id, 'maxWeight', parseFloat(e.target.value) || 0)}
              className="flex-1"
            />
            <span className="text-slate-400 text-xs">kg</span>
            <Input
              type="number"
              placeholder="单价"
              value={range.unitPrice}
              onChange={(e) => onUpdate(range.id, 'unitPrice', parseFloat(e.target.value) || 0)}
              className="flex-1"
            />
            <span className="text-slate-400 text-xs">元/kg</span>
            <Input
              type="number"
              placeholder="处理费"
              value={range.handlingFee || 0}
              onChange={(e) => onUpdate(range.id, 'handlingFee', parseFloat(e.target.value) || 0)}
              className="flex-1"
            />
            <span className="text-slate-400 text-xs">元/件</span>
            <button
              onClick={() => onRemove(range.id)}
              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              disabled={ranges.length <= 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Render first-weight/continued-weight editor
  const renderFirstWeightEditor = (
    fw: string, setFw: (v: string) => void,
    cw: string, setCw: (v: string) => void,
    fwp: string, setFwp: (v: string) => void,
    cwp: string, setCwp: (v: string) => void,
  ) => (
    <div>
      <label className="text-sm font-medium text-slate-700" style={{ marginBottom: '12px', display: 'block' }}>首重续重配置</label>
      <div className="bg-slate-50 rounded-lg" style={{ padding: '16px' }}>
        <div className="form-grid grid-cols-2">
          <Select
            label="首重重量"
            options={WEIGHT_STEP_OPTIONS}
            value={fw}
            onChange={(e) => setFw(e.target.value)}
          />
          <Input label="首重价格(元)" type="number" value={fwp} onChange={(e) => setFwp(e.target.value)} placeholder="0.00" />
        </div>
        <div className="form-grid grid-cols-2" style={{ marginTop: '12px' }}>
          <Select
            label="续重重量"
            options={WEIGHT_STEP_OPTIONS}
            value={cw}
            onChange={(e) => setCw(e.target.value)}
          />
          <Input label="续重价格(元)" type="number" value={cwp} onChange={(e) => setCwp(e.target.value)} placeholder="0.00" />
        </div>
        <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '12px', color: '#3b82f6' }}>
          计算方式：若计费重 &le; 首重，运费 = 首重价格；若计费重 &gt; 首重，运费 = 首重价格 + &lceil;(计费重 - 首重) / 续重&rceil; &times; 续重价格
        </div>
      </div>
    </div>
  );

  // Render pricing mode selector + corresponding editor
  const renderPricingSection = (
    mode: string, setMode: (v: string) => void,
    ranges: WeightRange[], onAdd: () => void, onRemove: (id: string) => void, onUpdate: (id: string, field: keyof WeightRange, value: number) => void,
    fw: string, setFw: (v: string) => void,
    cw: string, setCw: (v: string) => void,
    fwp: string, setFwp: (v: string) => void,
    cwp: string, setCwp: (v: string) => void,
  ) => (
    <div>
      <div style={{ marginBottom: '14px' }}>
        <Select
          label="计费方式"
          options={PRICING_MODE_OPTIONS}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        />
      </div>
      {mode === 'weight_range'
        ? renderWeightRangeEditor(ranges, onAdd, onRemove, onUpdate)
        : renderFirstWeightEditor(fw, setFw, cw, setCw, fwp, setFwp, cwp, setCwp)
      }
    </div>
  );

  // Step 1: Product type selection
  const renderStep1 = () => (
    <div>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>请选择要创建的产品类型：</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Full Service Card */}
        <div
          onClick={() => { setProductType('full_service'); setFormStep(2); }}
          style={{
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.backgroundColor = '#eff6ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.backgroundColor = '';
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <svg style={{ width: '24px', height: '24px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>全程产品</div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>单一全程供应商，包含完整重量段定价</div>
        </div>

        {/* Combined Card */}
        <div
          onClick={() => { setProductType('combined'); setFormStep(2); }}
          style={{
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8b5cf6';
            e.currentTarget.style.backgroundColor = '#f5f3ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.backgroundColor = '';
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#ede9fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <svg style={{ width: '24px', height: '24px', color: '#7c3aed' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>组合产品</div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>头程 + 清关 + 尾程三段式组合定价</div>
        </div>
      </div>
    </div>
  );

  // Step 2 for full service
  const renderFullServiceForm = () => (
    <div className="form-fields">
      {editing && (
        <div style={{ marginBottom: '12px' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: '#dbeafe',
            color: '#1d4ed8',
          }}>
            全程产品
          </span>
        </div>
      )}
      <div className="form-grid grid-cols-2">
        <Input label="产品名称" value={name} onChange={(e) => setName(e.target.value)} placeholder="如：美国专线-标准" />
        <Select
          label="供应商（全程）"
          options={activeSuppliersByType('full_service').map((s) => ({ value: s.id, label: s.name }))}
          placeholder="选择全程供应商"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        />
      </div>
      <div className="form-grid grid-cols-3">
        <Select
          label="目的国家"
          options={countries.filter((c) => c.status === 'active').map((c) => ({ value: c.name, label: c.name }))}
          placeholder="选择目的国家"
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
        <Select
          label="状态"
          options={[{ value: 'active', label: '启用' }, { value: 'inactive', label: '停用' }]}
          value={status}
          onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
        />
      </div>
      <div className="form-grid grid-cols-2">
        <Input label="泡比系数" type="number" value={volumeRatio} onChange={(e) => setVolumeRatio(e.target.value)} />
        <Select
          label="币种"
          options={[
            { value: '', label: '人民币 (默认)' },
            ...activeCurrencies.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={fullCurrencyId}
          onChange={(e) => setFullCurrencyId(e.target.value)}
        />
      </div>
      <div className="form-grid grid-cols-2">
        <Input label="税率(%)" type="number" value={fullTaxRate} onChange={(e) => setFullTaxRate(e.target.value)} placeholder="0" />
        <div />
      </div>

      {renderPricingSection(
        pricingMode, setPricingMode,
        weightRanges, addWeightRange, removeWeightRange, updateWeightRange,
        firstWeight, setFirstWeight, continuedWeight, setContinuedWeight,
        firstWeightPrice, setFirstWeightPrice, continuedWeightPrice, setContinuedWeightPrice,
      )}

      <div className="form-actions">
        <Button variant="secondary" onClick={() => { if (!editing) { setFormStep(1); } else { setModalOpen(false); resetForm(); } }}>
          {editing ? '取消' : '上一步'}
        </Button>
        <Button onClick={handleSave} disabled={!canSave()}>保存</Button>
      </div>
    </div>
  );

  // Section block style
  const sectionStyle = {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '16px',
    backgroundColor: '#fafbfc',
  };

  const sectionTitleStyle = (color: string) => ({
    fontSize: '14px',
    fontWeight: 600 as const,
    color,
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });

  // Step 2 for combined
  const renderCombinedForm = () => (
    <div className="form-fields">
      {editing && (
        <div style={{ marginBottom: '12px' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: '#ede9fe',
            color: '#7c3aed',
          }}>
            组合产品
          </span>
        </div>
      )}

      {/* Base fields */}
      <div className="form-grid grid-cols-2">
        <Input label="产品名称" value={name} onChange={(e) => setName(e.target.value)} placeholder="如：美国组合专线" />
        <Select
          label="目的国家"
          options={countries.filter((c) => c.status === 'active').map((c) => ({ value: c.name, label: c.name }))}
          placeholder="选择目的国家"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
      </div>
      <div className="form-grid grid-cols-2">
        <Select
          label="货物类型"
          options={CARGO_TYPE_OPTIONS}
          placeholder="请选择货物类型"
          value={cargoType}
          onChange={(e) => setCargoType(e.target.value)}
        />
        <Select
          label="状态"
          options={[{ value: 'active', label: '启用' }, { value: 'inactive', label: '停用' }]}
          value={status}
          onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
        />
      </div>

      {/* First Mile Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle('#2563eb')}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: '#2563eb', display: 'inline-block',
          }} />
          头程配置
        </div>
        <div className="form-grid grid-cols-2">
          <Select
            label="头程供应商"
            options={activeSuppliersByType('first_mile').map((s) => ({ value: s.id, label: s.name }))}
            placeholder="选择头程供应商"
            value={fmSupplierId}
            onChange={(e) => setFmSupplierId(e.target.value)}
          />
          <Input label="泡比系数" type="number" value={fmVolumeRatio} onChange={(e) => setFmVolumeRatio(e.target.value)} />
        </div>
        <div className="form-grid grid-cols-2">
          <Input label="固定单价(元/kg)" type="number" value={fmPrice} onChange={(e) => setFmPrice(e.target.value)} placeholder="0.00" />
          <Select
            label="币种"
            options={[
              { value: '', label: '人民币 (默认)' },
              ...activeCurrencies.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={fmCurrencyId}
            onChange={(e) => setFmCurrencyId(e.target.value)}
          />
        </div>
      </div>

      {/* Customs Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle('#d97706')}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: '#d97706', display: 'inline-block',
          }} />
          清关配置
        </div>
        <div className="form-grid grid-cols-1">
          <Select
            label="清关供应商"
            options={activeSuppliersByType('customs').map((s) => ({ value: s.id, label: s.name }))}
            placeholder="选择清关供应商"
            value={cmSupplierId}
            onChange={(e) => setCmSupplierId(e.target.value)}
          />
        </div>
        <div className="form-grid grid-cols-2">
          <Input label="固定单价(元/kg)" type="number" value={cmPrice} onChange={(e) => setCmPrice(e.target.value)} placeholder="0.00" />
          <Select
            label="币种"
            options={[
              { value: '', label: '人民币 (默认)' },
              ...activeCurrencies.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={cmCurrencyId}
            onChange={(e) => setCmCurrencyId(e.target.value)}
          />
        </div>
        <div className="form-grid grid-cols-2">
          <Input label="税率(%)" type="number" value={cmTaxRate} onChange={(e) => setCmTaxRate(e.target.value)} placeholder="0" />
          <div />
        </div>
      </div>

      {/* Last Mile Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle('#059669')}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: '#059669', display: 'inline-block',
          }} />
          尾程配置
        </div>
        <div className="form-grid grid-cols-2">
          <Select
            label="尾程供应商"
            options={activeSuppliersByType('last_mile').map((s) => ({ value: s.id, label: s.name }))}
            placeholder="选择尾程供应商"
            value={lmSupplierId}
            onChange={(e) => setLmSupplierId(e.target.value)}
          />
          <Input label="泡比系数" type="number" value={lmVolumeRatio} onChange={(e) => setLmVolumeRatio(e.target.value)} />
        </div>
        <div className="form-grid grid-cols-2">
          <Select
            label="币种"
            options={[
              { value: '', label: '人民币 (默认)' },
              ...activeCurrencies.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={lmCurrencyId}
            onChange={(e) => setLmCurrencyId(e.target.value)}
          />
          <div />
        </div>
        {renderPricingSection(
          lmPricingMode, setLmPricingMode,
          lmWeightRanges, addLmWeightRange, removeLmWeightRange, updateLmWeightRange,
          lmFirstWeight, setLmFirstWeight, lmContinuedWeight, setLmContinuedWeight,
          lmFirstWeightPrice, setLmFirstWeightPrice, lmContinuedWeightPrice, setLmContinuedWeightPrice,
        )}
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={() => { if (!editing) { setFormStep(1); } else { setModalOpen(false); resetForm(); } }}>
          {editing ? '取消' : '上一步'}
        </Button>
        <Button onClick={handleSave} disabled={!canSave()}>保存</Button>
      </div>
    </div>
  );

  const modalTitle = () => {
    if (formStep === 1) return '新增产品 - 选择类型';
    if (editing) return '编辑产品';
    return productType === 'full_service' ? '新增全程产品' : '新增组合产品';
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">产品维护</h2>
          <p className="text-sm text-slate-500 page-title-desc">管理物流产品及其重量段配置</p>
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增产品
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Input
            placeholder="搜索产品名称、国家或供应商..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table columns={columns} data={filtered} rowKey={(row) => row.id} />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={modalTitle()}
        width={formStep === 2 && productType === 'combined' ? 'max-w-3xl' : 'max-w-2xl'}
      >
        {formStep === 1 && renderStep1()}
        {formStep === 2 && productType === 'full_service' && renderFullServiceForm()}
        {formStep === 2 && productType === 'combined' && renderCombinedForm()}
      </Modal>
    </div>
  );
}
