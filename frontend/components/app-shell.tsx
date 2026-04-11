'use client'

import { usePathname } from 'next/navigation'
import { BottomTabBar } from './bottom-tab-bar'

interface AppShellProps {
  children: React.ReactNode
  showTabBar?: boolean
  hasBottomButton?: boolean
}

export function AppShell({ children, showTabBar = true, hasBottomButton = false }: AppShellProps) {
  const pathname = usePathname()
  
  // Pages that should show the tab bar
  const tabBarPages = ['/home', '/departments/search', '/me/activity']
  const shouldShowTabBar = showTabBar && tabBarPages.some(p => pathname.startsWith(p))
  
  return (
    <div className="mobile-canvas relative min-h-screen bg-background">
      <div 
        className={`${shouldShowTabBar ? 'pb-20' : ''} ${hasBottomButton ? 'pb-24' : ''}`}
      >
        {children}
      </div>
      {shouldShowTabBar && <BottomTabBar />}
    </div>
  )
}
