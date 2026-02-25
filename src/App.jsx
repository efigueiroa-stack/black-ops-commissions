import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import SalesStatement from './pages/SalesStatement';
import OppsStatement from './pages/OppsStatement';
import ContestedItems from './pages/ContestedItems';
import MainLayout from './layouts/MainLayout';

function App() {
    return (
        <BrowserRouter>
            <DataProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<Navigate to="/sales" replace />} />
                            <Route path="sales" element={<SalesStatement />} />
                            <Route path="opps" element={<OppsStatement />} />
                            <Route path="contested" element={<ContestedItems />} />
                        </Route>

                    </Routes>
                </AuthProvider>
            </DataProvider>
        </BrowserRouter>
    );
}

export default App;
