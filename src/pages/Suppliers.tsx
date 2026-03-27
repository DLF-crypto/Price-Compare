import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useSupplierStore } from '@/store/suppliers';
import type { Supplier, SupplierType } from '@/types';

const SUPPLIER_TYPE_OPTIONS = [
  { value: 'first_mile', label: '头程供应商' },
  { value: 'customs', label: '清关供应商' },
  { value: 'last_mile', label: '尾程供应商' },
  { value: 'full_service', label: '全程供应商' },
];

const SUPPLIER_TYPE_MAP: Record<SupplierType, string> = {
  first_mile: '头程供应商',
  customs: '清关供应商',
  last_mile: '尾程供应商',
  full_service: '全程供应商',
};

const SUPPLIER_TYPE_COLOR: Record<SupplierType, string> = {
  first_mile: 'bg-blue-100 text-blue-700',
  customs: 'bg-amber-100 text-amber-700',
  last_mile: 'bg-green-100 text-green-700',
  full_service: 'bg-purple-100 text-purple-700',
};

export default function SuppliersPage() {
  const { suppliers, load, add, update, remove } = useSupplierStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');

  const [name, setName] = useState('');
  const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setName('');
    setSupplierTypes([]);
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setStatus('active');
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setName(supplier.name);
    setSupplierTypes(supplier.supplierTypes);
    setContactPerson(supplier.contactPerson);
    setPhone(supplier.phone);
    setEmail(supplier.email);
    setAddress(supplier.address);
    setStatus(supplier.status);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name || supplierTypes.length === 0) return;
    const data = { name, supplierTypes, contactPerson, phone, email, address, status };
    if (editing) {
      update(editing.id, data);
    } else {
      add(data);
    }
    setModalOpen(false);
    resetForm();
  };

  const filtered = suppliers.filter(
    (s) => s.name.includes(search) || s.contactPerson.includes(search) || s.email.includes(search)
  );

  const columns: Column<Supplier>[] = [
    { key: 'name', title: '供应商名称' },
    {
      key: 'supplierTypes',
      title: '供应商类型',
      render: (row) =>
        row.supplierTypes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.supplierTypes.map((t) => (
              <span key={t} className={`px-2 py-0.5 rounded-full text-xs font-medium ${SUPPLIER_TYPE_COLOR[t]}`}>
                {SUPPLIER_TYPE_MAP[t]}
              </span>
            ))}
          </div>
        ) : '-',
    },
    { key: 'contactPerson', title: '联系人' },
    { key: 'phone', title: '电话' },
    { key: 'email', title: '邮箱' },
    { key: 'address', title: '地址' },
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
      key: 'actions',
      title: '操作',
      render: (row) => (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>编辑</Button>
          <Button size="sm" variant="danger" onClick={() => {
            if (confirm('确定删除该供应商？')) remove(row.id);
          }}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">供应商管理</h2>
          <p className="text-sm text-slate-500 page-title-desc">管理物流供应商信息</p>
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增供应商
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Input placeholder="搜索供应商名称、联系人或邮箱..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Table columns={columns} data={filtered} rowKey={(row) => row.id} />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editing ? '编辑供应商' : '新增供应商'}
      >
        <div className="form-fields">
          <div className="form-grid grid-cols-2">
            <Input label="供应商名称" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入供应商名称" />
            <CheckboxGroup
              label="供应商类型"
              options={SUPPLIER_TYPE_OPTIONS}
              value={supplierTypes}
              onChange={(v) => setSupplierTypes(v as SupplierType[])}
            />
          </div>
          <div className="form-grid grid-cols-2">
            <Input label="联系人" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="请输入联系人" />
            <Input label="电话" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入电话" />
          </div>
          <Input label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" />
          <Input label="地址" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="请输入地址" />
          <Select
            label="状态"
            options={[{ value: 'active', label: '启用' }, { value: 'inactive', label: '停用' }]}
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
          />
          <div className="form-actions">
            <Button variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }}>取消</Button>
            <Button onClick={handleSave} disabled={!name || supplierTypes.length === 0}>保存</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
