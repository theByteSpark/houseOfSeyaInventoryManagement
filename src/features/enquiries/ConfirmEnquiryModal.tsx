import { useEffect, useState } from 'react';
import { extractErrorMessage } from '@/lib/apiClient';
import { Button, Input, Modal, Select, SearchableCombobox } from '@/components/ui';
import { useVendors } from '@/features/vendors/hooks';
import { VendorFormModal } from '@/features/vendors/VendorFormModal';
import { useCustomers } from '@/features/customers/hooks';
import { CustomerFormModal } from '@/features/customers/CustomerFormModal';
import { useWarehouses } from '@/features/warehouses/hooks';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useConfirmEnquiry } from './hooks';
import type { Customer, Enquiry, Vendor } from '@/types';

export function ConfirmEnquiryModal({
  isOpen,
  onClose,
  enquiry,
}: {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry | null;
}) {
  const { data: vendors } = useVendors();
  const { data: customers } = useCustomers();
  const { data: warehouses } = useWarehouses();
  const { selectedWarehouseId } = useWarehouseContext();
  const confirmEnquiry = useConfirmEnquiry();

  const [warehouseId, setWarehouseId] = useState('');

  const [vendorId, setVendorId] = useState('');
  const [vendorQuantity, setVendorQuantity] = useState<number | ''>('');
  const [vendorPrice, setVendorPrice] = useState<number | ''>('');
  const [vendorModalOpen, setVendorModalOpen] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [customerQuantity, setCustomerQuantity] = useState<number | ''>('');
  const [customerPrice, setCustomerPrice] = useState<number | ''>('');
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    vendorQuantity: false,
    vendorPrice: false,
    customerQuantity: false,
    customerPrice: false,
  });
  const markTouched = (field: keyof typeof touched) => setTouched((prev) => ({ ...prev, [field]: true }));

  useEffect(() => {
    if (isOpen) {
      setWarehouseId(selectedWarehouseId ?? '');
      setVendorId('');
      setVendorQuantity('');
      setVendorPrice('');
      setCustomerId('');
      setCustomerQuantity('');
      setCustomerPrice('');
      setError(null);
      setTouched({ vendorQuantity: false, vendorPrice: false, customerQuantity: false, customerPrice: false });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [isOpen]);

  if (!enquiry) return null;

  const getVendorQuantityError = (): string | null => {
    if (vendorQuantity === '' || vendorQuantity < 1 || !Number.isInteger(vendorQuantity)) {
      return 'Enter a quantity of at least 1.';
    }
    if (vendorQuantity > enquiry.quantity) {
      return `Cannot exceed remaining enquiry quantity of ${enquiry.quantity}.`;
    }
    return null;
  };

  const getVendorPriceError = (): string | null => {
    if (vendorPrice === '' || vendorPrice < 0) return 'Price cannot be negative.';
    return null;
  };

  const getCustomerQuantityError = (): string | null => {
    if (customerQuantity === '' || customerQuantity < 1 || !Number.isInteger(customerQuantity)) {
      return 'Enter a quantity of at least 1.';
    }
    return null;
  };

  const getCustomerPriceError = (): string | null => {
    if (customerPrice === '' || customerPrice < 0) return 'Price cannot be negative.';
    return null;
  };

  const hasErrors =
    !warehouseId ||
    !vendorId ||
    !customerId ||
    getVendorQuantityError() !== null ||
    getVendorPriceError() !== null ||
    getCustomerQuantityError() !== null ||
    getCustomerPriceError() !== null;

  const handleSubmit = async () => {
    setError(null);
    if (hasErrors) {
      setError('Fix the highlighted fields before confirming.');
      return;
    }
    try {
      await confirmEnquiry.mutateAsync({
        id: enquiry.id,
        input: {
          warehouseId,
          vendor: { vendorId, quantity: vendorQuantity as number, price: vendorPrice as number },
          customer: { customerId, quantity: customerQuantity as number, price: customerPrice as number },
        },
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not confirm enquiry.'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm enquiry"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={confirmEnquiry.isPending} disabled={hasErrors || confirmEnquiry.isPending}>
            Confirm
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-lg border border-graphite-100 bg-graphite-50 p-3 text-sm">
          <p className="font-medium text-graphite-900">{enquiry.productName}</p>
          <p className="text-graphite-500">Remaining quantity: {enquiry.quantity} kgs</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Select label="Warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
          <option value="">Select warehouse…</option>
          {(warehouses ?? []).map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>

        <div className="flex flex-col gap-3 rounded-lg border border-graphite-100 p-3">
          <p className="text-sm font-semibold text-graphite-800">Vendor (Purchase)</p>
          <SearchableCombobox
            label="Vendor"
            items={vendors ?? []}
            value={vendorId || null}
            onChange={(vendor: Vendor) => setVendorId(vendor.id)}
            getOptionLabel={(v) => v.companyName}
            getOptionValue={(v) => v.id}
            getOptionSublabel={(v) => v.contactPerson ?? null}
            placeholder="Search vendor by company or contact…"
            addNewLabel="Add new vendor"
            onAddNew={() => setVendorModalOpen(true)}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Quantity (kgs)"
              type="number"
              min="1"
              max={enquiry.quantity}
              value={vendorQuantity}
              onChange={(e) => setVendorQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => markTouched('vendorQuantity')}
              error={touched.vendorQuantity ? (getVendorQuantityError() ?? undefined) : undefined}
            />
            <Input
              label="Price"
              type="number"
              min="0"
              step="0.01"
              value={vendorPrice}
              onChange={(e) => setVendorPrice(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => markTouched('vendorPrice')}
              error={touched.vendorPrice ? (getVendorPriceError() ?? undefined) : undefined}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-graphite-100 p-3">
          <p className="text-sm font-semibold text-graphite-800">Customer (Sale)</p>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Quantity (kgs)"
              type="number"
              min="1"
              value={customerQuantity}
              onChange={(e) => setCustomerQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => markTouched('customerQuantity')}
              error={touched.customerQuantity ? (getCustomerQuantityError() ?? undefined) : undefined}
            />
            <Input
              label="Price"
              type="number"
              min="0"
              step="0.01"
              value={customerPrice}
              onChange={(e) => setCustomerPrice(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => markTouched('customerPrice')}
              error={touched.customerPrice ? (getCustomerPriceError() ?? undefined) : undefined}
            />
          </div>
        </div>
      </div>

      <VendorFormModal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onCreated={(vendor) => {
          setVendorId(vendor.id);
          setVendorModalOpen(false);
        }}
      />
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
