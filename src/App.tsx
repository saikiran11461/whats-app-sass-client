import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { SocketProvider } from "@/hooks/useSocket";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineDetector } from "./components/OfflineDetector";
import { DashboardLayout } from "./components/DashboardLayout";
import Login from "./pages/Login";
import DashboardStats from "./pages/DashboardStats";
import Brands from "./pages/Brands";
import SendMessage from "./pages/SendMessage";
import BulkMessaging from "./pages/BulkMessaging";
import ContactsManagement from "./pages/ContactsManagement";
import Groups from "./pages/Groups";
import MessageLogs from "./pages/MessageLogs";
import Templates from "./pages/Templates";
import ChatInbox from "./pages/ChatInbox";
import AutoReply from "./pages/AutoReply";
import Scheduler from "./pages/Scheduler";
import ExportReports from "./pages/ExportReports";
import SettingsPage from "./pages/Settings";
import ChatbotBuilder from "./pages/ChatbotBuilder";
import TeamAgents from "./pages/TeamAgents";
import Catalog from "./pages/Catalog";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import QuickReplies from "./pages/QuickReplies";
import QRWidget from "./pages/QRWidget";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineDetector />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<DashboardStats />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/send" element={<SendMessage />} />
                  <Route path="/campaigns" element={<BulkMessaging />} />
                  <Route path="/contacts" element={<ContactsManagement />} />
                  <Route path="/groups" element={<Groups />} />
                  <Route path="/logs" element={<MessageLogs />} />
                  <Route path="/templates" element={<ErrorBoundary><Templates /></ErrorBoundary>} />
                  <Route path="/inbox" element={<ErrorBoundary><ChatInbox /></ErrorBoundary>} />
                  <Route path="/auto-reply" element={<AutoReply />} />
                  <Route path="/scheduler" element={<Scheduler />} />
                  <Route path="/reports" element={<ExportReports />} />
                  <Route path="/chatbot" element={<ChatbotBuilder />} />
                  <Route path="/team" element={<TeamAgents />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/integrations" element={<Integrations />} />
                  <Route path="/quick-replies" element={<QuickReplies />} />
                  <Route path="/qr-widget" element={<QRWidget />} />
                  <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
