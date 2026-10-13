import { useEffect, useState } from "react"
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TrendingUp, TrendingDown, DollarSign, PackageOpen, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// Interfaces
interface GraficoLinha {
  periodo: string
  custo: number
  faturamento: number
}

interface GraficoLucro {
  periodo: string
  lucro: number
}

interface RankingProduto {
  produto_nome: string
  custo_total: number
  faturamento_total: number
  lucro_total: number
}

interface ProdutoAbaixoMinimo {
  produto_id: number
  codigo: string
  nome: string
  qtd_atual: number
  qtd_minima: number
}

interface DashboardData {
  custo_total: number
  faturamento_total: number
  lucro_total: number
  grafico_linha: GraficoLinha[]
  grafico_lucro: GraficoLucro[]
  ranking_produtos: RankingProduto[]
  produtos_abaixo_minimo: ProdutoAbaixoMinimo[]
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

export default function Home() {
  const hoje = new Date()
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

  const [startDate, setStartDate] = useState(formatDateString(primeiroDia))
  const [endDate, setEndDate] = useState(formatDateString(ultimoDia))

  const [appliedStartDate, setAppliedStartDate] = useState(formatDateString(primeiroDia))
  const [appliedEndDate, setAppliedEndDate] = useState(formatDateString(ultimoDia))

  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/dashboard?inicio=${appliedStartDate}&fim=${appliedEndDate}`)
      if (response.ok) {
        const json = await response.json()
        setData(json)
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (appliedStartDate && appliedEndDate) {
      fetchData()
    }
  }, [appliedStartDate, appliedEndDate])

  const handleFilter = () => {
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full text-gray-500">
        Carregando dashboard...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center h-full text-red-500">
        Erro ao carregar os dados do dashboard.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#05204A]">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral do seu negócio.</p>
        </div>

        {/* Filtro de Datas nativo elegante */}
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
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-red-500 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Custo Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.custo_total)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Faturamento Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.faturamento_total)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lucro Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.lucro_total)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Seção Gráficos e Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          {/* Gráfico Linha: Custo x Faturamento */}
          <Card className="shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#05204A]">Custo vs Faturamento por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.grafico_linha} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="periodo" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
                    <Legend />
                    <Line type="monotone" name="Custo" dataKey="custo" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="Faturamento" dataKey="faturamento" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico Barras: Lucro */}
          <Card className="shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#05204A]">Lucro por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.grafico_lucro} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="periodo" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} cursor={{ fill: '#f3f4f6' }} />
                    <Bar name="Lucro" dataKey="lucro" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Ranking */}
        <div className="lg:col-span-1">
          <Card className="h-full shadow-sm flex flex-col bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#05204A]">Ranking de Produtos (Lucro)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ranking_produtos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-gray-500 py-6">
                        Nenhum dado
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.ranking_produtos.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-gray-700">{item.produto_nome}</TableCell>
                        <TableCell className={cn("text-right font-bold", item.lucro_total >= 0 ? "text-blue-600" : "text-red-600")}>
                          {formatCurrency(item.lucro_total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Produtos abaixo do mínimo */}
      <div>
        <Card className="shadow-sm border-t-4 border-t-amber-500 bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-[#05204A] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Produtos Abaixo do Estoque Mínimo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd. Atual</TableHead>
                  <TableHead className="text-right">Qtd. Mínima</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.produtos_abaixo_minimo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      <PackageOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      Todos os produtos estão com estoque adequado.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.produtos_abaixo_minimo.map((prod) => (
                    <TableRow key={prod.produto_id}>
                      <TableCell className="text-gray-500">{prod.codigo}</TableCell>
                      <TableCell className="font-medium">{prod.nome}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{prod.qtd_atual}</TableCell>
                      <TableCell className="text-right text-gray-600">{prod.qtd_minima}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Estoque Baixo
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}
