/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { PosInvoiceView } from './components/PosInvoiceView';
import { InvoicesListView } from './components/InvoicesListView';
import { CustomersView } from './components/CustomersView';
import { InventoryView } from './components/InventoryView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { QuickCalculatorModal } from './components/QuickCalculatorModal';
import { SettingsModal } from './components/SettingsModal';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    selectedInvoiceForPrint,
    setSelectedInvoiceForPrint,
    showPrintModal,
    setShowPrintModal,
    showQuickCalc,
    setShowQuickCalc,
    showSettingsModal,
    setShowSettingsModal,
  } = useApp();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex font-['Cairo',sans-serif]" dir="rtl">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content View Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic View Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-28 lg:pb-12">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'pos' && <PosInvoiceView />}
          {activeTab === 'invoices' && <InvoicesListView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'reports' && <ReportsView />}
        </main>

        {/* Mobile Fixed Bottom Navigation */}
        <BottomNav />
      </div>

      {/* Global Modals */}
      <InvoicePrintModal
        invoice={selectedInvoiceForPrint}
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setSelectedInvoiceForPrint(null);
        }}
      />

      <QuickCalculatorModal
        isOpen={showQuickCalc}
        onClose={() => setShowQuickCalc(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
