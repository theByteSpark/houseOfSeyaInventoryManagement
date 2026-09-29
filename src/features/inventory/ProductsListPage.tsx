import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  CsvImportModal,
  EmptyState,
  FullPageSpinner,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  Select,
  Table,
  type Column,
} from '@/components/ui';
import { useTableQuery } from '@/lib/useTableQuery';
import { importProductsCsv } from '@/features/import-export/api';
import { productKeys, useDeleteProduct, useProductsPage, useSubcategoryGroups } from './hooks';
import { formatCurrency } from '@/lib/format';
import type { Product } from '@/types';

const STATUS_BADGE_TONE: Record<Product['status'], 'warning' | 'success' | 'neutral'> = {
  ORDERED: 'warning',
  ACTIVE: 'success',
  SOLD: 'neutral',
};

const STATUS_LABEL: Record<Product['status'], string> = {
  ORDERED: 'Ordered',
  ACTIVE: 'Active',
  SOLD: 'Sold',
};

export function ProductsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const [subcategoryId, setSubcategoryId] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const subcategoryGroups = useSubcategoryGroups();
  const { data, isLoading, isPlaceholderData } = useProductsPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    subcategoryId: subcategoryId || undefined,
  });
  const deleteProduct = useDeleteProduct();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const products = data?.data ?? [];

  const handleSubcategoryChange = (value: string) => {
    setSubcategoryId(value);
    query.setPage(1);
  };

  const openCreate = () => navigate('/inventory/products/new');

  const openEdit = (product: Product) => navigate(`/inventory/products/${product.id}/edit`);

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      sortField: 'name',
      render: (p) => (
        <div>
          <p className="font-medium text-graphite-900">{p.name}</p>
          <p className="text-xs text-graphite-400">{p.designNumber}</p>
        </div>
      ),
    },
    {
      key: 'subcategory',
      header: 'Subcategory',
      sortField: 'subcategory',
      render: (p) =>
        p.subcategoryName ? (
          <div>
            <div>{p.subcategoryName}</div>
            {p.categoryName && <div className="text-xs text-graphite-400">{p.categoryName}</div>}
          </div>
        ) : (
          <span className="text-graphite-300">—</span>
        ),
    },
    {
      key: 'price',
      header: 'Selling price',
      sortField: 'sellingPrice',
      render: (p) => formatCurrency(p.sellingPrice),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge tone={STATUS_BADGE_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <IconButton
            label="Edit product"
            tone="brand"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p);
            }}
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton
            label="Delete product"
            tone="danger"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(p);
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
        title="Inventory"
        description="Track your product catalog and its status."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)} icon={<Upload className="h-4 w-4" strokeWidth={2} />}>
              Import
            </Button>
            <Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add product</Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search by product, subcategory or category"
            value={query.searchInput}
            onChange={(e) => query.setSearchInput(e.target.value)}
            onKeyDown={query.handleSearchKeyDown}
          />
        </div>
        <div className="w-full max-w-[14rem]">
          <Select
            aria-label="Subcategory filter"
            value={subcategoryId}
            onChange={(e) => handleSubcategoryChange(e.target.value)}
          >
            <option value="">All subcategories</option>
            {subcategoryGroups.map((group) => (
              <optgroup key={group.categoryName} label={group.categoryName}>
                {group.items?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>
      </div>

      <Card className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
        {products.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="Add your first product to start tracking inventory."
            action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add product</Button>}
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={products}
              getRowKey={(p) => p.id}
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

      <CsvImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import products"
        templateUrl="/import/products/template"
        templateFilename="products-import-template.csv"
        onUpload={importProductsCsv}
        onImported={() => queryClient.invalidateQueries({ queryKey: productKeys.all })}
        rowLabel={(r) => String(r.designNumber ?? r.row)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteProduct.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        title="Delete product"
        description={
          <>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteProduct.isPending}
      />
    </div>
  );
}
