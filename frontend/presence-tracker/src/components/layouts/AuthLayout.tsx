import { ReactNode } from "react";
import Header from "../Header";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
}

export const AuthLayout = ({ children, title }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={title} showSignOut={false} />
      <main className="flex-grow flex flex-col">{children}</main>
    </div>
  );
};
