import AuthProvider from "./AuthProvider";
import ThemeProvider from "./ThemeProvider";
import UserProvider from "./UserProvider";

interface AppProviderProps {
  children: React.ReactNode;
}

const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <UserProvider>{children}</UserProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default AppProvider;
