import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Package, Plus, Pencil, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const formSchema = z.object({
  codigo: z.string().min(1, "O código é obrigatório"),
  categoria: z.string().min(1, "A categoria é obrigatória"),
  nome: z.string().min(1, "O nome é obrigatório"),
  qtd_minima: z.coerce.number().min(0, "A quantidade deve ser 0 ou maior"),
})

interface Produto {
  id: number
  codigo: string
  categoria: string
  nome: string
  qtd_minima: number
}

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ title: string, message: string, isError: boolean } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      codigo: "",
      categoria: "",
      nome: "",
      qtd_minima: 0,
    },
  })

  // Carregar produtos
  const fetchProdutos = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/produtos')
      if (response.ok) {
        const data = await response.json()
        setProdutos(data)
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProdutos()
  }, [])

  // Iniciar cadastro de novo produto
  const handleNewProduct = () => {
    setEditingProduct(null)
    form.reset({ codigo: "", categoria: "", nome: "", qtd_minima: 0 })
  }

  // Iniciar edição de produto
  const handleEdit = (produto: Produto) => {
    setEditingProduct(produto)
    form.reset({
      codigo: produto.codigo,
      categoria: produto.categoria,
      nome: produto.nome,
      qtd_minima: produto.qtd_minima,
    })
    setIsModalOpen(true)
  }

  // Abrir modal de exclusão
  const handleDelete = (id: number) => {
    setProductToDelete(id)
  }

  // Confirmar exclusão do produto
  const confirmDelete = async () => {
    if (productToDelete === null) return;
    try {
      const response = await fetch(`/api/produtos/${productToDelete}`, { method: 'DELETE' })
      if (response.ok) {
        fetchProdutos()
        setFeedback({
          title: "Produto Excluído",
          message: "O produto foi excluído com sucesso do catálogo.",
          isError: false
        })
      } else {
        const err = await response.json().catch(() => ({}))
        setFeedback({
          title: "Erro ao excluir produto",
          message: err.detail || "Não foi possível excluir o produto (pode haver lotes vinculados).",
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
    } finally {
      setProductToDelete(null)
    }
  }

  // Submeter formulário (Criar ou Editar)
  const onSubmit = async (values: any) => {
    try {
      const url = editingProduct ? `/api/produtos/${editingProduct.id}` : '/api/produtos'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        setIsModalOpen(false)
        form.reset()
        setEditingProduct(null)
        fetchProdutos()
        setFeedback({
          title: editingProduct ? "Produto Atualizado" : "Produto Cadastrado",
          message: "A operação foi concluída com sucesso.",
          isError: false
        })
      } else {
        const err = await response.json().catch(() => ({}))
        setFeedback({
          title: "Erro ao salvar produto",
          message: err.detail || "Verifique se os dados estão corretos.",
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

  const filteredProdutos = produtos.filter(produto => 
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    produto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#05204A]">Produtos</h1>
          <p className="text-gray-500 mt-1">Gerencie o seu catálogo de produtos.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center bg-white px-3 py-2 rounded-md shadow-sm border border-gray-200 w-full md:w-64">
            <input 
              type="text" 
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-700 outline-none w-full"
            />
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewProduct} className="bg-[#093A3E] hover:bg-[#05204A] text-white">
              <Plus className="mr-2 h-4 w-4" /> Cadastrar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="codigo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: A1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="qtd_minima"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qtd Mínima</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control as any}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Pele, Cabelo..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control as any}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Sabonete Líquido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="bg-[#093A3E] hover:bg-[#05204A] w-full">
                    Salvar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={productToDelete !== null} onOpenChange={(open) => !open && setProductToDelete(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita e pode afetar lotes atrelados.</p>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <Button variant="outline" onClick={() => setProductToDelete(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Excluir
              </Button>
            </div>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Produtos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastrados no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead>Código</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Qtd Mínima</TableHead>
              <TableHead className="text-right w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Carregando produtos...
                </TableCell>
              </TableRow>
            ) : filteredProdutos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProdutos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell className="font-medium">{produto.codigo}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-[#EFCB68]/20 px-2 py-1 text-xs font-medium text-[#093A3E]">
                      {produto.categoria}
                    </span>
                  </TableCell>
                  <TableCell>{produto.nome}</TableCell>
                  <TableCell className="text-right font-medium text-gray-600">
                    {produto.qtd_minima}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(produto)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(produto.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
