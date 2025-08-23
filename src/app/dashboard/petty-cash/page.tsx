
"use client";

import { useState, useMemo, useEffect } from "react";
import type { PettyCashExpense, PettyCashLiquidation } from "@/types/petty-cash";
import { pettyCashCategories } from "@/types/petty-cash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Coins, ClipboardList, CheckCircle, FileDown, Printer, History, PiggyBank, Receipt } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Separator } from "@/components/ui/separator";
import { usePettyCashStore } from "@/hooks/use-petty-cash-store";
import { Progress } from "@/components/ui/progress";
import { getSuppliers } from '@/services/supplier-service';
import type { Supplier } from '@/types/supplier';

// Client-side Date Formatting Component to prevent hydration errors
const ClientFormattedDate = ({ dateString }: { dateString?: string }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    if (dateString) {
      const dateToParse = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
      setFormattedDate(new Date(dateToParse).toLocaleDateString());
    }
  }, [dateString]);

  return <>{formattedDate}</>;
};


export default function PettyCashPage() {
    const { currentUser } = useCurrentUser();
    const { toast } = useToast();
    const { fundAmount } = usePettyCashStore();
    const [expenses, setExpenses] = useState<PettyCashExpense[]>([]);
    const [liquidations, setLiquidations] = useState<PettyCashLiquidation[]>([]);
    
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    
    // Form state
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState(pettyCashCategories[0].value);
    const [supplierName, setSupplierName] = useState("");
    const [documentNumber, setDocumentNumber] = useState("");
    
    // Modal state
    const [isLiquidationModalOpen, setIsLiquidationModalOpen] = useState(false);
    
    useEffect(() => {
        async function loadData() {
            const fetchedSuppliers = await getSuppliers();
            setSuppliers(fetchedSuppliers);
        }
        loadData();
    }, []);

    const pendingExpenses = useMemo(() => expenses.filter(e => e.status === 'pending'), [expenses]);
    const pendingTotal = useMemo(() => pendingExpenses.reduce((sum, e) => sum + e.amount, 0), [pendingExpenses]);
    const availableBalance = useMemo(() => fundAmount - pendingTotal, [fundAmount, pendingTotal]);
    const balancePercentage = useMemo(() => (fundAmount > 0 ? (availableBalance / fundAmount) * 100 : 0), [availableBalance, fundAmount]);

    const handleAddExpense = () => {
        const parsedAmount = parseFloat(amount);
        if (!description || isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({ title: "Datos inválidos", description: "Descripción y un monto positivo son requeridos.", variant: "destructive" });
            return;
        }

        if (parsedAmount > availableBalance) {
            toast({ title: "Saldo Insuficiente", description: `El gasto de ¢${parsedAmount.toLocaleString('es-CR')} excede el saldo disponible de ¢${availableBalance.toLocaleString('es-CR')}.`, variant: "destructive" });
            return;
        }

        const newExpense: PettyCashExpense = {
            id: `pc${Date.now()}`,
            date: new Date().toISOString(),
            description,
            amount: parsedAmount,
            category,
            status: "pending",
            createdBy: currentUser.name,
            supplierName: supplierName || undefined,
            documentNumber: documentNumber || undefined,
        };

        setExpenses(prev => [...prev, newExpense]);
        toast({ title: "Gasto de Caja Chica Añadido" });
        
        // Reset form
        setDescription("");
        setAmount("");
        setSupplierName("");
        setDocumentNumber("");
    };

    const handleDeleteExpense = (id: string) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
        toast({ title: "Gasto Eliminado" });
    };

    const handleConfirmLiquidation = () => {
        if (pendingExpenses.length === 0) return;

        const newLiquidation: PettyCashLiquidation = {
            id: `li${Date.now()}`,
            liquidationDate: new Date().toISOString(),
            totalAmount: pendingTotal,
            responsibleUser: currentUser.name,
            expenseIds: pendingExpenses.map(e => e.id),
            createdAt: new Date().toISOString(),
            // These would be calculated and stored in a real system
            initialAmount: fundAmount,
            finalBalance: availableBalance,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
        };

        setLiquidations(prev => [newLiquidation, ...prev]);
        setExpenses(prev => prev.map(e => e.status === 'pending' ? { ...e, status: 'liquidated', liquidationId: newLiquidation.id } : e));
        
        toast({ title: "Caja Chica Liquidada", description: `Se liquidó un total de ¢${pendingTotal.toLocaleString('es-CR')}. Recuerde reponer el fondo.` });
        setIsLiquidationModalOpen(false);
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-primary font-headline flex items-center gap-2">
                <Coins className="h-8 w-8" />
                Control de Caja Chica
            </h1>
            <CardDescription>
                Registre pequeños gastos diarios y realice liquidaciones periódicas para reponer el fondo. El fondo se define en la página de Configuración.
            </CardDescription>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-lg rounded-xl">
                        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><PlusCircle className="h-5 w-5"/>Registrar Nuevo Gasto</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="description">Descripción del Gasto*</Label>
                                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Compra de agua"/>
                            </div>
                            <div>
                                <Label htmlFor="amount">Monto (¢)*</Label>
                                <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ej: 3000"/>
                            </div>
                            <div>
                                <Label htmlFor="category">Categoría*</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {pettyCashCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="supplierName">Proveedor (Opcional)</Label>
                                <Input 
                                    id="supplierName" 
                                    value={supplierName} 
                                    onChange={(e) => setSupplierName(e.target.value)} 
                                    placeholder="Escriba o seleccione un proveedor"
                                    list="suppliers-datalist-petty-cash"
                                />
                                <datalist id="suppliers-datalist-petty-cash">
                                    {suppliers.map(sup => (
                                        <option key={sup.id} value={sup.name} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <Label htmlFor="documentNumber">Nº Documento/Factura (Opcional)</Label>
                                <Input 
                                    id="documentNumber" 
                                    value={documentNumber} 
                                    onChange={(e) => setDocumentNumber(e.target.value)} 
                                    placeholder="Ej: FACT-00123"
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleAddExpense} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Gasto
                            </Button>
                        </CardFooter>
                    </Card>

                     <Card className="shadow-lg rounded-xl">
                        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><PiggyBank className="h-5 w-5"/>Resumen de Caja Chica</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Fondo Total:</span>
                                <span className="font-semibold">¢{fundAmount.toLocaleString('es-CR')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Gastos Pendientes:</span>
                                <span className="font-semibold text-destructive">- ¢{pendingTotal.toLocaleString('es-CR')}</span>
                            </div>
                             <Separator />
                            <div className="flex justify-between font-bold text-base">
                                <span className="text-primary">Saldo Disponible:</span>
                                <span className="text-primary">¢{availableBalance.toLocaleString('es-CR')}</span>
                            </div>
                            <div>
                                <Progress value={balancePercentage} className="h-2 mt-1" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-2 shadow-lg rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center gap-2">
                            <ClipboardList className="h-5 w-5"/>
                            Gastos Pendientes de Liquidar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto max-h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="text-right">Monto (¢)</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingExpenses.length > 0 ? pendingExpenses.map(exp => (
                                        <TableRow key={exp.id}>
                                            <TableCell><ClientFormattedDate dateString={exp.date} /></TableCell>
                                            <TableCell className="font-medium">
                                                {exp.description}
                                                {(exp.supplierName || exp.documentNumber) && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {exp.supplierName && <span>Prov: {exp.supplierName}</span>}
                                                        {exp.supplierName && exp.documentNumber && <span> | </span>}
                                                        {exp.documentNumber && <span>Doc: {exp.documentNumber}</span>}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{pettyCashCategories.find(c => c.value === exp.category)?.label || exp.category}</TableCell>
                                            <TableCell className="text-right">{exp.amount.toLocaleString('es-CR')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleDeleteExpense(exp.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No hay gastos pendientes.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                     <CardFooter className="flex flex-col sm:flex-row justify-between items-center bg-muted/50 p-4">
                        <div className="text-lg font-bold">
                            Total a Liquidar: <span className="text-destructive">¢{pendingTotal.toLocaleString('es-CR')}</span>
                        </div>
                        <Button onClick={() => setIsLiquidationModalOpen(true)} disabled={pendingExpenses.length === 0}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Liquidar Gastos
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            
            <Separator className="my-8" />
            
            <Card className="shadow-lg rounded-xl">
                 <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2">
                        <History className="h-5 w-5"/>
                        Historial de Liquidaciones
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha Liquidación</TableHead>
                                <TableHead>Responsable</TableHead>
                                <TableHead className="text-right">Monto Total (¢)</TableHead>
                                <TableHead className="text-right">Nº de Gastos</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {liquidations.length > 0 ? liquidations.map(liq => (
                                <TableRow key={liq.id}>
                                    <TableCell><ClientFormattedDate dateString={liq.liquidationDate} /></TableCell>
                                    <TableCell>{liq.responsibleUser}</TableCell>
                                    <TableCell className="text-right font-semibold">{liq.totalAmount.toLocaleString('es-CR')}</TableCell>
                                    <TableCell className="text-right">{liq.expenseIds.length}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="link" size="sm">Ver Detalle</Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No hay liquidaciones registradas.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isLiquidationModalOpen} onOpenChange={setIsLiquidationModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-primary">Confirmar Liquidación de Caja Chica</DialogTitle>
                        <DialogDescription>
                            Está a punto de liquidar {pendingExpenses.length} gastos por un total de ¢{pendingTotal.toLocaleString('es-CR')}. Esta acción generará un reporte y marcará los gastos como liquidados.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-60 overflow-y-auto my-4 border p-2 rounded-md">
                        <ul className="text-sm space-y-1">
                            {pendingExpenses.map(e => (
                                <li key={e.id} className="flex justify-between">
                                    <span className="truncate pr-2">{e.description}</span>
                                    <span className="font-mono whitespace-nowrap">¢ {e.amount.toLocaleString('es-CR')}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLiquidationModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmLiquidation} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            Confirmar y Liquidar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
