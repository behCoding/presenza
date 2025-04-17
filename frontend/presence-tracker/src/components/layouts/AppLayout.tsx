import { ReactNode } from "react";
import Header from "../Header";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

export const AppLayout = ({ children, title }: AppLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={title} showThemeToggle showSignOut />
      <main className="flex-grow flex flex-col">{children}</main>
    </div>
  );
};
