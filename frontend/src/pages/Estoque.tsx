import React, { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, PackageOpen } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface Lote {
  id: number
  data_compra: string
  custo_unitario: number
  qtd_comprada: number
  qtd_disponivel: number
}

interface ProdutoEstoque {
  id: number
  codigo: string
  categoria: string
  nome: string
  qtd_minima: number
  qtd_total_disponivel: number
  lotes: Lote[]
}

export default function Estoque() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchEstoque() {
      try {
        const response = await fetch('/api/estoque')
        if (response.ok) {
          const data = await response.json()
          setProdutos(data)
        } else {
          console.error("Erro ao carregar estoque", response.status)
        }
      } catch (error) {
        console.error("Erro na requisição de estoque", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEstoque()
  }, [])

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filteredProdutos = produtos.filter(produto => 
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    produto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="p-6">Carregando estoque...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#05204A]">Estoque</h1>
          <p className="text-gray-500 mt-1">Gerencie os produtos e lotes disponíveis.</p>
        </div>
        <div className="flex items-center bg-white px-3 py-2 rounded-md shadow-sm border border-gray-200">
          <input 
            type="text" 
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-sm border-none bg-transparent focus:ring-0 text-gray-700 outline-none w-full md:w-64"
          />
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-12"></TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Disponível</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProdutos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  <PackageOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProdutos.map((produto) => {
                const isExpanded = expandedRows.has(produto.id)
                const isEstoqueBaixo = produto.qtd_total_disponivel < produto.qtd_minima

                return (
                  <React.Fragment key={produto.id}>
                    <TableRow className={isExpanded ? "bg-gray-50/50" : ""}>
                      <TableCell>
                        {produto.lotes.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleRow(produto.id)}
                            title="Ver Lotes"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{produto.codigo}</TableCell>
                      <TableCell>{produto.nome}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-[#EFCB68]/20 px-2 py-1 text-xs font-medium text-[#093A3E]">
                          {produto.categoria}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold ${
                            isEstoqueBaixo ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {produto.qtd_total_disponivel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-500">
                        {produto.qtd_minima}
                      </TableCell>
                    </TableRow>

                    {isExpanded && produto.lotes.length > 0 && (
                      <TableRow className="bg-gray-50/30 hover:bg-gray-50/30">
                        <TableCell colSpan={6} className="p-0">
                          <div className="pl-16 pr-6 py-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Lotes Ativos</h4>
                            <div className="rounded-md border bg-white">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50">
                                    <TableHead className="text-xs">ID Lote</TableHead>
                                    <TableHead className="text-xs">Data Compra</TableHead>
                                    <TableHead className="text-xs text-right">Custo Unitário</TableHead>
                                    <TableHead className="text-xs text-right">Qtd Comprada</TableHead>
                                    <TableHead className="text-xs text-right">Disponível</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {produto.lotes.map((lote) => (
                                    <TableRow key={lote.id}>
                                      <TableCell className="text-sm text-gray-600">#{lote.id}</TableCell>
                                      <TableCell className="text-sm text-gray-600">
                                        {new Date(lote.data_compra).toLocaleDateString()}
                                      </TableCell>
                                      <TableCell className="text-sm text-right text-gray-600">
                                        {new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL'
                                        }).format(lote.custo_unitario)}
                                      </TableCell>
                                      <TableCell className="text-sm text-right text-gray-600">
                                        {lote.qtd_comprada}
                                      </TableCell>
                                      <TableCell className="text-sm text-right font-medium text-gray-900">
                                        {lote.qtd_disponivel}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
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
