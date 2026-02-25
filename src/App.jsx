import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';

function App() {
    return (
        <BrowserRouter>
            <DataProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />
                        </Route>

                    </Routes>
                </AuthProvider>
            </DataProvider>
        </BrowserRouter>
    );
}

export default App;
