import { Toaster } from "sonner";
import { Providers } from "./Providers";
import { AppRouter } from "./Router";

export default function App() {
  return (
    <Providers>
      <AppRouter />
      <Toaster position="top-right" richColors closeButton />
    </Providers>
  );
}
