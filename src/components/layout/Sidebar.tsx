import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface ChildItem {
  path: string;
  label: string;
  adminOnly?: boolean;
}

interface DirectNavItem {
  type: 'direct';
  label: string;
  icon: string;
  path: string;
}

interface GroupNavItem {
  type: 'group';
  label: string;
  icon: string;
  children: ChildItem[];
}

type NavItem = DirectNavItem | GroupNavItem;

const navConfig: NavItem[] = [
  {
    type: 'direct',
    label: '仪表盘',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    path: '/dashboard',
  },
  {
    type: 'group',
    label: '基础资料维护',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    children: [
      { path: '/suppliers', label: '供应商管理' },
      { path: '/products', label: '产品维护' },
      { path: '/employees', label: '员工管理', adminOnly: true },
      { path: '/countries', label: '国家基础资料维护' },
      { path: '/currencies', label: '货币维护' },
    ],
  },
  {
    type: 'group',
    label: '业务操作',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    children: [
      { path: '/compare', label: '比价' },
      { path: '/product-optimize', label: '产品优选' },
      { path: '/batch-calculate', label: '批量产品试算' },
    ],
  },
];

function getInitialExpandedGroups(pathname: string): Set<string> {
  const groups = new Set<string>();
  for (const item of navConfig) {
    if (item.type === 'group') {
      if (item.children.some((child) => pathname.startsWith(child.path))) {
        groups.add(item.label);
      }
    }
  }
  return groups;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => getInitialExpandedGroups(location.pathname)
  );

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const renderDirectItem = (item: DirectNavItem) => (
    <NavLink
      key={item.path}
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-sky-50 text-sky-700 font-semibold'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
        }`
      }
      style={{ fontSize: '14px', padding: '10px 12px' }}
    >
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
      </svg>
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );

  const renderGroupItem = (item: GroupNavItem) => {
    const isExpanded = expandedGroups.has(item.label);
    const visibleChildren = item.children.filter(
      (child) => !child.adminOnly || isAdmin()
    );
    const hasActiveChild = visibleChildren.some(
      (child) => location.pathname.startsWith(child.path)
    );

    return (
      <div key={item.label}>
        <button
          onClick={() => toggleGroup(item.label)}
          className={`w-full flex items-center gap-3 rounded-lg transition-all duration-200 ${
            hasActiveChild
              ? 'text-sky-700 font-semibold'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
          style={{ fontSize: '14px', padding: '10px 12px' }}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
          </svg>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <svg
                className={`w-4 h-4 shrink-0 chevron-icon ${isExpanded ? 'rotated' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
        {!collapsed && (
          <div className={`nav-group-children ${isExpanded ? 'expanded' : 'collapsed-group'}`}>
            <div style={{ paddingTop: '6px', paddingBottom: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {visibleChildren.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`
                  }
                  style={{ paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', fontSize: '14px' }}
                >
                  <span>{child.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-[260px]'
      }`}
    >
      <div className="p-3 border-b border-slate-100">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
        >
          <svg
            className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 p-3" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navConfig.map((item) =>
          item.type === 'direct' ? renderDirectItem(item) : renderGroupItem(item)
        )}
      </nav>
    </aside>
  );
}
