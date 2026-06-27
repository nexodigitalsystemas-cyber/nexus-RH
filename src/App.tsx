import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Agente from '@/pages/Agente';
import Tarefas from '@/pages/Tarefas';
import Arquivos from '@/pages/Arquivos';
import Relatorios from '@/pages/Relatorios';
import Configuracoes from '@/pages/Configuracoes';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agente" element={<Agente />} />
        <Route path="/tarefas" element={<Tarefas />} />
        <Route path="/arquivos" element={<Arquivos />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </Layout>
  );
}
