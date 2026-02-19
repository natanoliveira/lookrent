import { notFound } from 'next/navigation'
import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'
import { AutoPrint } from '@/components/print/auto-print'
import { PrintButton } from '@/components/print/print-button'
import { formatCurrency, formatDate, formatCPF, formatPhone, onlyDigits } from '@lookrent/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ImprimirContratoPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSessionOrThrow()

  const contrato = await prisma.contrato.findFirst({
    where: { id, empresaId: session.empresaId },
    include: {
      cliente: true,
      itens: {
        include: {
          produto: { select: { nome: true, tamanho: true, referencia: true } },
        },
      },
      empresa: {
        include: { configuracao: true },
      },
    },
  })

  if (!contrato) notFound()

  const { empresa, cliente, itens } = contrato
  const hoje = new Date().toLocaleDateString('pt-BR')

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 text-sm text-black">
      <AutoPrint />

      {/* Botão de impressão manual — some no print */}
      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>

      {/* ── Cabeçalho ── */}
      <div className="mb-6 flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="text-xl font-bold uppercase">{empresa.nome}</h1>
          <p className="text-xs text-gray-600">CNPJ: {empresa.cnpj}</p>
          <p className="text-xs text-gray-600">{empresa.logradouro}, {empresa.numero}{empresa.complemento ? `, ${empresa.complemento}` : ''}</p>
          <p className="text-xs text-gray-600">{empresa.bairro} — {empresa.cidade}/{empresa.estado} — CEP {empresa.cep}</p>
          <p className="text-xs text-gray-600">Tel: {formatPhone(onlyDigits(empresa.telefone))} | {empresa.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contrato de Locação</p>
          <p className="text-lg font-bold">{contrato.numeroContrato}</p>
          <p className="text-xs text-gray-600">Emitido em: {hoje}</p>
        </div>
      </div>

      {/* ── Dados do locatário ── */}
      <div className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Dados do Locatário</h2>
        <div className="rounded border border-gray-300 p-3">
          <div className="grid grid-cols-3 gap-x-4 gap-y-1">
            <div className="col-span-2">
              <span className="text-xs text-gray-500">Nome completo</span>
              <p className="font-semibold">{cliente.nomeCompleto}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">CPF</span>
              <p className="font-mono">{formatCPF(onlyDigits(cliente.cpf))}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Telefone</span>
              <p>{formatPhone(onlyDigits(cliente.telefone))}</p>
            </div>
            {cliente.email && (
              <div className="col-span-2">
                <span className="text-xs text-gray-500">E-mail</span>
                <p>{cliente.email}</p>
              </div>
            )}
            <div className="col-span-3">
              <span className="text-xs text-gray-500">Endereço</span>
              <p>
                {cliente.logradouro}, {cliente.numero}
                {cliente.complemento ? `, ${cliente.complemento}` : ''} — {cliente.bairro}, {cliente.cidade}/{cliente.estado}
                {cliente.cep ? ` — CEP ${cliente.cep}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Período ── */}
      <div className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Período de Locação</h2>
        <div className="flex gap-6 rounded border border-gray-300 p-3">
          <div>
            <span className="text-xs text-gray-500">Data de início</span>
            <p className="font-semibold">{formatDate(contrato.dataInicio)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Data de término</span>
            <p className="font-semibold">{formatDate(contrato.dataFim)}</p>
          </div>
        </div>
      </div>

      {/* ── Itens ── */}
      <div className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Itens Locados</h2>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1.5 text-left">#</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left">Produto</th>
              <th className="border border-gray-300 px-2 py-1.5 text-center">Qtd.</th>
              <th className="border border-gray-300 px-2 py-1.5 text-right">Valor Unit.</th>
              <th className="border border-gray-300 px-2 py-1.5 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={item.id}>
                <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-500">{idx + 1}</td>
                <td className="border border-gray-300 px-2 py-1.5">
                  {item.produto.nome}
                  {item.produto.tamanho && <span className="ml-1 text-gray-500">({item.produto.tamanho})</span>}
                  {item.produto.referencia && <span className="ml-1 text-xs text-gray-400">Ref.: {item.produto.referencia}</span>}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-center">{item.quantidade}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right">{formatCurrency(Number(item.valorUnitario))}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold">{formatCurrency(Number(item.subtotal))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={4} className="border border-gray-300 px-2 py-1.5 text-right font-bold uppercase">
                Total
              </td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-bold">
                {formatCurrency(Number(contrato.valorTotal))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Observações ── */}
      {contrato.observacoes && (
        <div className="mb-5">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">Observações</h2>
          <p className="rounded border border-gray-300 p-3 text-sm">{contrato.observacoes}</p>
        </div>
      )}

      {/* ── Texto do contrato ── */}
      {empresa.configuracao?.textoContrato && (
        <div className="mb-6">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">Termos e Condições</h2>
          <p className="whitespace-pre-line rounded border border-gray-200 p-3 text-xs text-gray-700">
            {empresa.configuracao.textoContrato}
          </p>
        </div>
      )}

      {/* ── Assinaturas ── */}
      <div className="mt-10 grid grid-cols-2 gap-12">
        <div>
          <div className="mb-1 h-px border-t border-black" />
          <p className="text-center text-xs">{empresa.nome}</p>
          <p className="text-center text-xs text-gray-500">Locador</p>
        </div>
        <div>
          <div className="mb-1 h-px border-t border-black" />
          <p className="text-center text-xs">{cliente.nomeCompleto}</p>
          <p className="text-center text-xs text-gray-500">Locatário — CPF {formatCPF(onlyDigits(cliente.cpf))}</p>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">{empresa.cidade}, {hoje}</p>
    </div>
  )
}
