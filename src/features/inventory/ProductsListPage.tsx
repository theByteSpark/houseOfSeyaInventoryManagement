import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PackagePlus, Pencil, Plus, Trash2, Upload } from 'lucide-react';
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
import type { StockFilter } from './api';
import { importProductsCsv } from '@/features/import-export/api';
import { productKeys, useDeleteProduct, useProductsPage } from './hooks';
import { RestockModal } from './RestockModal';
import { formatCurrency } from '@/lib/format';
import type { Product } from '@/types';

export function ProductsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [importOpen, setImportOpen] = useState(false);
  const { data, isLoading, isPlaceholderData } = useProductsPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    stockFilter,
  });
  const deleteProduct = useDeleteProduct();
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const products = data?.data ?? [];

  const handleStockFilterChange = (value: StockFilter) => {
    setStockFilter(value);
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
      key: 'stock',
      header: 'Stock',
      sortField: 'quantityInStock',
      render: (p) => {
        const isLow = p.quantityInStock <= p.reorderLevel;
        return (
          <div className="flex items-center gap-2">
            <span className={isLow ? 'font-medium text-amber-600' : 'text-graphite-700'}>{p.quantityInStock}</span>
            {isLow && <Badge tone="warning">Low</Badge>}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <IconButton
            label="Restock product"
            tone="amber"
            onClick={(e) => {
              e.stopPropagation();
              setRestockTarget(p);
            }}
          >
            <PackagePlus className="h-4 w-4" strokeWidth={2} />
          </IconButton>
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
        title="Products"
        description="Track stock levels and manage your product catalog."
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
        <div className="w-full max-w-[10rem]">
          <Select
            aria-label="Stock filter"
            value={stockFilter}
            onChange={(e) => handleStockFilterChange(e.target.value as StockFilter)}
          >
            <option value="all">All stock</option>
            <option value="low">Low stock</option>
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

      <RestockModal isOpen={!!restockTarget} onClose={() => setRestockTarget(null)} product={restockTarget} />

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
