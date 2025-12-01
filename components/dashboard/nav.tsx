"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Phone,
  Settings,
  LogOut,
  Shield,
  Bot,
} from "lucide-react";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Übersicht", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meine Agents", href: "/dashboard/agents", icon: Bot },
  { name: "Anrufe", href: "/dashboard/calls", icon: Phone },
  { name: "Einstellungen", href: "/dashboard/subscription", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/admin/check");
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin === true);
        }
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          V
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">Voicall</span>
          <span className="text-xs text-muted-foreground">AI Voice Agent</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col gap-1 px-2 flex-1">
        {/* Admin Link - only visible to admins, placed at top */}
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/dashboard/admin"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}

        {/* Regular Navigation */}
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* User Menu - Sticky at bottom */}
      <div className="sticky bottom-0 px-2 py-4 border-t bg-card">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2 h-auto hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {session?.user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left overflow-hidden">
                <span className="text-sm font-medium truncate max-w-[140px]">
                  {session?.user?.name || "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {session?.user?.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuLabel>Mein Konto</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
