import { useEffect, useMemo, type ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { useProductStore } from '@/store/products';
import { useSupplierStore } from '@/store/suppliers';
import { useCountryStore } from '@/store/countries';
import { useCurrencyStore } from '@/store/currencies';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// ---------- StatCard ----------
interface StatCardProps {
  title: string;
  total: number;
  active: number;
  inactive: number;
  color: string;
  bgColor: string;
  icon: ReactNode;
}

function StatCard({ title, total, active, inactive, color, bgColor, icon }: StatCardProps) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-slate-100"
      style={{ padding: '24px' }}
    >
      <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-500">{title}</span>
      </div>
      <div className="text-3xl font-bold text-slate-800" style={{ marginBottom: '12px' }}>
        {total}
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
          启用 {active}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
          停用 {inactive}
        </span>
      </div>
    </div>
  );
}

// ---------- Icons ----------
const ProductIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const SupplierIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const CountryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const CurrencyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ---------- Colors ----------
const PIE_COLORS = ['#3b82f6', '#8b5cf6'];
const BAR_COLOR = '#3b82f6';

// ---------- Custom label for PieChart ----------
const renderPieLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, name, value,
}: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; name: string; value: number;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#475569" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={13}>
      {name} ({value})
    </text>
  );
};

// ---------- Main Component ----------
export default function DashboardPage() {
  const { products, load: loadProducts } = useProductStore();
  const { suppliers, load: loadSuppliers } = useSupplierStore();
  const { countries, load: loadCountries } = useCountryStore();
  const { currencies, load: loadCurrencies } = useCurrencyStore();

  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadCountries();
    loadCurrencies();
  }, [loadProducts, loadSuppliers, loadCountries, loadCurrencies]);

  // Summary stats
  const stats = useMemo(() => ({
    products: {
      total: products.length,
      active: products.filter((p) => p.status === 'active').length,
      inactive: products.filter((p) => p.status === 'inactive').length,
    },
    suppliers: {
      total: suppliers.length,
      active: suppliers.filter((s) => s.status === 'active').length,
      inactive: suppliers.filter((s) => s.status === 'inactive').length,
    },
    countries: {
      total: countries.length,
      active: countries.filter((c) => c.status === 'active').length,
      inactive: countries.filter((c) => c.status === 'inactive').length,
    },
    currencies: {
      total: currencies.length,
      active: currencies.filter((c) => c.status === 'active').length,
      inactive: currencies.filter((c) => c.status === 'inactive').length,
    },
  }), [products, suppliers, countries, currencies]);

  // Products by country
  const productsByCountry = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      map.set(p.country, (map.get(p.country) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  // Products by type
  const productsByType = useMemo(() => {
    const fullService = products.filter((p) => (p.productType || 'full_service') === 'full_service').length;
    const combined = products.filter((p) => p.productType === 'combined').length;
    return [
      { name: '全程产品', value: fullService },
      { name: '组合产品', value: combined },
    ];
  }, [products]);

  return (
    <div className="page-container">
      <div>
        <h2 className="text-xl font-bold text-slate-800">仪表盘</h2>
        <p className="text-sm text-slate-500 page-title-desc">数据概览</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="产品总数"
          total={stats.products.total}
          active={stats.products.active}
          inactive={stats.products.inactive}
          color="#3b82f6"
          bgColor="#eff6ff"
          icon={<ProductIcon />}
        />
        <StatCard
          title="供应商数量"
          total={stats.suppliers.total}
          active={stats.suppliers.active}
          inactive={stats.suppliers.inactive}
          color="#22c55e"
          bgColor="#f0fdf4"
          icon={<SupplierIcon />}
        />
        <StatCard
          title="国家数量"
          total={stats.countries.total}
          active={stats.countries.active}
          inactive={stats.countries.inactive}
          color="#f97316"
          bgColor="#fff7ed"
          icon={<CountryIcon />}
        />
        <StatCard
          title="货币数量"
          total={stats.currencies.total}
          active={stats.currencies.active}
          inactive={stats.currencies.inactive}
          color="#8b5cf6"
          bgColor="#f5f3ff"
          icon={<CurrencyIcon />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart - Products by Country */}
        <Card title="产品分布 - 按国家">
          {productsByCountry.length === 0 ? (
            <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height: '300px' }}>
              暂无产品数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productsByCountry} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="country" tick={{ fontSize: 13, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  formatter={(value: number) => [`${value} 个`, '产品数']}
                />
                <Bar dataKey="count" fill={BAR_COLOR} radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Pie Chart - Products by Type */}
        <Card title="产品分布 - 按类型">
          {products.length === 0 ? (
            <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height: '300px' }}>
              暂无产品数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productsByType}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={renderPieLabel}
                >
                  {productsByType.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  formatter={(value: number) => [`${value} 个`, '产品数']}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value: string) => <span style={{ color: '#475569', fontSize: '13px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
