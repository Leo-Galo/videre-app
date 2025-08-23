
"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import type { Product, OrderItem, Order, PaymentMethod as PaymentMethodType, DocumentType, Customer } from '@/types/pos';
import type { Patient, Prescription } from '@/types/patient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Search, Barcode, Printer, PlusCircle, UserSearch, CheckSquare, AlertTriangle, CheckCircle as CheckCircleIcon, ShoppingCart, FilePlus, XCircle, DollarSign, CreditCard, Smartphone, Landmark, FileText, Loader2, ChevronsUpDown, ArchiveRestore, Eye, Archive, Banknote, PackageSearch, Settings2, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from 'next/image';
import Link from 'next/link';
import { useCashBoxStore } from "@/hooks/use-cash-register-store";
import { getProducts } from "@/services/inventory-service";
import { getPatients } from "@/services/patient-service";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { saveOrder } from "@/services/order-service";
import { ItemDiscountModal } from '@/components/dashboard/sales/item-discount-dialog';
import { itemDiscountSchema, type ItemDiscountFormValues } from '@/types/discount-schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { InvoiceModal } from "@/components/dashboard/sales/invoice-modal";
import { posFormSchema, type PosFormValues } from "@/types/pos-schema";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LabOrderDialog } from "@/components/dashboard/lab/lab-order-dialog";
import { getTagConfig } from '@/config/discounts';

const documentTypeLabels: Record<DocumentType, string> = {
  electronic_invoice: "Factura Electrónica",
  electronic_ticket: "Tiquete Electrónico",
  proforma_invoice: "Factura Proforma",
  internal_sale_receipt: "FACTURA DE VENTA",
};

const documentTypePrefixes: Record<DocumentType, string> = {
  electronic_invoice: "FE",
  electronic_ticket: "TE",
  proforma_invoice: "PROF",
  internal_sale_receipt: "FACT",
};

const paymentMethodOptions: { value: PaymentMethodType; label: string; icon: React.ElementType; requiresReference: boolean }[] = [
    { value: "cash", label: "Efectivo", icon: DollarSign, requiresReference: false },
    { value: "card", label: "Tarjeta", icon: CreditCard, requiresReference: true },
    { value: "sinpe", label: "SINPE Móvil", icon: Smartphone, requiresReference: true },
    { value: "transfer", label: "Transferencia", icon: Landmark, requiresReference: true },
];


const SalesPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const { cashBoxStatus, openCashBox } = useCashBoxStore();
  const isCashBoxClosed = cashBoxStatus === 'closed';

  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [barcodeSearch, setBarcodeSearch] = useState("");
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [customerLoyaltyPoints, setCustomerLoyaltyPoints] = useState(0);
  const [invoiceType, setInvoiceType] = useState<DocumentType>("electronic_ticket");
  const [isCustomerSearchModalOpen, setIsCustomerSearchModalOpen] = useState(false);
  const [customerSearchTermModal, setCustomerSearchTermModal] = useState("");
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentLines, setPaymentLines] = useState<{ id: string; method: PaymentMethodType; amount: number; reference?: string }[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethodType>("cash");
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<string>("");
  const [currentPaymentReference, setCurrentPaymentReference] = useState<string>("");

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [itemToDiscount, setItemToDiscount] = useState<OrderItem | null>(null);

  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  
  const [isLabOrderModalOpen, setIsLabOrderModalOpen] = useState(false);
  const [orderForLab, setOrderForLab] = useState<Order | null>(null);
  
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [initialCash, setInitialCash] = useState("");
  const { userName } = useCurrentUser();

  const isFacturaElectronica = invoiceType === "electronic_invoice";
  const isGenericCustomer = !selectedCustomer || selectedCustomer.id === '0';

  const discountForm = useForm<ItemDiscountFormValues>({
    resolver: zodResolver(itemDiscountSchema),
    defaultValues: { type: 'percentage', value: 0, reason: '' },
  });

  const paymentForm = useForm<PosFormValues>({
      resolver: zodResolver(posFormSchema),
      defaultValues: {
        preferredDocumentType: 'electronic_ticket',
      },
  });

  useEffect(() => {
    async function loadInitialData() {
      const [fetchedProducts, fetchedPatients] = await Promise.all([
        getProducts(),
        getPatients()
      ]);
      setProducts(fetchedProducts.map(p => ({ ...p, ivaRate: p.ivaRate ?? 0.13, requiresPrescription: (p.category.toLowerCase().includes('armazones') || p.category.toLowerCase().includes('oftálmico')) && !p.category.toLowerCase().includes('contacto') })));
      setPatients(fetchedPatients);
      
      const genericCustomer: Customer = { id: '0', name: 'Consumidor Final', identification: '0000000000', identificationType: "Otro" };
      setSelectedCustomer(genericCustomer);
    }
    loadInitialData();
  }, []);

  const cartCalculations = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    let totalDiscount = 0;

    const updatedCartItems = cartItems.map(item => {
      const lineSubtotalWithoutTax = item.unitPrice * item.quantity;
      let lineSubtotalAfterDiscount = lineSubtotalWithoutTax;
      let amountApplied = 0;

      if (item.discount) {
        if (item.discount.type === 'fixed') {
          amountApplied = Math.min(item.discount.value, lineSubtotalWithoutTax);
        } else { // percentage
          amountApplied = lineSubtotalWithoutTax * (item.discount.value / 100);
        }
        lineSubtotalAfterDiscount -= amountApplied;
        totalDiscount += amountApplied;
      }
      const lineTaxAmount = lineSubtotalAfterDiscount * (item.product.ivaRate || 0.13); // Use product's IVA rate
      subtotal += lineSubtotalAfterDiscount;
      tax += lineTaxAmount;
      return { ...item, lineSubtotalWithoutTax: lineSubtotalAfterDiscount, lineTaxAmount, lineTotalWithTax: lineSubtotalAfterDiscount + lineTaxAmount, discount: item.discount ? { ...item.discount, amountApplied } : undefined };
    });

    const total = subtotal + tax;

    return { 
      updatedCartItems,
      montoTotalGravadoBase: subtotal,
      montoTotalExentoInafecto: 0, // Simplified for now
      montoTotalIVA: tax,
      montoTotalFactura: total,
      montoTotalDescuento: totalDiscount
    };
  }, [cartItems]);

  const { updatedCartItems, montoTotalFactura, montoTotalDescuento, montoTotalIVA, montoTotalGravadoBase } = cartCalculations;

  const totalPaid = useMemo(() => {
    return paymentLines.reduce((sum, line) => sum + line.amount, 0);
  }, [paymentLines]);

  const remainingBalance = useMemo(() => {
    return montoTotalFactura - totalPaid;
  }, [montoTotalFactura, totalPaid]);

  const handleAddToCart = (product: Product, fromPrescription?: Prescription) => {
    if (product.stock <= 0 && !cartItems.find(item => item.product.id === product.id)) {
      toast({ title: "Sin Stock", description: `${product.name} no tiene unidades disponibles.`, variant: "destructive" });
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id && !item.prescriptionDetails); // Don't merge with prescribed items
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast({ title: "Stock Máximo Alcanzado", variant: "default" });
          return prevItems;
        }
        return prevItems.map(item =>
          item.product.id === product.id && !item.prescriptionDetails ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice } : item
        );
      }
      
      const prescriptionDetailsText = fromPrescription 
        ? `Receta del ${format(parseISO(fromPrescription.date), 'dd/MM/yy')}: OD Esf ${fromPrescription.sphericalOD || '-'} / OS Esf ${fromPrescription.sphericalOS || '-'}` 
        : product.requiresPrescription ? 'Receta Manual Requerida' : undefined;

      const newItem: OrderItem = {
        product: product,
        quantity: 1,
        unitPrice: product.price,
        subtotal: product.price,
        prescriptionDetails: prescriptionDetailsText,
      };
      
      if (product.tag && product.tag !== 'Ninguna') {
        const tagConfig = getTagConfig(product.tag);
        
        if (tagConfig && tagConfig.discountPercentage > 0) {
          const discountPercentage = tagConfig.discountPercentage;
          const discountReason = `Oferta Etiqueta ${tagConfig.name} (${discountPercentage}%)`;
          const originalItemTotal = newItem.unitPrice * newItem.quantity;
          const amountApplied = originalItemTotal * (discountPercentage / 100);
          
          newItem.discount = {
            type: 'percentage',
            value: discountPercentage,
            reason: discountReason,
            amountApplied: amountApplied,
          };
          
          toast({
            title: "Descuento Automático Aplicado",
            description: `${discountReason} aplicado a ${product.name}.`,
          });
        }
      }

      return [...prevItems, newItem];
    });
  };

  const handleUpdateCartQuantity = (productId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr, 10);
    if (isNaN(newQuantity) || newQuantity < 0) return;
    setCartItems(prev => prev.map(item => {
        if (item.product.id === productId) {
          if (newQuantity === 0) return null;
          if (newQuantity > item.product.stock) {
            toast({ title: "Stock Insuficiente", description: `Solo hay ${item.product.stock} unidades de ${item.product.name}.`, variant: "destructive" });
            return { ...item, quantity: item.product.stock, subtotal: item.product.stock * item.unitPrice };
          }
          return { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice };
        }
        return item;
      }).filter(Boolean) as OrderItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  const handleClearCart = () => setCartItems([]);

  const handleOpenDiscountModal = (item: OrderItem) => {
    setItemToDiscount(item);
    setIsDiscountModalOpen(true);
  };

  const applyDiscountToItem = (values: ItemDiscountFormValues) => {
    if (!itemToDiscount) return;
    const originalItemTotal = itemToDiscount.unitPrice * itemToDiscount.quantity;
    let amountApplied = 0;
    if(values.type === 'fixed') {
        amountApplied = Math.min(values.value, originalItemTotal);
    } else {
        amountApplied = originalItemTotal * (values.value / 100);
    }

    setCartItems(prev => prev.map(item => 
      item.product.id === itemToDiscount.product.id ? { ...item, discount: { ...values, amountApplied } } : item
    ));
    toast({ title: "Descuento Aplicado" });
    setIsDiscountModalOpen(false);
  };

  const removeDiscountFromItem = () => {
    if (!itemToDiscount) return;
    setCartItems(prev => prev.map(item => 
      item.product.id === itemToDiscount.product.id ? { ...item, discount: undefined } : item
    ));
    toast({ title: "Descuento Eliminado" });
    setIsDiscountModalOpen(false);
  };

  const canProcessSale = useMemo(() => {
    if (cartItems.length === 0 || isCashBoxClosed) return false;
    
    // Proforma doesn't need a specific customer
    if (invoiceType === 'proforma_invoice') return true;

    // FE requires a specific customer
    if (isFacturaElectronica && isGenericCustomer) return false;
    
    return true;
  }, [cartItems.length, isCashBoxClosed, isFacturaElectronica, isGenericCustomer, invoiceType]);
  
  const handleInitiatePayment = useCallback(() => {
    if (!canProcessSale) {
      if(isFacturaElectronica && isGenericCustomer){
        toast({ title: "Cliente Inválido", description: "Debe seleccionar un cliente específico para emitir una Factura Electrónica.", variant: "destructive" });
      } else if (cartItems.length === 0) {
         toast({ title: "Carrito vacío", description: "Añada productos para procesar la venta.", variant: "default"});
      }
      return;
    }
    setPaymentLines([]);
    setCurrentPaymentAmount(remainingBalance > 0 ? remainingBalance.toFixed(2) : ""); 
    setCurrentPaymentMethod("cash");
    setCurrentPaymentReference("");
    setIsPaymentModalOpen(true);
  }, [canProcessSale, isFacturaElectronica, isGenericCustomer, cartItems.length, toast, remainingBalance]);

  const handleAddPaymentLine = () => {
    const amount = parseFloat(currentPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Monto Inválido", description: "Ingrese un monto válido para el pago.", variant: "default"});
      return;
    }
    if (amount > remainingBalance + 0.001) { 
        toast({ title: "Monto Excede Saldo", description: `El monto ingresado (¢${amount.toLocaleString('es-CR')}) es mayor que el saldo pendiente (¢${remainingBalance.toLocaleString('es-CR')}).`, variant: "default"});
        return;
    }
    const selectedMethodDetails = paymentMethodOptions.find(pm => pm.value === currentPaymentMethod);
    if (selectedMethodDetails?.requiresReference && !currentPaymentReference.trim()) {
        toast({ title: "Referencia Requerida", description: `El método de pago ${selectedMethodDetails.label} requiere un número de referencia.`, variant: "default"});
        return;
    }

    const newPaymentLine = {
      id: Date.now().toString(),
      method: currentPaymentMethod,
      amount,
      reference: selectedMethodDetails?.requiresReference ? currentPaymentReference : undefined,
    };
    setPaymentLines(prev => [...prev, newPaymentLine]);
    
    const newRemaining = remainingBalance - amount;
    setCurrentPaymentAmount(newRemaining > 0 ? newRemaining.toFixed(2) : ""); 
    setCurrentPaymentReference("");
  };

  const handleRemovePaymentLine = (lineId: string) => {
    setPaymentLines(prev => prev.filter(line => line.id !== lineId));
    const newTotalPaid = paymentLines.filter(line => line.id !== lineId).reduce((sum, line) => sum + line.amount, 0);
    const newRemainingBalance = montoTotalFactura - newTotalPaid;
    setCurrentPaymentAmount(newRemainingBalance > 0 ? newRemainingBalance.toFixed(2) : "");
  };
  
  const handleSaveProforma = async () => {
    if (cartItems.length === 0) {
        toast({ title: "Carrito vacío", description: "Añada productos para crear una proforma."});
        return;
    }

    const newOrder: Order = {
        id: `prof-${Date.now()}`,
        orderNumber: `PROF-${format(new Date(), 'yyMMdd-HHmmss')}`,
        items: cartItems,
        customer: selectedCustomer,
        subtotalOriginalCRC: cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        itemsDiscountAmountCRC: montoTotalDescuento,
        subtotalAfterItemDiscountsCRC: montoTotalGravadoBase,
        orderDiscountAmountCRC: 0,
        baseForTaxCRC: montoTotalGravadoBase,
        taxAmountCRC: montoTotalIVA,
        totalCRC: montoTotalFactura,
        payments: [], // NO PAYMENTS
        amountPaidTotalCRC: 0,
        balanceDueCRC: montoTotalFactura,
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        documentTypeGenerated: 'proforma_invoice',
        sellerName: userName,
    };
    const savedOrder = await saveOrder(newOrder);
    setLastCompletedOrder(savedOrder);
    setIsInvoiceModalOpen(true);
    handleClearCart();
    const genericCustomer = { id: '0', name: 'Consumidor Final', identification: '0000000000', identificationType: "Otro" as const };
    setSelectedCustomer(genericCustomer);
    toast({ 
        title: "Proforma Guardada", 
        description: `Se ha generado la proforma ${savedOrder.orderNumber}`,
        action: (
          <ToastAction altText="Ver/Imprimir" onClick={() => {
            setLastCompletedOrder(savedOrder);
            setIsInvoiceModalOpen(true);
          }}>
            Ver/Imprimir
          </ToastAction>
        ),
    });
  };

  const handleProcessPayment = async () => {
    if (paymentLines.length === 0) {
      toast({ title: "Pago Requerido", description: `Debe registrar al menos un pago para procesar la venta.`, variant: "default" });
      return;
    }

    const prefix = documentTypePrefixes[invoiceType] || 'ORD';

    const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: `${prefix}-${format(new Date(), 'yyMMdd-HHmmss')}`,
        items: cartItems,
        customer: selectedCustomer,
        subtotalOriginalCRC: cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        itemsDiscountAmountCRC: montoTotalDescuento,
        subtotalAfterItemDiscountsCRC: montoTotalGravadoBase,
        orderDiscountAmountCRC: 0,
        baseForTaxCRC: montoTotalGravadoBase,
        taxAmountCRC: montoTotalIVA,
        totalCRC: montoTotalFactura,
        payments: paymentLines.map(line => ({
          method: line.method,
          amountCRC: line.amount,
          reference: line.reference
        })),
        amountPaidTotalCRC: totalPaid,
        balanceDueCRC: Math.max(0, remainingBalance),
        status: remainingBalance > 0.001 ? 'partially_paid' : 'completed',
        createdAt: new Date().toISOString(),
        documentTypeGenerated: invoiceType,
        sellerName: userName,
    };
    const savedOrder = await saveOrder(newOrder);
    localStorage.setItem('videreLastGeneratedDocument', JSON.stringify({
        orderNumber: savedOrder.orderNumber,
        documentType: documentTypeLabels[savedOrder.documentTypeGenerated || 'electronic_ticket'],
        customerName: savedOrder.customer?.name,
        totalCRC: savedOrder.totalCRC,
        timestamp: new Date().toISOString()
    }));
    setLastCompletedOrder(savedOrder);
    setIsInvoiceModalOpen(true);
    handleClearCart();
    setPaymentLines([]);
    const genericCustomer = { id: '0', name: 'Consumidor Final', identification: '0000000000', identificationType: "Otro" as const };
    setSelectedCustomer(genericCustomer);
    toast({ 
        title: "Venta Guardada", 
        description: `Se ha generado la orden ${savedOrder.orderNumber}`,
        action: (
          <ToastAction altText="Reimprimir" onClick={() => {
            setLastCompletedOrder(savedOrder);
            setIsInvoiceModalOpen(true);
          }}>
            Reimprimir
          </ToastAction>
        ),
    });
    setIsPaymentModalOpen(false);

    // After successful sale, check if lab order is needed
    const requiresLabOrder = savedOrder.items.some(item => {
      const cat = item.product.category.toLowerCase();
      return (cat.includes('oftálmico') || cat.includes('armazon') || cat.includes('armazones')) && !cat.includes('contacto');
    });
    
    if ((savedOrder.documentTypeGenerated === 'electronic_invoice' || savedOrder.documentTypeGenerated === 'electronic_ticket' || savedOrder.documentTypeGenerated === 'internal_sale_receipt') && requiresLabOrder) {
        setOrderForLab(savedOrder);
        setIsLabOrderModalOpen(true);
    }
  };
  
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return [];
    const term = productSearchTerm.toLowerCase();
    return products.filter(p =>
      (p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term)))
    );
  }, [productSearchTerm, products]);

  const handleImportLatestPrescription = () => {
    if (!selectedCustomer || selectedCustomer.id === '0') {
        toast({ variant: 'destructive', title: 'Error', description: 'Debe seleccionar un paciente específico.' });
        return;
    }
    const patient = patients.find(p => p.id === selectedCustomer.id);
    if (!patient) return;

    const allPrescriptions = patient.clinicalHistory?.flatMap(h => h.prescriptions || []) || [];
    if (allPrescriptions.length === 0) {
        toast({ title: 'Sin Prescripciones', description: 'Este paciente no tiene prescripciones en su historial.' });
        return;
    }

    const mostRecentPrescription = allPrescriptions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    toast({
      title: "Prescripción Importada",
      description: `Se ha añadido la prescripción más reciente del ${format(parseISO(mostRecentPrescription.date), 'dd/MM/yy')}.`,
    });

    const prescriptionProduct: Product = {
      id: `presc-${mostRecentPrescription.id}`,
      name: `Lentes Recetados (${format(parseISO(mostRecentPrescription.date), 'dd/MM/yy')})`,
      description: mostRecentPrescription.optometristNotes,
      price: 0,
      stock: 999,
      category: "Servicios",
      ivaRate: 0.13,
      requiresPrescription: true,
    };
    handleAddToCart(prescriptionProduct, mostRecentPrescription);
  };
  
    const handleSelectCustomerFromModal = (customer: Patient) => {
        setSelectedCustomer({
            id: customer.id,
            name: `${customer.firstName} ${customer.lastName}`,
            identification: customer.personalId,
            identificationType: customer.identificationType,
            email: customer.email,
            phone: customer.phone,
        });
        setCustomerLoyaltyPoints(0);
        setIsCustomerSearchModalOpen(false);
    };

    const handleUseGenericCustomer = () => {
        setSelectedCustomer({ id: '0', name: 'Consumidor Final', identification: '0000000000', identificationType: "Otro" });
        setCustomerLoyaltyPoints(0);
        setIsCustomerSearchModalOpen(false);
    };

    const handleOpenBox = () => {
      const amount = parseFloat(initialCash);
      if (isNaN(amount) || amount < 0) {
        toast({ title: "Monto Inválido", description: "Ingrese un monto de apertura válido.", variant: "destructive" });
        return;
      }
      openCashBox();
      toast({ title: "Caja Abierta", description: `La sesión de caja ha comenzado con ¢${amount.toLocaleString('es-CR')}.` });
      setIsOpeningModalOpen(false);
    };

  return (
    <TooltipProvider>
    <div className="h-[calc(100vh-theme(spacing.24))] flex flex-col space-y-3 p-4">
      {isCashBoxClosed && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Caja Cerrada</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            No se pueden procesar ventas. Debe abrir la caja para iniciar.
            <Button size="sm" onClick={() => setIsOpeningModalOpen(true)}>Abrir Caja</Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Left Pane */}
        <div className="flex-1 flex flex-col gap-4">
            <Card className="shadow-md rounded-lg">
                <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                    <div>
                        <label htmlFor="productSearchTerm" className="text-xs font-medium">Búsqueda Producto</label>
                        <div className="flex">
                            <Input id="productSearchTerm" value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} placeholder="Nombre, SKU..." />
                            <Button variant="ghost" size="icon" className="text-muted-foreground"><Search className="h-5 w-5"/></Button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="barcodeSearch" className="text-xs font-medium">Código de Barras</label>
                        <div className="flex">
                            <Input id="barcodeSearch" value={barcodeSearch} onChange={e => setBarcodeSearch(e.target.value)} placeholder="Escanear o digitar..." />
                            <Button variant="ghost" size="icon" className="text-muted-foreground"><Barcode className="h-5 w-5"/></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="flex-1 shadow-md rounded-lg overflow-hidden flex flex-col">
                <CardHeader className="p-3 border-b"><CardTitle className="text-base text-primary flex items-center justify-between"><div className="flex items-center gap-2"><PackageSearch className="mr-2 h-5 w-5"/>Resultados de Búsqueda</div></CardTitle></CardHeader>
                <CardContent className="p-0 flex-grow overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10"><TableRow><TableHead className="w-[60px] pl-2">Imagen</TableHead><TableHead>Producto</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="w-[100px] text-center pr-2">Acción</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filteredProducts.map(p => (<TableRow key={p.id}><TableCell className="pl-2"><Image src={p.imageUrl || "https://placehold.co/40x40.png"} alt={p.name} width={40} height={40} className="rounded" data-ai-hint={p.dataAiHint || 'product image'} /></TableCell><TableCell className="font-medium text-xs">{p.name}</TableCell><TableCell className="text-right text-xs">¢{p.price.toLocaleString('es-CR')}</TableCell><TableCell className="text-right text-xs">{p.stock}</TableCell><TableCell className="text-center pr-2"><Button size="sm" onClick={() => handleAddToCart(p)}>Añadir</Button></TableCell></TableRow>))}
                             {productSearchTerm.trim() && filteredProducts.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground"> No se encontraron productos. </TableCell></TableRow>
                            )}
                             {!productSearchTerm.trim() && (
                                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground"> Ingrese un término de búsqueda para ver productos. </TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        {/* Right Pane */}
        <div className="w-full lg:w-[480px] flex-shrink-0 flex flex-col gap-4">
            <Card className="shadow-md rounded-lg">
                <CardContent className="p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3 items-end">
                       <div>
                            <label htmlFor="customerName" className="text-xs font-medium">Cliente</label>
                            <div className="flex gap-1">
                                <Input id="customerName" value={selectedCustomer?.name || ''} readOnly className="h-9 bg-muted/50"/>
                                <Button onClick={() => setIsCustomerSearchModalOpen(true)} variant="outline" size="icon" title="Buscar/Añadir Cliente" className="h-9 w-9"><UserSearch className="h-5 w-5"/></Button>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="invoiceType" className="text-xs font-medium">Tipo Documento</label>
                            <Select value={invoiceType} onValueChange={(value) => setInvoiceType(value as DocumentType)}>
                                <SelectTrigger id="invoiceType" className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="electronic_ticket">Tiquete Electrónico</SelectItem>
                                    <SelectItem value="electronic_invoice">Factura Electrónica</SelectItem>
                                    <SelectItem value="internal_sale_receipt">FACTURA DE VENTA</SelectItem>
                                    <SelectItem value="proforma_invoice">Factura Proforma</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {customerLoyaltyPoints > 0 && (
                        <div className="flex items-center text-sm text-green-600 gap-1 mt-1">
                            <Award className="h-4 w-4"/> {customerLoyaltyPoints} Puntos Disponibles
                        </div>
                    )}
                     <Button variant="outline" size="sm" className="w-full" onClick={handleImportLatestPrescription} disabled={isGenericCustomer}><FileText className="h-4 w-4 mr-2"/>Importar Última Prescripción</Button>
                    {isFacturaElectronica && isGenericCustomer && (<Alert variant="destructive" className="p-2 text-xs"><AlertTriangle className="h-4 w-4" /><AlertTitle className="font-semibold">Acción Requerida</AlertTitle><AlertDescription>Para emitir Factura Electrónica, debe seleccionar un cliente específico.</AlertDescription></Alert>)}
                </CardContent>
            </Card>

            <Card className="flex-1 shadow-md rounded-lg overflow-hidden flex flex-col">
                <CardHeader className="p-3 border-b"><CardTitle className="text-base text-primary flex items-center gap-2"><ShoppingCart className="h-5 w-5"/>Venta Actual</CardTitle></CardHeader>
                <ScrollArea className="flex-grow">
                 <CardContent className="p-0">
                    <Table>
                        <TableHeader><TableRow><TableHead className="pl-2">Producto</TableHead><TableHead className="text-center">Cant.</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-center pr-2"></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {updatedCartItems.map(item => {
                                const isTagDiscount = item.discount?.reason?.includes('Etiqueta');
                                return (
                                <TableRow key={item.product.id}>
                                    <TableCell className="font-medium text-xs pl-2">
                                        {item.product.name}
                                        {item.prescriptionDetails && <p className="text-xs text-blue-600 italic whitespace-pre-wrap mt-1">{item.prescriptionDetails}</p>}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={0}>
                                                    <Button size="xs" variant="link" className="h-auto p-0 text-xs disabled:cursor-not-allowed disabled:no-underline disabled:opacity-70" onClick={() => !isTagDiscount && handleOpenDiscountModal(item)} disabled={isTagDiscount}>
                                                        {item.discount ? (isTagDiscount ? 'Oferta Aplicada' : 'Editar Descuento') : 'Aplicar Descuento'}
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            {isTagDiscount && <TooltipContent><p>No se pueden aplicar más descuentos a ofertas de etiqueta.</p></TooltipContent>}
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell><Input type="number" className="h-8 text-center" value={item.quantity} onChange={e => handleUpdateCartQuantity(item.product.id, e.target.value)} /></TableCell>
                                    <TableCell className="text-right text-xs">¢{(item.lineTotalWithTax || 0).toLocaleString('es-CR')}</TableCell>
                                    <TableCell className="text-center pr-2"><Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.product.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                                </TableRow>
                                );
                            })}
                             {updatedCartItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                El carrito está vacío.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                    </Table>
                 </CardContent>
                </ScrollArea>
                {cartItems.length > 0 && (
                    <CardFooter className="p-3 border-t flex flex-col gap-2">
                        <div className="w-full text-sm font-bold text-lg text-primary flex justify-between"><span>Total:</span><span>¢{montoTotalFactura.toLocaleString('es-CR')}</span></div>
                        <div className="w-full flex gap-2 mt-2">
                            <Button variant="outline" className="flex-1" onClick={handleClearCart}>Limpiar</Button>
                            <Button 
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" 
                                onClick={invoiceType === 'proforma_invoice' ? handleSaveProforma : handleInitiatePayment} 
                                disabled={!canProcessSale}
                            >
                                {invoiceType === 'proforma_invoice' ? 'Guardar Proforma' : 'Facturar'}
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
      </div>
      
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-primary flex items-center gap-2"><Banknote className="h-6 w-6"/>Procesar Pago</DialogTitle>
                <DialogDescription>
                Total a Pagar: <span className="font-bold text-lg">¢{montoTotalFactura.toLocaleString('es-CR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </DialogDescription>
            </DialogHeader>
            <div className="text-sm text-center text-muted-foreground -mt-2">
                Añada uno o más métodos de pago hasta cubrir el total.
            </div>
            <div className="space-y-4 py-4">
                {paymentLines.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Pagos Registrados:</Label>
                    <div className="border rounded-md max-h-32 overflow-y-auto">
                    {paymentLines.map((line) => (
                        <div key={line.id} className="flex justify-between items-center p-2 text-xs border-b last:border-b-0">
                        <div className="flex items-center gap-2">
                            {React.createElement(paymentMethodOptions.find(pm => pm.value === line.method)?.icon || Settings2, { className: "h-4 w-4 text-muted-foreground" })}
                            <span>{paymentMethodOptions.find(pm => pm.value === line.method)?.label}: ¢{line.amount.toLocaleString('es-CR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            {line.reference && <span className="text-muted-foreground truncate" title={line.reference}> (Ref: {line.reference})</span>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemovePaymentLine(line.id)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                        </div>
                    ))}
                    </div>
                </div>
                )}

                {remainingBalance > 0.001 && (
                <Card className="p-4 bg-muted/30">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <Label htmlFor="paymentMethod">Método de Pago</Label>
                            <Select value={currentPaymentMethod} onValueChange={(value: PaymentMethodType) => {setCurrentPaymentMethod(value); setCurrentPaymentReference("");}}>
                                <SelectTrigger id="paymentMethod"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                {paymentMethodOptions.map(pm => <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="paymentAmount">Monto (¢)</Label>
                            <Input id="paymentAmount" type="number" placeholder="Monto a pagar" value={currentPaymentAmount} onChange={e => setCurrentPaymentAmount(e.target.value)} />
                        </div>
                    </div>
                    {paymentMethodOptions.find(pm => pm.value === currentPaymentMethod)?.requiresReference && (
                        <div>
                            <Label htmlFor="paymentReference">Referencia</Label>
                            <Input id="paymentReference" placeholder="Nº de Ref. o Lote" value={currentPaymentReference} onChange={e => setCurrentPaymentReference(e.target.value)}/>
                        </div>
                    )}
                    <Button onClick={handleAddPaymentLine} className="w-full mt-3" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4"/> Añadir Pago
                    </Button>
                </Card>
                )}
                
                <Separator className="my-2"/>
                <div className="flex justify-between text-sm font-semibold">
                <span>Total Pagado:</span>
                <span>¢{totalPaid.toLocaleString('es-CR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className={`flex justify-between text-base font-bold ${remainingBalance > 0.001 ? 'text-destructive' : 'text-green-600'}`}>
                <span>Saldo Pendiente:</span>
                <span>¢{remainingBalance.toLocaleString('es-CR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                {remainingBalance < -0.001 && (
                    <div className="text-sm font-semibold text-primary">
                        Vuelto: ¢{(-remainingBalance).toLocaleString('es-CR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleProcessPayment} disabled={paymentLines.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Confirmar Venta
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCustomerSearchModalOpen} onOpenChange={setIsCustomerSearchModalOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Buscar Paciente</DialogTitle></DialogHeader>
            <Input 
              placeholder="Buscar por nombre, cédula..." 
              value={customerSearchTermModal} 
              onChange={e => setCustomerSearchTermModal(e.target.value)} 
            />
            <ScrollArea className="h-64">
                <Table>
                    <TableBody>
                        {patients
                            .filter(p => {
                                const lowerTerm = customerSearchTermModal.toLowerCase();
                                if (!lowerTerm) return true;
                                return `${p.firstName} ${p.lastName}`.toLowerCase().includes(lowerTerm) ||
                                    (p.personalId && p.personalId.includes(lowerTerm)) ||
                                    (p.phone && p.phone.includes(lowerTerm));
                            })
                            .map(p=>(
                            <TableRow key={p.id}>
                                <TableCell>{p.firstName} {p.lastName}</TableCell>
                                <TableCell>{p.personalId}</TableCell>
                                <TableCell>
                                    <Button size="sm" onClick={() => handleSelectCustomerFromModal(p)}>
                                        Seleccionar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
            <DialogFooter><Button onClick={handleUseGenericCustomer}>Usar Cliente Genérico</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {itemToDiscount && <ItemDiscountModal isOpen={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen} item={itemToDiscount} form={discountForm} onApply={applyDiscountToItem} onRemove={removeDiscountFromItem} />}
      {lastCompletedOrder && <InvoiceModal isOpen={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen} order={lastCompletedOrder} />}
      <LabOrderDialog
        isOpen={isLabOrderModalOpen}
        onOpenChange={setIsLabOrderModalOpen}
        patients={patients}
        onOrderCreated={(newLabOrder) => {
            toast({ title: 'Orden de Laboratorio Creada', description: `La orden ${newLabOrder.orderNumber} se ha registrado exitosamente.`});
        }}
        order={orderForLab}
      />

      <Dialog open={isOpeningModalOpen} onOpenChange={setIsOpeningModalOpen}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-headline text-primary flex items-center gap-2">
                        <ArchiveRestore className="h-6 w-6"/>
                        Apertura de Caja
                    </DialogTitle>
                    <DialogDescription>
                        Ingresa el monto inicial en efectivo para comenzar la sesión de ventas.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="initialCash">Monto Inicial en Efectivo (¢)</Label>
                    <Input
                        id="initialCash"
                        type="number"
                        placeholder="Ej: 50000"
                        value={initialCash}
                        onChange={(e) => setInitialCash(e.target.value)}
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleOpenBox}>
                        Confirmar y Abrir Caja
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
    </TooltipProvider>
  );
};
export default SalesPage;
