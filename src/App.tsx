import { AppProvider } from "./context/AppContext";
import Arranque from "./features/booking/Arranque";

export default function App() {
  return (
    <AppProvider>
      <Arranque />
    </AppProvider>
  );
}
