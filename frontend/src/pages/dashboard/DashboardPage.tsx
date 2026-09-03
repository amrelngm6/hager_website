import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { StatCard } from '../../components/ui';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.status === 'active';

  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list(), enabled: isAdmin });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500  mt-1">Welcome back, {user?.first_name}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isAdmin && (
          <StatCard
            label="Users"
            value={usersData?.data.users.length ?? 0}
            icon={<Users size={20} />}
            color="bg-indigo-50 text-indigo-600"
          />
        )}
      </div>

    </div>
  );
}
