import { useEffect, useState } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2, ShoppingBag, Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const itemSchema = z.object({
  produto_id: z.string().min(1, "Selecione um produto"),
  qtd_comprada: z.coerce.number().min(1, "Mínimo 1"),
  custo_unitario: z.coerce.number().min(0.01, "Maior que 0"),
})

const formSchema = z.object({
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item"),
})

interface Produto {
  id: number
  nome: string
}

interface HistoricoCompra {
  id: number
  data_compra: string
  produto_nome: string
  qtd_comprada: number
  custo_unitario: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const formatDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Compras() {
  const hoje = new Date()
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

  const [historico, setHistorico] = useState<HistoricoCompra[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  
  const [startDate, setStartDate] = useState(formatDateString(primeiroDia))
  const [endDate, setEndDate] = useState(formatDateString(ultimoDia))
  const [appliedStartDate, setAppliedStartDate] = useState(formatDateString(primeiroDia))
  const [appliedEndDate, setAppliedEndDate] = useState(formatDateString(ultimoDia))
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ title: string, message: string, isError: boolean } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      itens: [{ produto_id: "", qtd_comprada: 1, custo_unitario: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control as any,
    name: "itens",
  })

  const watchItens = useWatch({
    control: form.control as any,
    name: "itens",
  })

  const totalGeral = watchItens?.reduce((acc: number, item: any) => {
    return acc + (Number(item?.qtd_comprada || 0) * Number(item?.custo_unitario || 0))
  }, 0) || 0;

  const fetchDados = async () => {
    setIsLoading(true)
    try {
      const [resHistorico, resProdutos] = await Promise.all([
        fetch('/api/compras').catch(() => null),
        fetch('/api/produtos').catch(() => null)
      ])

      if (resHistorico?.ok) {
        setHistorico(await resHistorico.json())
      }
      
      if (resProdutos?.ok) {
        setProdutos(await resProdutos.json())
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDados()
  }, [])

  const onSubmit = async (values: any) => {
    try {
      const payload = values.itens.map((item: any) => ({
        produto_id: parseInt(item.produto_id, 10),
        qtd_comprada: item.qtd_comprada,
        custo_unitario: item.custo_unitario
      }))

      const response = await fetch('/api/compras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsModalOpen(false)
        form.reset({ itens: [{ produto_id: "", qtd_comprada: 1, custo_unitario: 0 }] })
        fetchDados()
        setFeedback({
          title: "Compra Lançada",
          message: "A compra e os lotes foram registrados com sucesso no estoque.",
          isError: false
        })
      } else {
        const err = await response.json().catch(() => ({}))
        setFeedback({
          title: "Erro ao registrar compra",
          message: err.detail || "Ocorreu um problema ao salvar as informações.",
          isError: true
        })
      }
    } catch (error) {
      console.error("Erro na requisição:", error)
      setFeedback({
        title: "Erro de conexão",
        message: "Não foi possível conectar ao servidor.",
        isError: true
      })
    }
  }

  // Se fechar o modal, reseta o form
  useEffect(() => {
    if (!isModalOpen) {
      form.reset({ itens: [{ produto_id: "", qtd_comprada: 1, custo_unitario: 0 }] })
    }
  }, [isModalOpen, form])

  const handleFilter = () => {
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
  }

  const filteredHistorico = historico.filter(item => {
    const textMatch = item.produto_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const itemDate = item.data_compra.slice(0, 10);
    const dateMatch = itemDate >= appliedStartDate && itemDate <= appliedEndDate;
    return textMatch && dateMatch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#05204A]">Compras</h1>
          <p className="text-gray-500 mt-1">Registre a entrada de novos produtos e lotes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {/* Campo de Pesquisa Textual */}
          <div className="flex items-center bg-white px-3 py-2 rounded-md shadow-sm border border-gray-200 flex-1 md:w-48">
            <input 
              type="text" 
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-700 outline-none w-full"
            />
          </div>

          {/* Filtro de Datas */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-md shadow-sm border border-gray-200">
            <div className="flex flex-col px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-gray-400">Data Inicial</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer text-gray-700 font-medium outline-none"
              />
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex flex-col px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-gray-400">Data Final</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer text-gray-700 font-medium outline-none"
              />
            </div>
            <button 
              onClick={handleFilter}
              className="ml-1 mr-1 bg-[#093A3E] hover:bg-[#05204A] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Filtrar
            </button>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#093A3E] hover:bg-[#05204A] text-white">
              <Plus className="mr-2 h-4 w-4" /> Lançar Nova Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Nova Compra</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const itemQtd = Number(watchItens?.[index]?.qtd_comprada || 0)
                    const itemCusto = Number(watchItens?.[index]?.custo_unitario || 0)
                    const itemTotal = itemQtd * itemCusto
                    
                    return (
                      <div key={field.id} className="flex items-center gap-3 p-4 border rounded-md bg-gray-50/50">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
                          <FormField
                            control={form.control as any}
                            name={`itens.${index}.produto_id`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col mt-2">
                                <FormLabel>Produto</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "w-full justify-between bg-white font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value
                                          ? produtos.find((p) => p.id.toString() === field.value)?.nome
                                          : "Pesquisar produto..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Buscar por nome..." />
                                      <CommandList>
                                        <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                                        <CommandGroup>
                                          {produtos.map((produto) => (
                                            <CommandItem
                                              value={produto.nome}
                                              key={produto.id}
                                              onSelect={() => {
                                                form.setValue(`itens.${index}.produto_id`, produto.id.toString())
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  produto.id.toString() === field.value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                              {produto.nome}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control as any}
                            name={`itens.${index}.qtd_comprada`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Qtd</FormLabel>
                                <FormControl>
                                  <Input type="number" className="bg-white" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control as any}
                            name={`itens.${index}.custo_unitario`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custo Unit. (R$)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" className="bg-white" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center gap-3 mt-6">
                          <div className="text-right min-w-[100px]">
                            <span className="block text-xs text-gray-500 mb-1">Custo Total</span>
                            <span className="font-bold text-red-800">
                              {formatCurrency(itemTotal)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => append({ produto_id: "", qtd_comprada: 1, custo_unitario: 0 })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
                  </Button>
                </div>

                {form.formState.errors.itens?.root && (
                  <p className="text-sm text-red-500 text-center">
                    {form.formState.errors.itens.root.message}
                  </p>
                )}

                <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                  <div className="text-lg">
                    <span className="text-gray-600 mr-2">Total da Compra:</span>
                    <span className="font-bold text-red-800 text-xl">{formatCurrency(totalGeral)}</span>
                  </div>
                  <Button type="submit" className="bg-[#093A3E] hover:bg-[#05204A] px-8">
                    Salvar Compra
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Modal de Feedback (Sucesso/Erro) */}
        <Dialog open={feedback !== null} onOpenChange={(open) => !open && setFeedback(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className={cn("text-xl", feedback?.isError ? "text-red-600" : "text-[#05204A]")}>
                {feedback?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600 text-base">{feedback?.message}</p>
            </div>
            <div className="flex justify-end mt-2">
              <Button 
                variant={feedback?.isError ? "destructive" : "default"} 
                className={!feedback?.isError ? "bg-[#093A3E] hover:bg-[#05204A]" : ""}
                onClick={() => setFeedback(null)}
              >
                Entendi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead>Data da Compra</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Custo Unitário</TableHead>
              <TableHead className="text-right">Custo Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Carregando histórico...
                </TableCell>
              </TableRow>
            ) : filteredHistorico.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                  <ShoppingBag className="mx-auto h-8 w-8 mb-3 opacity-50" />
                  Nenhuma compra encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredHistorico.map((compra) => {
                const total = compra.qtd_comprada * compra.custo_unitario
                
                return (
                  <TableRow key={compra.id}>
                    <TableCell className="text-gray-600">
                      {new Date(compra.data_compra).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {compra.produto_nome}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {compra.qtd_comprada}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {formatCurrency(compra.custo_unitario)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      {formatCurrency(total)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
