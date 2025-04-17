import AppProvider from "./context/AppProvider";
import { AppRouter } from "./routes/AppRouter";

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
};

export default App;
