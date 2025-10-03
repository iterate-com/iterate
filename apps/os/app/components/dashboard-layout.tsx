import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  Home as HomeIcon,
  Settings,
  Users,
  FileText,
  LogOut,
  Building2,
  Check,
  ChevronsUpDown,
  MessageSquarePlus,
  Sun,
  Moon,
  Monitor,
  Shield,
  CreditCard,
} from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { authClient } from "../lib/auth-client.ts";
import { useTRPC } from "../lib/trpc.ts";
import { setSelectedEstate } from "../lib/estate-cookie.ts";
import { useOrganizationId } from "../hooks/use-estate.ts";
import { useOrganizationWebSocket } from "../hooks/use-websocket.ts";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "../components/ui/sidebar.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu.tsx";
import { useImpersonation } from "./impersonate.tsx";

const navigation = [
  {
    title: "Platform",
    items: [
      { title: "Home", icon: HomeIcon, path: "" },
      { title: "Integrations", icon: Settings, path: "integrations" },
      { title: "Manage estate", icon: FileText, path: "estate" },
    ],
  },
  {
    title: "Agents",
    items: [
      { title: "Manage agents", icon: Users, path: "agents" },
      { title: "Start Slack Agent", icon: MessageSquarePlus, path: "agents/start-slack" },
    ],
  },
];

interface Estate {
  id: string;
  name: string;
  organizationName: string;
  organizationId: string;
}

interface OrganizationItem {
  id: string;
  name: string;
}

function UserSwitcher() {
  const trpc = useTRPC();
  const { data: user } = useSuspenseQuery(trpc.user.me.queryOptions());
  const { data: estates } = useSuspenseQuery(trpc.estates.list.queryOptions());
  const navigate = useNavigate();
  const params = useParams();
  const currentEstateId = params.estateId;

  const impersonation = useImpersonation();

  const currentEstate = estates?.find((e: Estate) => e.id === currentEstateId) || null;

  const handleLogout = async () => {
    try {
      console.log("🚪 Logging out...");
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Redirect to login page after successful logout
            window.location.href = "/login";
          },
        },
      });

      console.log("✅ Logout successful!");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  const handleEstateSwitch = (estate: Estate) => {
    // Save the new selection to cookie
    setSelectedEstate(estate.organizationId, estate.id);

    // Get the current path within the estate
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split("/").slice(3); // Remove org/estate parts
    const subPath = pathParts.join("/");

    // Navigate to the same page in the new estate
    navigate(`/${estate.organizationId}/${estate.id}${subPath ? `/${subPath}` : ""}`);
  };

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.image || ""} alt={user.name} />
                <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" side="top" align="start">
            {currentEstate && (
              <>
                <DropdownMenuLabel>Switch Estate</DropdownMenuLabel>
                {estates?.map((estate: Estate) => (
                  <DropdownMenuItem
                    key={estate.id}
                    onClick={() => handleEstateSwitch(estate)}
                    className="flex items-center justify-between"
                    disabled={currentEstateId === estate.id}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4" />
                      <span>{estate.name}</span>
                    </div>
                    {currentEstateId === estate.id && <Check className="size-4" />}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {impersonation.isAdmin && (
              <DropdownMenuItem onClick={() => impersonation.impersonate.mutate()}>
                Impersonate another user
              </DropdownMenuItem>
            )}
            {impersonation.impersonatedBy && (
              <DropdownMenuItem onClick={() => impersonation.unimpersonate.mutate()}>
                Stop impersonating
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <currentTheme.icon className="size-4" />
              <span className="truncate">Theme</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" side="top" align="start">
            <DropdownMenuLabel>Choose theme</DropdownMenuLabel>
            {themes.map((themeOption) => (
              <DropdownMenuItem
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <themeOption.icon className="size-4" />
                  <span>{themeOption.label}</span>
                </div>
                {theme === themeOption.value && <Check className="size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const params = useParams();
  const organizationId = useOrganizationId();
  const estateId = params.estateId || null;
  const ws = useOrganizationWebSocket(organizationId, estateId ?? "");
  const trpc = useTRPC();
  const { data: impersonationInfo } = useSuspenseQuery(trpc.admin.impersonationInfo.queryOptions());
  const { data: estates } = useSuspenseQuery(trpc.estates.list.queryOptions());

  const organizations: OrganizationItem[] = Array.from(
    new Map(
      (estates || []).map((e: Estate) => [e.organizationId, { id: e.organizationId, name: e.organizationName }]),
    ).values(),
  );

  const currentOrganization = organizations.find((o) => o.id === organizationId) || null;

  const currentOrgEstates: Estate[] = (estates || []).filter(
    (e: Estate) => e.organizationId === organizationId,
  );

  const getEstateUrl = (path: string) => {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    if (estateId) {
      return `/${organizationId}/${estateId}${cleanPath ? `/${cleanPath}` : ""}`;
    }
    return `/${organizationId}`;
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarContent>
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" asChild>
                    <Link to={`/${organizationId}`}>
                      <div className="bg-black flex aspect-square size-8 items-center justify-center rounded-lg">
                        <img src="/logo.svg" alt="𝑖" className="size-6 text-white" />
                      </div>
                      <div className="grid flex-1 text-left leading-tight">
                        <span className="truncate font-medium">
                          {currentOrganization ? currentOrganization.name : "Organization"}
                        </span>
                        <span className="truncate text-xs">Switch via estates below</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            {/* Organization-level navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Organization</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.endsWith(`/settings`)}>
                      <Link to={`/${organizationId}/settings`}>
                        <Settings className="size-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.endsWith(`/members`)}>
                      <Link to={`/${organizationId}/members`}>
                        <Users className="size-4" />
                        <span>Members</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.endsWith(`/billing`)}>
                      <Link to={`/${organizationId}/billing`}>
                        <CreditCard className="size-4" />
                        <span>Billing</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Estates list within the selected organization */}
            {currentOrgEstates.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Estates</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {currentOrgEstates.map((estate) => (
                      <SidebarMenuItem key={estate.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname.startsWith(`/${organizationId}/${estate.id}`)}
                        >
                          <Link to={`/${organizationId}/${estate.id}/`}>
                            <Building2 className="size-4" />
                            <span>{estate.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Estate-specific navigation (only when an estate is selected) */}
            {estateId &&
              navigation.map((section) => (
                <SidebarGroup key={section.title}>
                  <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={
                              (item.path && location.pathname.endsWith(item.path)) ||
                              (item.path === "" && location.pathname.endsWith(`/${estateId}/`))
                            }
                          >
                            <Link to={getEstateUrl(item.path)}>
                              <item.icon className="size-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}

            {impersonationInfo?.isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location.pathname.startsWith("/admin")}>
                        <Link to="/admin">
                          <Shield className="size-4" />
                          <span>Admin Tools</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter>
            {!ws.isConnected && (
              <div className="flex items-center gap-2 mb-3 px-3">
                <div className={`size-2 rounded-full bg-orange-500`}></div>
                <span className="text-sm text-muted-foreground">Websocket connecting...</span>
              </div>
            )}
            <ThemeSwitcher />
            <UserSwitcher />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 items-center gap-4 border-b px-6">
            <SidebarTrigger />
            {/* TODO Breadcrumbs */}
          </header>

          <main>{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
