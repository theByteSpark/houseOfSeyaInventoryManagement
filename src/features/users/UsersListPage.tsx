import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  FullPageSpinner,
  IconButton,
  PageHeader,
  Table,
  type Column,
} from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { extractErrorMessage } from '@/lib/apiClient';
import { useDeleteUser, useUsers } from './hooks';
import { UserFormModal } from './UserFormModal';
import { RoleBadge } from './roleBadge';
import type { User } from '@/types';

export function UsersListPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(extractErrorMessage(err, 'Could not delete user.'));
    }
  };

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', render: (u) => <span className="font-medium text-graphite-900">{u.name}</span> },
    { key: 'email', header: 'Email', render: (u) => u.email },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <RoleBadge role={u.role} />,
    },
    {
      key: 'warehouse',
      header: 'Warehouse',
      render: (u) => u.warehouseName ?? <span className="text-graphite-300">—</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <div className="flex justify-end gap-1">
          <IconButton
            label="Delete user"
            tone="danger"
            disabled={u.id === currentUser?.id}
            onClick={() => {
              setDeleteError(null);
              setDeleteTarget(u);
            }}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </IconButton>
        </div>
      ),
    },
  ];

  if (isLoading) return <FullPageSpinner />;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage who can sign in to Paragon Resin."
        action={<Button onClick={() => setFormOpen(true)} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add user</Button>}
      />

      <Card>
        {!users || users.length === 0 ? (
          <EmptyState
            title="No users yet"
            description="Add your first team member to give them access."
            action={<Button onClick={() => setFormOpen(true)} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add user</Button>}
          />
        ) : (
          <Table columns={columns} rows={users} getRowKey={(u) => u.id} />
        )}
      </Card>

      <UserFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete user"
        description={
          <>
            {deleteError ? (
              <span className="text-red-600">{deleteError}</span>
            ) : (
              <>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? They will lose access immediately.
              </>
            )}
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteUser.isPending}
      />
    </div>
  );
}
