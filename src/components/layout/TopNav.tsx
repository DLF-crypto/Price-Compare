import { useAuthStore } from '@/store/auth';

export function TopNav() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-30" style={{ padding: '0 24px 0 24px' }}>
      <div className="flex items-center gap-3">
        <img src="/guokui_logo.svg" alt="锅盔" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain' }} />
        <h1 className="text-base font-bold text-slate-800 tracking-tight">
          锅盔专线比价系统
        </h1>
      </div>

      <div className="flex items-center" style={{ gap: '16px', marginRight: '12px' }}>
        <div className="flex items-center" style={{ gap: '10px' }}>
          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
            <span className="font-semibold text-sky-700" style={{ fontSize: '13px' }}>
              {user?.name.charAt(0)}
            </span>
          </div>
          <div style={{ fontSize: '14px' }}>
            <span className="text-slate-700 font-medium">{user?.name}</span>
            <span className="text-slate-400" style={{ marginLeft: '8px', fontSize: '13px' }}>
              {user?.role === 'ADMIN' ? '管理员' : '普通用户'}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-slate-500 hover:text-red-500 transition-colors hover:bg-red-50 rounded"
          style={{ fontSize: '13px', padding: '4px 10px' }}
        >
          退出
        </button>
      </div>
    </header>
  );
}
