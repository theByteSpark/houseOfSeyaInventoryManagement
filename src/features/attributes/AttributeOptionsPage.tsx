import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmModal,
  EmptyState,
  IconButton,
  Input,
  PageHeader,
  Spinner,
} from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { useAttributeOptions, useCreateAttributeOption, useDeleteAttributeOption } from './hooks';
import type { AttributeOption, AttributeType } from '@/types';

function AttributeOptionSection({ type, title, placeholder }: { type: AttributeType; title: string; placeholder: string }) {
  const { data: options, isLoading } = useAttributeOptions(type);
  const createOption = useCreateAttributeOption();
  const deleteOption = useDeleteAttributeOption();
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttributeOption | null>(null);

  const handleAdd = async () => {
    setError(null);
    if (!label.trim()) return;
    try {
      await createOption.mutateAsync({ type, label: label.trim() });
      setLabel('');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not add this option.'));
    }
  };

  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        <div className="mb-4 flex items-end gap-2">
          <div className="flex-1">
            <Input
              placeholder={placeholder}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
          </div>
          <Button
            onClick={handleAdd}
            isLoading={createOption.isPending}
            disabled={!label.trim()}
            icon={<Plus className="h-4 w-4" strokeWidth={2} />}
          >
            Add
          </Button>
        </div>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {isLoading ? (
          <Spinner />
        ) : options && options.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {options.map((opt) => (
              <li
                key={opt.id}
                className="flex items-center justify-between rounded-md border border-graphite-100 px-3 py-2 text-sm text-graphite-800"
              >
                {opt.label}
                <IconButton label={`Remove ${opt.label}`} tone="danger" onClick={() => setDeleteTarget(opt)}>
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No options yet" description="Add the first option above." />
        )}
      </CardBody>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteOption.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        title="Remove option"
        description={
          <>
            Remove <strong>{deleteTarget?.label}</strong>? Products that already use it keep showing it as-is — this only
            removes it from the picker for new entries.
          </>
        }
        confirmLabel="Remove"
        isLoading={deleteOption.isPending}
      />
    </Card>
  );
}

export function AttributeOptionsPage() {
  return (
    <div>
      <PageHeader
        title="Attribute options"
        description="Manage the Metal Type, Diamond Shape, and Diamond Quality picklists used on the product form."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AttributeOptionSection type="METAL" title="Metal types" placeholder="e.g. Platinum" />
        <AttributeOptionSection type="DIAMOND_SHAPE" title="Diamond shapes" placeholder="e.g. Oval" />
        <AttributeOptionSection type="DIAMOND_QUALITY" title="Diamond qualities" placeholder="e.g. Q3" />
      </div>
    </div>
  );
}
