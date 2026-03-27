import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useCountryStore } from '@/store/countries';
import type { Country } from '@/types';

export default function CountriesPage() {
  const { countries, load, add, update, remove } = useCountryStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [search, setSearch] = useState('');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setName('');
    setCode('');
    setStatus('active');
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };

  const openEdit = (country: Country) => {
    setEditing(country);
    setName(country.name);
    setCode(country.code || '');
    setStatus(country.status);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name) return;
    const data = { name, code: code || undefined, status };
    if (editing) {
      update(editing.id, data);
    } else {
      add(data as Omit<Country, 'id' | 'createdAt'>);
    }
    setModalOpen(false);
    resetForm();
  };

  const filtered = countries.filter(
    (c) => c.name.includes(search) || (c.code && c.code.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<Country>[] = [
    { key: 'name', title: '国家名称' },
    {
      key: 'code',
      title: '国家代码',
      render: (row) => row.code || '-',
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
          <Button size="sm" variant="danger" onClick={() => {
            if (confirm('确定删除该国家？')) remove(row.id);
          }}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">国家基础资料维护</h2>
          <p className="text-sm text-slate-500 page-title-desc">管理目的国家基础信息</p>
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增国家
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Input placeholder="搜索国家名称或代码..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Table columns={columns} data={filtered} rowKey={(row) => row.id} />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editing ? '编辑国家' : '新增国家'}
      >
        <div className="form-fields">
          <div className="form-grid grid-cols-2">
            <Input label="国家名称" value={name} onChange={(e) => setName(e.target.value)} placeholder="如：美国" />
            <Input label="国家代码（可选）" value={code} onChange={(e) => setCode(e.target.value)} placeholder="如：US" />
          </div>
          <Select
            label="状态"
            options={[{ value: 'active', label: '启用' }, { value: 'inactive', label: '停用' }]}
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
          />
          <div className="form-actions">
            <Button variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }}>取消</Button>
            <Button onClick={handleSave} disabled={!name}>保存</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
