import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'
import { AutoPrint } from '@/components/print/auto-print'
import { PrintButton } from '@/components/print/print-button'
import { formatCurrency, formatDate } from '@lookrent/utils'

export default async function ImprimirFinanceiroPage() {
  const session = await getSessionOrThrow()

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const mesAno = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const hoje = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const [empresa, totalRecebido, totalPendente, totalVencido, pagamentos, contasVencidas] =
    await Promise.all([
      prisma.empresa.findUnique({
        where: { id: session.empresaId },
        select: { nome: true, cidade: true, estado: true },
      }),
      prisma.pagamento.aggregate({
        where: { empresaId: session.empresaId, status: 'PAGO', dataPagamento: { gte: inicioMes } },
        _sum: { valor: true },
      }),
      prisma.contaReceber.aggregate({
        where: { empresaId: session.empresaId, status: 'ABERTA' },
        _sum: { valorOriginal: true },
      }),
      prisma.contaReceber.aggregate({
        where: { empresaId: session.empresaId, status: 'VENCIDA' },
        _sum: { valorOriginal: true },
      }),
      prisma.pagamento.findMany({
        where: { empresaId: session.empresaId },
        orderBy: { dataPagamento: 'desc' },
        take: 30,
        include: {
          contrato: {
            select: {
              numeroContrato: true,
              cliente: { select: { nomeCompleto: true } },
            },
          },
          formaPagamento: { select: { nome: true } },
        },
      }),
      prisma.contaReceber.findMany({
        where: { empresaId: session.empresaId, status: 'VENCIDA' },
        orderBy: { vencimento: 'asc' },
        include: {
          contrato: {
            select: {
              numeroContrato: true,
              cliente: { select: { nomeCompleto: true } },
            },
          },
        },
      }),
    ])

  const recebido = Number(totalRecebido._sum.valor ?? 0)
  const pendente = Number(totalPendente._sum.valorOriginal ?? 0)
  const vencido = Number(totalVencido._sum.valorOriginal ?? 0)

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
          <p className="text-base font-semibold">Relatório Financeiro</p>
          <p className="text-xs capitalize text-gray-500">{mesAno}</p>
        </div>
        <p className="text-xs text-gray-500">Emitido em: {hoje}</p>
      </div>

      {/* ── KPIs ── */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded border border-gray-200 p-3 text-center">
          <p className="text-xs uppercase text-gray-500">Recebido no mês</p>
          <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(recebido)}</p>
        </div>
        <div className="rounded border border-gray-200 p-3 text-center">
          <p className="text-xs uppercase text-gray-500">A receber (aberto)</p>
          <p className="mt-1 text-xl font-bold text-amber-600">{formatCurrency(pendente)}</p>
        </div>
        <div className="rounded border border-gray-200 p-3 text-center">
          <p className="text-xs uppercase text-gray-500">Inadimplência</p>
          <p className={`mt-1 text-xl font-bold ${vencido > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {formatCurrency(vencido)}
          </p>
        </div>
      </div>

      {/* ── Pagamentos ── */}
      <div className="mb-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
          Últimos Pagamentos ({pagamentos.length})
        </h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1.5 text-left">Cliente</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left">Contrato</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left">Forma</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left">Data</th>
              <th className="border border-gray-300 px-2 py-1.5 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {pagamentos.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-gray-300 px-2 py-3 text-center text-gray-400">
                  Nenhum pagamento.
                </td>
              </tr>
            ) : (
              pagamentos.map((pag, idx) => (
                <tr key={pag.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-2 py-1">{pag.contrato.cliente.nomeCompleto}</td>
                  <td className="border border-gray-300 px-2 py-1 font-mono">{pag.contrato.numeroContrato}</td>
                  <td className="border border-gray-300 px-2 py-1">{pag.formaPagamento.nome}</td>
                  <td className="border border-gray-300 px-2 py-1">{formatDate(pag.dataPagamento)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-right font-semibold">
                    {formatCurrency(Number(pag.valor))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {pagamentos.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={4} className="border border-gray-300 px-2 py-1 text-right font-bold uppercase">
                  Total do período
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right font-bold">
                  {formatCurrency(pagamentos.reduce((acc, p) => acc + Number(p.valor), 0))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Contas Vencidas ── */}
      {contasVencidas.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-red-600">
            Contas Vencidas ({contasVencidas.length})
          </h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-red-50">
                <th className="border border-gray-300 px-2 py-1.5 text-left">Cliente</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">Contrato</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">Vencimento</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">Dias em atraso</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {contasVencidas.map((conta) => {
                const dias = Math.floor(
                  (Date.now() - new Date(conta.vencimento).getTime()) / (1000 * 60 * 60 * 24),
                )
                return (
                  <tr key={conta.id}>
                    <td className="border border-gray-300 px-2 py-1">{conta.contrato.cliente.nomeCompleto}</td>
                    <td className="border border-gray-300 px-2 py-1 font-mono">{conta.contrato.numeroContrato}</td>
                    <td className="border border-gray-300 px-2 py-1">{formatDate(conta.vencimento)}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-semibold text-red-600">{dias}d</td>
                    <td className="border border-gray-300 px-2 py-1 text-right font-semibold text-red-600">
                      {formatCurrency(Number(conta.valorOriginal))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-red-50">
                <td colSpan={4} className="border border-gray-300 px-2 py-1 text-right font-bold uppercase">
                  Total inadimplente
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right font-bold text-red-600">
                  {formatCurrency(vencido)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="mt-8 text-right text-xs text-gray-400">
        {empresa?.nome} — {empresa?.cidade}/{empresa?.estado}
      </p>
    </div>
  )
}
