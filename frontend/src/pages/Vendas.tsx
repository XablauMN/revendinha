import React, { useEffect, useState } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2, ShoppingBag, Check, ChevronsUpDown, ChevronDown, ChevronRight } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const itemSchema = z.object({
  produto_id: z.string().min(1, "Selecione um produto"),
  lote_id: z.string().min(1, "Selecione um lote"),
  qtd_vendida: z.coerce.number().min(1, "Mínimo 1"),
  preco_venda_unitario: z.coerce.number().min(0.01, "Maior que 0"),
})

const formSchema = z.object({
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item"),
})

interface Produto {
  id: number
  nome: string
}

interface LoteAtivo {
  id: number
  produto_id: number
  produto_nome: string
  custo_unitario: number
  qtd_disponivel: number
}

interface ItemVendaHistorico {
  id: number
  lote_id: number
  qtd_vendida: number
  preco_venda_unitario: number
  produto_nome: string
  custo_unitario: number
}

interface HistoricoVenda {
  id: number
  data_venda: string
  valor_total: number
  itens_venda: ItemVendaHistorico[]
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

export default function Vendas() {
  const hoje = new Date()
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

  const [historico, setHistorico] = useState<HistoricoVenda[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [lotesAtivos, setLotesAtivos] = useState<LoteAtivo[]>([])
  
  const [startDate, setStartDate] = useState(formatDateString(primeiroDia))
  const [endDate, setEndDate] = useState(formatDateString(ultimoDia))
  const [appliedStartDate, setAppliedStartDate] = useState(formatDateString(primeiroDia))
  const [appliedEndDate, setAppliedEndDate] = useState(formatDateString(ultimoDia))
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [feedback, setFeedback] = useState<{ title: string, message: string, isError: boolean } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      itens: [{ produto_id: "", lote_id: "", qtd_vendida: 1, preco_venda_unitario: 0 }],
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

  const fetchDados = async () => {
    setIsLoading(true)
    try {
      const [resHistorico, resProdutos, resLotes] = await Promise.all([
        fetch('/api/vendas').catch(() => null),
        fetch('/api/produtos').catch(() => null),
        fetch('/api/compras/lotes_ativos').catch(() => null)
      ])

      if (resHistorico?.ok) setHistorico(await resHistorico.json())
      if (resProdutos?.ok) setProdutos(await resProdutos.json())
      if (resLotes?.ok) setLotesAtivos(await resLotes.json())
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDados()
  }, [])

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const onSubmit = async (values: any) => {
    try {
      // Calcula o valor total da venda no frontend para mandar no payload
      const valor_total = values.itens.reduce((acc: number, item: any) => acc + (item.qtd_vendida * item.preco_venda_unitario), 0)
      
      const payload = {
        valor_total,
        itens: values.itens.map((item: any) => ({
          lote_id: parseInt(item.lote_id, 10),
          qtd_vendida: item.qtd_vendida,
          preco_venda_unitario: item.preco_venda_unitario
        }))
      }

      const response = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsModalOpen(false)
        form.reset({ itens: [{ produto_id: "", lote_id: "", qtd_vendida: 1, preco_venda_unitario: 0 }] })
        fetchDados()
        setFeedback({
          title: "Venda Registrada",
          message: "A venda foi registrada e o estoque foi baixado com sucesso.",
          isError: false
        })
      } else {
        const err = await response.json()
        setFeedback({
          title: "Erro ao registrar venda",
          message: err.detail || "Verifique as quantidades disponíveis no lote.",
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

  useEffect(() => {
    if (!isModalOpen) {
      form.reset({ itens: [{ produto_id: "", lote_id: "", qtd_vendida: 1, preco_venda_unitario: 0 }] })
    }
  }, [isModalOpen, form])

  // Calcula Totais para o rodapé do formulário
  const faturamentoTotal = watchItens?.reduce((acc: number, item: any) => {
    return acc + (Number(item?.qtd_vendida || 0) * Number(item?.preco_venda_unitario || 0))
  }, 0) || 0;

  const lucroTotal = watchItens?.reduce((acc: number, item: any) => {
    const lote = lotesAtivos.find(l => l.id.toString() === item?.lote_id)
    const custo = lote ? lote.custo_unitario : 0
    return acc + (Number(item?.qtd_vendida || 0) * (Number(item?.preco_venda_unitario || 0) - custo))
  }, 0) || 0;

  const handleFilter = () => {
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
  }

  const filteredHistorico = historico.filter(item => {
    // Para vendas, um item histórico pode ter vários produtos. Buscamos se algum nome bate.
    const textMatch = item.itens_venda.some(iv => iv.produto_nome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const itemDate = item.data_venda.slice(0, 10);
    const dateMatch = itemDate >= appliedStartDate && itemDate <= appliedEndDate;
    return textMatch && dateMatch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#05204A]">Vendas</h1>
          <p className="text-gray-500 mt-1">Registre as vendas e dê baixa no estoque dos lotes.</p>
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
              <Plus className="mr-2 h-4 w-4" /> Registrar Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Nova Venda</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const itemQtd = Number(watchItens?.[index]?.qtd_vendida || 0)
                    const itemPreco = Number(watchItens?.[index]?.preco_venda_unitario || 0)
                    const loteId = watchItens?.[index]?.lote_id
                    const produtoId = watchItens?.[index]?.produto_id

                    const lotesFiltrados = lotesAtivos.filter(l => l.produto_id.toString() === produtoId)
                    const loteSelecionado = lotesAtivos.find(l => l.id.toString() === loteId)
                    
                    const custoUnitario = loteSelecionado?.custo_unitario || 0
                    const lucroUnitario = itemPreco - custoUnitario
                    
                    return (
                      <div key={field.id} className="flex flex-col gap-3 p-4 border rounded-md bg-gray-50/50">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 items-start">
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
                                                // Resetar o lote ao mudar o produto
                                                form.setValue(`itens.${index}.lote_id`, "")
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
                            name={`itens.${index}.lote_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Lote Origem</FormLabel>
                                <Select 
                                  disabled={!produtoId || lotesFiltrados.length === 0}
                                  onValueChange={field.onChange} 
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-white">
                                      <SelectValue placeholder={!produtoId ? "Selecione produto" : "Selecione lote"} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {lotesFiltrados.map(lote => (
                                      <SelectItem key={lote.id} value={lote.id.toString()}>
                                        Lote #{lote.id} ({lote.qtd_disponivel} disp.)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control as any}
                            name={`itens.${index}.qtd_vendida`}
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
                            name={`itens.${index}.preco_venda_unitario`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preço Unit. (R$)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" className="bg-white" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Helper Text de UX Crítica */}
                        {loteSelecionado && (
                          <div className="flex flex-col md:flex-row justify-between items-center text-sm px-1 pt-2 border-t border-gray-200/60 mt-2">
                            <span className="text-gray-500">
                              Em estoque neste lote: <strong className={itemQtd > loteSelecionado.qtd_disponivel ? "text-red-500" : ""}>{loteSelecionado.qtd_disponivel}</strong> | Custo: {formatCurrency(loteSelecionado.custo_unitario)}
                            </span>
                            <span className={cn("font-medium", lucroUnitario >= 0 ? "text-[#3F9B0A]" : "text-red-500")}>
                              Lucro Unitário Esperado: {formatCurrency(lucroUnitario)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3 mt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Remover
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
                    onClick={() => append({ produto_id: "", lote_id: "", qtd_vendida: 1, preco_venda_unitario: 0 })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Produto à Venda
                  </Button>
                </div>

                {form.formState.errors.itens?.root && (
                  <p className="text-sm text-red-500 text-center">
                    {form.formState.errors.itens.root.message}
                  </p>
                )}

                <div className="pt-6 flex items-center justify-between border-t border-gray-100">
                  <div className="flex flex-col">
                    <div className="text-lg">
                      <span className="text-gray-600 mr-2">Faturamento:</span>
                      <span className="font-bold text-[#05204A] text-xl">{formatCurrency(faturamentoTotal)}</span>
                    </div>
                    <div className="text-md mt-1">
                      <span className="text-gray-500 mr-2">Lucro da Venda:</span>
                      <span className={cn("font-bold", lucroTotal >= 0 ? "text-[#3F9B0A]" : "text-red-500")}>
                        {formatCurrency(lucroTotal)}
                      </span>
                    </div>
                  </div>
                  <Button type="submit" className="bg-[#093A3E] hover:bg-[#05204A] px-8 h-12">
                    Confirmar Venda
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
              <TableHead className="w-12"></TableHead>
              <TableHead>Venda ID</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
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
                  Nenhuma venda encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredHistorico.map((venda) => {
                const isExpanded = expandedRows.has(venda.id)
                return (
                  <React.Fragment key={venda.id}>
                    <TableRow className={isExpanded ? "bg-gray-50/50" : ""}>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleRow(venda.id)}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        #{venda.id}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(venda.data_venda).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {venda.itens_venda.length} produto(s)
                      </TableCell>
                      <TableCell className="text-right font-bold text-[#05204A]">
                        {formatCurrency(venda.valor_total)}
                      </TableCell>
                    </TableRow>
                    
                    {/* Linha Expandida (Itens da Venda) */}
                    {isExpanded && (
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableCell colSpan={5} className="p-0 border-b-2 border-b-gray-100">
                          <div className="pl-14 pr-6 py-4">
                            <Table className="bg-white border rounded-md">
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="h-10 text-xs">Produto</TableHead>
                                  <TableHead className="h-10 text-xs">Lote</TableHead>
                                  <TableHead className="h-10 text-xs text-right">Qtd</TableHead>
                                  <TableHead className="h-10 text-xs text-right">Preço Unit.</TableHead>
                                  <TableHead className="h-10 text-xs text-right">Custo Unit.</TableHead>
                                  <TableHead className="h-10 text-xs text-right">Lucro</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {venda.itens_venda.map((item) => {
                                  const lucro = (item.preco_venda_unitario - item.custo_unitario) * item.qtd_vendida
                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell className="text-sm font-medium">{item.produto_nome}</TableCell>
                                      <TableCell className="text-sm text-gray-500">#{item.lote_id}</TableCell>
                                      <TableCell className="text-sm text-right">{item.qtd_vendida}</TableCell>
                                      <TableCell className="text-sm text-right">{formatCurrency(item.preco_venda_unitario)}</TableCell>
                                      <TableCell className="text-sm text-right text-gray-500">{formatCurrency(item.custo_unitario)}</TableCell>
                                      <TableCell className={cn("text-sm text-right font-medium", lucro >= 0 ? "text-[#3F9B0A]" : "text-red-500")}>
                                        {formatCurrency(lucro)}
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
