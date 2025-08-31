import React from 'react';
import ReactDOM from 'react-dom/client';
import './main.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import { ROLES } from './hooks/usePermissions';
import SalesPage from './pages/SalesPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import CatalogPage from './pages/Catalog';
import CargarProductos from './pages/CargarProductos';
import UserManagementPage from './pages/UserManagementPage';
import LogsPage from './pages/LogsPage';
import BarcodeGeneratorPage from './pages/BarcodeGeneratorPage';
import ExportsPage from './pages/ExportsPage';
import ConfigurationPage from './pages/ConfigurationPage';
// ...existing code...

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          
          {/* Rutas solo para Admin y Gerente */}
          <Route path="catalog" element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <CatalogPage />
            </RoleProtectedRoute>
          } />
          <Route path="cargar-productos" element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <CargarProductos />
            </RoleProtectedRoute>
          } />
          
          {/* Rutas para todos los roles autenticados */}
          <Route path="inventario" element={<InventoryPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="sales-history" element={<SalesHistoryPage />} />
          
          {/* Rutas solo para Admin y Gerente */}
          <Route path="reports" element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Reportes</h1>
                <p className="text-gray-600">Módulo en desarrollo</p>
              </div>
            </RoleProtectedRoute>
          } />
          
          {/* Ruta solo para Admin */}
          <Route path="users" element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <UserManagementPage />
            </RoleProtectedRoute>
          } />
          <Route path="logs" element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <LogsPage />
            </RoleProtectedRoute>
          } />
          <Route path="barcode-generator" element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <BarcodeGeneratorPage />
            </RoleProtectedRoute>
          } />
          <Route path="exports" element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <ExportsPage />
            </RoleProtectedRoute>
          } />
          <Route path="settings" element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <ConfigurationPage />
            </RoleProtectedRoute>
          } />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
