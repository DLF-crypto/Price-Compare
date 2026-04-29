import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useEmployeeStore } from '@/store/employees';
import { useAuthStore } from '@/store/auth';
import { Navigate } from 'react-router-dom';
import type { User } from '@/types';

export default function EmployeesPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const { employees, load, add, update, remove } = useEmployeeStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => { load(); }, [load]);

  if (!isAdmin()) {
    return <Navigate to="/compare" replace />;
  }

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('USER');
    setStatus('active');
    setEditing(null);
    setFormError('');
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };

  const openEdit = (employee: User) => {
    setEditing(employee);
    setName(employee.name);
    setEmail(employee.email);
    setPassword('');
    setRole(employee.role);
    setStatus(employee.status);
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);
    setFormError('');

    if (editing) {
      await update(editing.id, { name, role, status });
    } else {
      if (!email || !password) { setSaving(false); return; }
      const err = await add({ name, email, password, role, status });
      if (err) {
        setFormError(err);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setModalOpen(false);
    resetForm();
  };

  const filtered = employees.filter(
    (e) => e.name.includes(search) || e.email.includes(search)
  );

  const columns: Column<User>[] = [
    { key: 'name', title: '姓名' },
    { key: 'email', title: '邮箱' },
    {
      key: 'role',
      title: '角色',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          row.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
        }`}>
          {row.role === 'ADMIN' ? '管理员' : '普通用户'}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {row.status === 'active' ? '启用' : '停用'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (row) => new Date(row.createdAt).toLocaleDateString('zh-CN'),
    },
    {
      key: 'actions',
      title: '操作',
      render: (row) => (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>编辑</Button>
          <Button size="sm" variant="danger" onClick={async () => {
            if (confirm('确定删除该员工？')) await remove(row.id);
          }}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">员工管理</h2>
          <p className="text-sm text-slate-500 page-title-desc">管理系统用户和角色分配</p>
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增员工
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <Input placeholder="搜索姓名或邮箱..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Table columns={columns} data={filtered} rowKey={(row) => row.id} />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editing ? '编辑员工' : '新增员工'}
      >
        <div className="form-fields">
          <Input label="姓名" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入姓名" />
          {!editing && (
            <>
              <Input label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" />
              <Input
                label="密码"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </>
          )}
          {editing && (
            <div className="text-sm text-slate-500 bg-slate-50 rounded-lg" style={{ padding: '10px 16px' }}>
              邮箱: {editing.email}（邮箱和密码暂不支持修改）
            </div>
          )}
          {formError && (
            <div className="text-sm text-red-500 bg-red-50 rounded-lg" style={{ padding: '10px 16px' }}>
              {formError}
            </div>
          )}
          <div className="form-grid grid-cols-2">
            <Select
              label="角色"
              options={[{ value: 'USER', label: '普通用户' }, { value: 'ADMIN', label: '管理员' }]}
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'USER')}
            />
            <Select
              label="状态"
              options={[{ value: 'active', label: '启用' }, { value: 'inactive', label: '停用' }]}
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
            />
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }}>取消</Button>
            <Button onClick={handleSave} disabled={saving || !name || (!editing && (!email || !password))}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
