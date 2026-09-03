import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Table, Button, Badge, Modal, Input } from '../../components/ui';
import { usersApi } from '../../api/users.api';
import type { UserRole } from '../../types';
import type { User } from '../../types/user';
import { useAuthStore } from '../../store/auth.store';

export function UsersPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'client' as UserRole });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setOpen(false); setForm({ first_name: '', last_name: '', email: '', password: '',  role: 'client' as UserRole }); },
    onError: (err: unknown) => setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const columns = [
    { key: 'username', header: 'Username', render: (u: User) => <span className="font-medium">{u.first_name} {u.last_name}</span> },
    { key: 'email', header: 'Email' },
    {
      key: 'is_active',
      header: 'Status',
      render: (u: User) => <Badge variant={u.status === 'active' ? 'success' : 'default'}>{u.status === 'active' ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (u: User) =>
        u.id !== currentUser?.id ? (
          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(u.id)}>
            <Trash2 size={14} className="text-red-500" />
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button size="sm" onClick={() => { setError(''); setOpen(true); }}>
          <Plus size={14} /> New User
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={data?.data.users ?? []}
          keyExtractor={(u) => u.id}
          loading={isLoading}
          emptyText="No users found"
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <p className=" text-red-500">{error}</p>}
          <Input label="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <Input label="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
