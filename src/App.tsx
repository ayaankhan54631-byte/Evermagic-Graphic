import React, { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { NewOrder } from './pages/NewOrder';
import { OrderDetails } from './pages/OrderDetails';
import { Customers } from './pages/Customers';
import { Inventory } from './pages/Inventory';
import { Toaster } from 'sonner';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<NewOrder />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="customers" element={<Customers />} />
            <Route path="inventory" element={<Inventory />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
