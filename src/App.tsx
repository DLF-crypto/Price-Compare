import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import ComparePage from '@/pages/Compare';
import ProductsPage from '@/pages/Products';
import SuppliersPage from '@/pages/Suppliers';
import EmployeesPage from '@/pages/Employees';
import CountriesPage from '@/pages/Countries';
import CurrenciesPage from '@/pages/Currencies';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="countries" element={<CountriesPage />} />
          <Route path="currencies" element={<CurrenciesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
