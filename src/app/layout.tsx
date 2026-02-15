import "./globals.css";
import Providers from "./providers";
import ToastProvider from "@/components/ToastProvider";
import NotificationBell from "@/components/NotificationBell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ToastProvider>
            <div className="border-b">
              <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
                <div className="text-sm font-medium">CareHub</div>
                <NotificationBell />
              </div>
            </div>
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}