import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const { user, login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/compare" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    const success = login(email, password);
    if (success) {
      navigate('/compare');
    } else {
      setError('邮箱或密码错误');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center" style={{ marginBottom: '36px' }}>
          <img src={import.meta.env.BASE_URL + 'guokui_logo.svg'} alt="锅盔" style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
          <h1 className="text-2xl font-bold text-slate-800">锅盔专线比价系统</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100" style={{ padding: '40px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <Input
                label="邮箱"
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 rounded-lg" style={{ padding: '10px 16px', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: '8px' }}>
              <Button type="submit" className="w-full" size="lg">
                登 录
              </Button>
            </div>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '20px' }} className="border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center" style={{ marginBottom: '12px' }}>测试账号</p>
            <div className="grid grid-cols-2 text-xs" style={{ gap: '12px' }}>
              <div className="bg-slate-50 rounded-lg text-center" style={{ padding: '12px' }}>
                <p className="text-slate-600 font-medium">管理员</p>
                <p className="text-slate-400">admin@guokui.com</p>
                <p className="text-slate-400">admin123</p>
              </div>
              <div className="bg-slate-50 rounded-lg text-center" style={{ padding: '12px' }}>
                <p className="text-slate-600 font-medium">普通用户</p>
                <p className="text-slate-400">user@guokui.com</p>
                <p className="text-slate-400">user123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
