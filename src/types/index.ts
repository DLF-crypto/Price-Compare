export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
  status: 'active' | 'inactive';
  createdAt: string;
}

export type SupplierType = 'first_mile' | 'customs' | 'last_mile' | 'full_service';

export interface Supplier {
  id: string;
  name: string;
  supplierTypes: SupplierType[];
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Currency {
  id: string;
  name: string;
  rate: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface WeightRange {
  id: string;
  minWeight: number;
  maxWeight: number;
  unitPrice: number;
  handlingFee?: number;
}

export type CargoType = 'general' | 'electric' | 'sensitive' | 'f_cargo';

export const CARGO_TYPE_OPTIONS = [
  { value: 'general', label: '普货' },
  { value: 'electric', label: '带电' },
  { value: 'sensitive', label: '特敏' },
  { value: 'f_cargo', label: 'F货' },
];

export const CARGO_TYPE_MAP: Record<CargoType, string> = {
  general: '普货',
  electric: '带电',
  sensitive: '特敏',
  f_cargo: 'F货',
};

export type PricingMode = 'weight_range' | 'first_weight';

export const PRICING_MODE_OPTIONS = [
  { value: 'weight_range', label: '重量段计费' },
  { value: 'first_weight', label: '首重续重计费' },
];

export const WEIGHT_STEP_OPTIONS = [
  { value: '0.5', label: '0.5kg' },
  { value: '1', label: '1kg' },
];

export type ProductType = 'full_service' | 'combined';

export interface FirstMileConfig {
  supplierId: string;
  price: number;
  currencyId: string;
  volumeRatio: number;
}

export interface CustomsConfig {
  supplierId: string;
  price: number;
  currencyId: string;
  taxRate?: number;
}

export interface LastMileConfig {
  supplierId: string;
  currencyId?: string;
  volumeRatio: number;
  weightRanges: WeightRange[];
  pricingMode?: PricingMode;
  firstWeight?: number;
  continuedWeight?: number;
  firstWeightPrice?: number;
  continuedWeightPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  productType?: ProductType;
  // full_service fields
  supplierId?: string;
  currencyId?: string;
  taxRate?: number;
  volumeRatio?: number;
  weightRanges?: WeightRange[];
  // combined fields
  firstMile?: FirstMileConfig;
  customs?: CustomsConfig;
  lastMile?: LastMileConfig;
  // common fields
  cargoType?: CargoType;
  pricingMode?: PricingMode;
  firstWeight?: number;
  continuedWeight?: number;
  firstWeightPrice?: number;
  continuedWeightPrice?: number;
  country: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Country {
  id: string;
  name: string;
  code?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CompareQuery {
  country: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  packageCount: number;
}

export interface CompareResult {
  productType?: ProductType;
  supplierId: string;
  supplierName: string;
  productName: string;
  productId: string;
  volumeWeight: number;
  chargeableWeight: number;
  unitPrice: number;
  weightRange: string;
  pricingMode?: PricingMode;
  handlingFee: number;
  totalFreight: number;
  totalHandlingFee: number;
  totalCost: number;
  taxRate?: number;
  tax?: number;
  // combined product breakdown
  firstMileCost?: number;
  customsCost?: number;
  lastMileCost?: number;
}
