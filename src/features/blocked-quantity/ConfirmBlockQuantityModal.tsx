import { useEffect, useState } from 'react';
import { extractErrorMessage } from '@/lib/apiClient';
import { Button, Input, Modal, SearchableCombobox } from '@/components/ui';
import { useCustomers } from '@/features/customers/hooks';
import { CustomerFormModal } from '@/features/customers/CustomerFormModal';
import { useConfirmBlockedQuantity } from './hooks';
import type { BlockedQuantity, Customer } from '@/types';

export function ConfirmBlockQuantityModal({
  isOpen,
  onClose,
  blockedQuantity,
}: {
  isOpen: boolean;
  onClose: () => void;
  blockedQuantity: BlockedQuantity | null;
}) {
  const { data: customers } = useCustomers();
  const confirmBlockedQuantity = useConfirmBlockedQuantity();

  const [customerId, setCustomerId] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomerId('');
      setUnitPrice('');
      setError(null);
      setTouched(false);
    }
  }, [isOpen]);

  if (!blockedQuantity) return null;

  const getPriceError = (): string | null => {
    if (unitPrice === '' || unitPrice < 0) return 'Price cannot be negative.';
    return null;
  };

  const hasErrors = !customerId || getPriceError() !== null;

  const handleSubmit = async () => {
    setError(null);
    if (hasErrors) {
      setError('Fix the highlighted fields before confirming.');
      return;
    }
    try {
      await confirmBlockedQuantity.mutateAsync({
        id: blockedQuantity.id,
        input: { customerId, unitPrice: unitPrice as number },
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not confirm blocked quantity.'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm blocked quantity"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={confirmBlockedQuantity.isPending}
            disabled={hasErrors || confirmBlockedQuantity.isPending}
          >
            Confirm
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-lg border border-graphite-100 bg-graphite-50 p-3 text-sm">
          <p className="font-medium text-graphite-900">{blockedQuantity.productName}</p>
          <p className="text-graphite-500">Blocked quantity: {blockedQuantity.quantity} kgs</p>
          <p className="text-graphite-500">Warehouse: {blockedQuantity.warehouseName}</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <SearchableCombobox
          label="Customer"
          items={customers ?? []}
          value={customerId || null}
          onChange={(customer: Customer) => setCustomerId(customer.id)}
          getOptionLabel={(c) => c.name}
          getOptionValue={(c) => c.id}
          getOptionSublabel={(c) => c.email ?? null}
          placeholder="Search customer by name or email…"
          addNewLabel="Add new customer"
          onAddNew={() => setCustomerModalOpen(true)}
        />
        <Input
          label="Unit price"
          type="number"
          min="0"
          step="0.01"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
          onBlur={() => setTouched(true)}
          error={touched ? (getPriceError() ?? undefined) : undefined}
        />
      </div>

      <CustomerFormModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onCreated={(customer) => {
          setCustomerId(customer.id);
          setCustomerModalOpen(false);
        }}
      />
    </Modal>
  );
}
