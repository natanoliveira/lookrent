import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'
import { AutoPrint } from '@/components/print/auto-print'
import { PrintButton } from '@/components/print/print-button'
import { formatCPF, formatPhone, formatDate, onlyDigits } from '@lookrent/utils'

export default async function ImprimirClientesPage() {
  const session = await getSessionOrThrow()

  const [empresa, clientes] = await Promise.all([
    prisma.empresa.findUnique({
      where: { id: session.empresaId },
      select: { nome: true, cidade: true, estado: true },
    }),
    prisma.cliente.findMany({
      where: { empresaId: session.empresaId },
      include: { _count: { select: { contratos: true } } },
      orderBy: { nomeCompleto: 'asc' },
    }),
  ])

  const hoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 text-sm text-black">
      <AutoPrint />

      {/* Botão manual */}
      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>

      {/* ── Cabeçalho ── */}
      <div className="mb-6 flex items-end justify-between border-b-2 border-black pb-3">
        <div>
          <h1 className="text-lg font-bold uppercase">{empresa?.nome}</h1>
          <p className="text-base font-semibold">Lista de Clientes</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Emitido em: {hoje}</p>
          <p>Total: {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Tabela ── */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1.5 text-left">#</th>
            <th className="border border-gray-300 px-2 py-1.5 text-left">Nome</th>
            <th className="border border-gray-300 px-2 py-1.5 text-left">CPF</th>
            <th className="border border-gray-300 px-2 py-1.5 text-left">Telefone</th>
            <th className="border border-gray-300 px-2 py-1.5 text-left">Cidade/UF</th>
            <th className="border border-gray-300 px-2 py-1.5 text-center">Contratos</th>
            <th className="border border-gray-300 px-2 py-1.5 text-left">Cadastro</th>
          </tr>
        </thead>
        <tbody>
          {clientes.length === 0 ? (
            <tr>
              <td colSpan={7} className="border border-gray-300 px-2 py-4 text-center text-gray-400">
                Nenhum cliente cadastrado.
              </td>
            </tr>
          ) : (
            clientes.map((cliente, idx) => (
              <tr key={cliente.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-2 py-1 text-center text-gray-400">{idx + 1}</td>
                <td className="border border-gray-300 px-2 py-1 font-medium">{cliente.nomeCompleto}</td>
                <td className="border border-gray-300 px-2 py-1 font-mono">{formatCPF(onlyDigits(cliente.cpf))}</td>
                <td className="border border-gray-300 px-2 py-1">{formatPhone(onlyDigits(cliente.telefone))}</td>
                <td className="border border-gray-300 px-2 py-1">{cliente.cidade}/{cliente.estado}</td>
                <td className="border border-gray-300 px-2 py-1 text-center">{cliente._count.contratos}</td>
                <td className="border border-gray-300 px-2 py-1 text-gray-500">{formatDate(cliente.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="mt-6 text-right text-xs text-gray-400">
        {empresa?.nome} — {empresa?.cidade}/{empresa?.estado}
      </p>
    </div>
  )
}
