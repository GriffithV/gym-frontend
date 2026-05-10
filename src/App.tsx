import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Shell } from "./components/layout/Shell";
import { Toaster } from "./components/ui/Toast";

import LoginPage from "./app/auth/Login";
import PasswordResetPage from "./app/auth/PasswordReset";
import DashboardPage from "./app/dashboard/Dashboard";
import CustomersListPage from "./app/customers/CustomersList";
import CustomerDetailPage from "./app/customers/CustomerDetail";
import HealthReportsPage from "./app/health-reports/HealthReports";
import SubscriptionsPage from "./app/subscriptions/Subscriptions";
import ChargeProfilesPage from "./app/charge-profiles/ChargeProfiles";
import MachinesPage from "./app/machines/Machines";
import MachineDetailPage from "./app/machines/MachineDetail";
import OperationsPage from "./app/operations/Operations";
import StatisticsPage from "./app/statistics/Statistics";
import StaffPage from "./app/staff/Staff";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />

          <Route element={<Shell />}>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<CustomersListPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="health-reports" element={<HealthReportsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="charge-profiles" element={<ChargeProfilesPage />} />
            <Route path="machines" element={<MachinesPage />} />
            <Route path="machines/:id" element={<MachineDetailPage />} />
            <Route path="operations" element={<OperationsPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
