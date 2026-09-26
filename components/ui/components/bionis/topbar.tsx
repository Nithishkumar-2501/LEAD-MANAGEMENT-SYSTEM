"use client";

import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react';
import {
  BellIcon,
  SearchIcon,
} from './icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  currentUser,
  notifications,
} from '../../data';
import VoiceSearchBar from '@/components/VoiceSearchBar';
import { cn } from '@/lib/utils';

export function DashboardTopbar() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 px-4 md:px-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Admin Executive Portal</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block w-72">
          <VoiceSearchBar
            id="topbar-executive-search"
            placeholder="Search applicants, cutoffs..."
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative size-9 rounded-xl">
              <BellIcon className="size-4" />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-2">
            <p className="px-2 py-1 text-xs font-bold text-slate-500">Notifications</p>
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-2">
                <span className="font-semibold text-slate-900 dark:text-white">{n.title}</span>
                <span className="text-[11px] text-slate-500">{n.description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
          <img
            src={currentUser.avatar}
            alt=""
            className="size-8 rounded-full object-cover ring-2 ring-sky-500/20"
          />
          <div className="hidden lg:block text-left text-xs">
            <p className="font-bold text-slate-900 dark:text-white leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">{currentUser.planStatus}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
