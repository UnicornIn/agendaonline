import { CatalogProvider } from "./context/CatalogContext";
import { BookingProvider } from "./context/BookingContext";
import AppRouter from "./router/AppRouter";

export default function App() {
  return (
    <CatalogProvider>
      <BookingProvider>
        <AppRouter />
      </BookingProvider>
    </CatalogProvider>
  );
}
