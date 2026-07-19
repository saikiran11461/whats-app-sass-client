import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

/**
 * Network status hook - detects online/offline state
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * OfflineDetector - shows a banner when the user goes offline
 * and reconnects automatically when back online
 */
export function OfflineDetector() {
  const isOnline = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    } else if (showBanner) {
      // Auto-hide after 3 seconds when coming back online
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium shadow-lg ${
            isOnline
              ? "bg-primary text-primary-foreground"
              : "bg-destructive text-destructive-foreground"
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>Connection restored</span>
              <RefreshCw className="h-3 w-3 animate-spin" />
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>You are offline. Some features may be unavailable.</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ConnectionStatusBadge - for placing in headers or sidebars
 */
export function ConnectionStatusBadge({ isConnected }: { isConnected: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        isConnected
          ? "bg-primary/10 text-primary"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isConnected ? "bg-primary animate-pulse" : "bg-destructive"
        }`}
      />
      {isConnected ? "Connected" : "Disconnected"}
    </div>
  );
}
