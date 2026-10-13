import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "./components/layout/Layout"
import Home from "./pages/Home"
import Vendas from "./pages/Vendas"
import Compras from "./pages/Compras"
import Estoque from "./pages/Estoque"
import Produtos from "./pages/Produtos"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="vendas" element={<Vendas />} />
          <Route path="compras" element={<Compras />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="produtos" element={<Produtos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
