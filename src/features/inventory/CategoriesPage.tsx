import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  FullPageSpinner,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  Table,
  toast,
  type Column,
} from '@/components/ui';
import { useTableQuery } from '@/lib/useTableQuery';
import { useCategoriesPage, useDeleteCategory } from './hooks';
import { CategoryFormModal } from './CategoryFormModal';
import { extractErrorMessage } from '@/lib/apiClient';
import type { Category } from '@/types';

export function CategoriesPage() {
  const query = useTableQuery({ defaultSortBy: 'name', defaultSortDir: 'asc' });
  const { data, isLoading, isPlaceholderData } = useCategoriesPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
  const deleteCategory = useDeleteCategory();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categories = data?.data ?? [];

  const openCreate = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteCategory.mutateAsync(deleteTarget.id);
      toast.success('Category deleted');
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(extractErrorMessage(err, 'Could not delete category.'));
    }
  };

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category',
      sortField: 'name',
      render: (c) => <span className="font-medium text-graphite-900">{c.name}</span>,
    },
    {
      key: 'count',
      header: 'Products',
      align: 'right',
      sortField: 'productCount',
      render: (c) => <Badge tone="neutral">{c.productCount}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <IconButton label="Edit category" tone="brand" onClick={() => openEdit(c)}>
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton label="Delete category" tone="danger" onClick={() => { setDeleteError(null); setDeleteTarget(c); }}>
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
        title="Categories"
        description="Group products for easier browsing and reporting."
        action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add category</Button>}
      />

      <div className="mb-4 w-full max-w-xs">
        <Input
          placeholder="Search categories"
          value={query.searchInput}
          onChange={(e) => query.setSearchInput(e.target.value)}
          onKeyDown={query.handleSearchKeyDown}
        />
      </div>

      <Card className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Create a category to start organizing products."
            action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add category</Button>}
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={categories}
              getRowKey={(c) => c.id}
              sortBy={query.sortBy}
              sortDir={query.sortDir}
              onSortChange={query.toggleSort}
            />
            <Pagination
              page={data?.page ?? query.page}
              pageSize={data?.pageSize ?? query.pageSize}
              total={data?.total ?? 0}
              onPageChange={query.setPage}
              onPageSizeChange={query.setPageSize}
            />
          </>
        )}
      </Card>

      <CategoryFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} category={editingCategory} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete category"
        description={
          <>
            {deleteError ? (
              <span className="text-red-600">{deleteError}</span>
            ) : (
              <>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              </>
            )}
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteCategory.isPending}
      />
    </div>
  );
}
