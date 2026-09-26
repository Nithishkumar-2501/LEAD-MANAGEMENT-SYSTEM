"use client";

import { useState } from 'react';
import {
  BookOpenIcon,
  CreditCardIcon,
  LogOutIcon,
  MessageCircleIcon,
  SettingsIcon,
  UserIcon as LucideUserIcon,
} from 'lucide-react';
import {
  ArrowRightIcon,
  CloseIcon,
  QuestionIcon,
  SidebarCollapseIcon,
  ToggleIcon,
  UserIcon,
} from './icons';
import { BionisLogo } from './logo';
import { DashboardLink, useDashboardNavigation } from './navigation';
import { useTheme } from './theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { currentUser, navigationGroups, type NavigationItem } from '../../data';
import { cn } from '@/lib/utils';

function NavItem({ item }: { item: NavigationItem }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { pathname } = useDashboardNavigation();
  const isActive =
    item.href === '/'
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={item.name}
    >
      <DashboardLink
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => {
          if (isMobile) setOpenMobile(false);
        }}
      >
        <item.icon className="size-5 shrink-0" />
        <span>{item.name}</span>
        {item.badge ? (
          <SidebarMenuBadge>
            {item.badge}
          </SidebarMenuBadge>
        ) : null}
      </DashboardLink>
    </SidebarMenuButton>
  );
}

export function DashboardSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Sidebar collapsible="icon" className="h-full border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
      <SidebarHeader className="h-16 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <BionisLogo className="size-6 text-sky-500" />
            <span className="font-bold text-slate-900 dark:text-white text-base">
              VSB Executive
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          aria-label="Toggle sidebar"
        >
          <SidebarCollapseIcon className="size-4" />
        </button>
      </SidebarHeader>

      <SidebarContent className="p-3">
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <NavItem item={item} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-200 dark:border-white/10 space-y-2">
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          <ToggleIcon pressed={isDark} />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
