import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function MainLayout() {
    const { currentUser, logout } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-brand-navy">
            <header className="fixed top-0 w-full bg-white border-b-2 border-brand-gold px-8 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <span className="text-gray-600 font-medium">Olá, {currentUser}</span>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-gray-500 hover:text-brand-navy font-medium transition-colors"
                >
                    <LogOut size={18} />
                    Sair
                </button>
            </header>

            <main className="pt-24 px-8 pb-12 max-w-7xl mx-auto">
                <Outlet />
            </main>
        </div>
    );
}
