import { v4 as uuidv4 } from 'uuid';
import type { User, Supplier, Product, Country, Currency } from '@/types';

const SEED_KEY = 'price-compare-seeded';

export function seedData() {
  if (localStorage.getItem(SEED_KEY)) return;

  const suppliers: Supplier[] = [
    {
      id: uuidv4(),
      name: '顺丰国际',
      supplierTypes: ['first_mile'],
      contactPerson: '张三',
      phone: '13800138001',
      email: 'zhangsan@sf.com',
      address: '深圳市南山区科技园',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '中通国际',
      supplierTypes: ['customs'],
      contactPerson: '李四',
      phone: '13800138002',
      email: 'lisi@zto.com',
      address: '上海市青浦区华新镇',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '圆通速递',
      supplierTypes: ['last_mile'],
      contactPerson: '王五',
      phone: '13800138003',
      email: 'wangwu@yto.com',
      address: '上海市青浦区华新镇',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '锅盔全程物流',
      supplierTypes: ['full_service'],
      contactPerson: '赵六',
      phone: '13800138004',
      email: 'zhaoliu@guokui.com',
      address: '广州市白云区物流园',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  const products: Product[] = [
    {
      id: uuidv4(),
      name: '美国专线-标准',
      productType: 'full_service',
      supplierId: suppliers[3].id,
      country: '美国',
      cargoType: 'general',
      volumeRatio: 5000,
      currencyId: '',
      taxRate: 0,
      weightRanges: [
        { id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 45, handlingFee: 15 },
        { id: uuidv4(), minWeight: 5, maxWeight: 10, unitPrice: 40, handlingFee: 15 },
        { id: uuidv4(), minWeight: 10, maxWeight: 30, unitPrice: 35, handlingFee: 15 },
        { id: uuidv4(), minWeight: 30, maxWeight: 9999, unitPrice: 30, handlingFee: 15 },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '美国专线-经济',
      productType: 'full_service',
      supplierId: suppliers[3].id,
      country: '美国',
      cargoType: 'general',
      volumeRatio: 6000,
      currencyId: '',
      taxRate: 0,
      weightRanges: [
        { id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 38, handlingFee: 10 },
        { id: uuidv4(), minWeight: 5, maxWeight: 10, unitPrice: 34, handlingFee: 10 },
        { id: uuidv4(), minWeight: 10, maxWeight: 30, unitPrice: 30, handlingFee: 10 },
        { id: uuidv4(), minWeight: 30, maxWeight: 9999, unitPrice: 26, handlingFee: 10 },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '美国专线-快速',
      productType: 'full_service',
      supplierId: suppliers[3].id,
      country: '美国',
      cargoType: 'electric',
      volumeRatio: 5000,
      currencyId: '',
      taxRate: 0,
      weightRanges: [
        { id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 55, handlingFee: 20 },
        { id: uuidv4(), minWeight: 5, maxWeight: 10, unitPrice: 48, handlingFee: 20 },
        { id: uuidv4(), minWeight: 10, maxWeight: 30, unitPrice: 42, handlingFee: 20 },
        { id: uuidv4(), minWeight: 30, maxWeight: 9999, unitPrice: 38, handlingFee: 20 },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '英国专线-标准',
      productType: 'full_service',
      supplierId: suppliers[3].id,
      country: '英国',
      cargoType: 'general',
      volumeRatio: 5000,
      currencyId: '',
      taxRate: 0,
      weightRanges: [
        { id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 50, handlingFee: 12 },
        { id: uuidv4(), minWeight: 5, maxWeight: 10, unitPrice: 45, handlingFee: 12 },
        { id: uuidv4(), minWeight: 10, maxWeight: 30, unitPrice: 40, handlingFee: 12 },
        { id: uuidv4(), minWeight: 30, maxWeight: 9999, unitPrice: 35, handlingFee: 12 },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '英国专线-经济',
      productType: 'full_service',
      supplierId: suppliers[3].id,
      country: '英国',
      cargoType: 'sensitive',
      volumeRatio: 6000,
      currencyId: '',
      taxRate: 0,
      weightRanges: [
        { id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 42, handlingFee: 8 },
        { id: uuidv4(), minWeight: 5, maxWeight: 10, unitPrice: 38, handlingFee: 8 },
        { id: uuidv4(), minWeight: 10, maxWeight: 30, unitPrice: 33, handlingFee: 8 },
        { id: uuidv4(), minWeight: 30, maxWeight: 9999, unitPrice: 28, handlingFee: 8 },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '德国专线-标准',
      productType: 'full_service',
      supplierId: suppliers[3].id,
      country: '德国',
      cargoType: 'general',
      volumeRatio: 5000,
      currencyId: '',
      taxRate: 0,
      weightRanges: [
        { id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 52, handlingFee: 15 },
        { id: uuidv4(), minWeight: 5, maxWeight: 10, unitPrice: 46, handlingFee: 15 },
        { id: uuidv4(), minWeight: 10, maxWeight: 30, unitPrice: 40, handlingFee: 15 },
        { id: uuidv4(), minWeight: 30, maxWeight: 9999, unitPrice: 36, handlingFee: 15 },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '美国专线-首重续重',
      productType: 'full_service',
      supplierId: suppliers[3].id,
      country: '美国',
      cargoType: 'general',
      pricingMode: 'first_weight',
      volumeRatio: 5000,
      currencyId: '',
      taxRate: 0,
      firstWeight: 0.5,
      continuedWeight: 0.5,
      firstWeightPrice: 25,
      continuedWeightPrice: 12,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '美国组合专线',
      productType: 'combined',
      country: '美国',
      cargoType: 'f_cargo',
      firstMile: {
        supplierId: suppliers[0].id,
        price: 3.5,
        currencyId: '',
        volumeRatio: 5000,
      },
      customs: {
        supplierId: suppliers[1].id,
        price: 1.2,
        currencyId: '',
        taxRate: 0,
        },
      lastMile: {
        supplierId: suppliers[2].id,
        currencyId: '',
        volumeRatio: 5000,
        weightRanges: [
          { id: uuidv4(), minWeight: 0, maxWeight: 5, unitPrice: 8, handlingFee: 10 },
          { id: uuidv4(), minWeight: 5, maxWeight: 10, unitPrice: 7, handlingFee: 10 },
          { id: uuidv4(), minWeight: 10, maxWeight: 30, unitPrice: 6, handlingFee: 10 },
          { id: uuidv4(), minWeight: 30, maxWeight: 9999, unitPrice: 5, handlingFee: 10 },
        ],
      },
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  const users: User[] = [
    {
      id: uuidv4(),
      name: '管理员',
      email: 'admin@guokui.com',
      password: 'admin123',
      role: 'ADMIN',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '普通用户',
      email: 'user@guokui.com',
      password: 'user123',
      role: 'USER',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  const countries: Country[] = [
    { id: uuidv4(), name: '美国', code: 'US', status: 'active', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '英国', code: 'GB', status: 'active', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '德国', code: 'DE', status: 'active', createdAt: new Date().toISOString() },
  ];

  const currencies: Currency[] = [
    { id: uuidv4(), name: '美元 (USD)', rate: 724.50, status: 'active', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '英镑 (GBP)', rate: 915.30, status: 'active', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '欧元 (EUR)', rate: 788.60, status: 'active', createdAt: new Date().toISOString() },
  ];

  localStorage.setItem('suppliers', JSON.stringify(suppliers));
  localStorage.setItem('products', JSON.stringify(products));
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('countries', JSON.stringify(countries));
  localStorage.setItem('currencies', JSON.stringify(currencies));
  localStorage.setItem(SEED_KEY, 'true');
}
