import { notFound } from 'next/navigation'
import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'
import { AutoPrint } from '@/components/print/auto-print'
import { PrintButton } from '@/components/print/print-button'
import { formatCurrency, formatDate, formatCPF, formatPhone, onlyDigits } from '@lookrent/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ReciboContratoPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSessionOrThrow()

  const contrato = await prisma.contrato.findFirst({
    where: { id, empresaId: session.empresaId },
    include: {
      cliente: { select: { nomeCompleto: true, cpf: true, telefone: true } },
      itens: {
        include: {
          produto: { select: { nome: true, tamanho: true } },
        },
      },
      empresa: { select: { nome: true, telefone: true, cidade: true, estado: true } },
    },
  })

  if (!contrato) notFound()

  const hoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-[148mm] bg-white p-6 text-sm text-black">
      <AutoPrint />

      {/* Botão manual */}
      <div className="no-print mb-4 flex justify-end">
        <PrintButton />
      </div>

      {/* ── Cabeçalho ── */}
      <div className="mb-4 border-b-2 border-black pb-3 text-center">
        <h1 className="text-base font-bold uppercase">{contrato.empresa.nome}</h1>
        <p className="text-xs text-gray-500">Tel: {formatPhone(onlyDigits(contrato.empresa.telefone))}</p>
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Comprovante de Locação</p>
          <p className="text-lg font-bold">{contrato.numeroContrato}</p>
        </div>
      </div>

      {/* ── Dados do locatário ── */}
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Locatário</p>
        <p className="font-semibold">{contrato.cliente.nomeCompleto}</p>
        <p className="text-xs text-gray-600">
          CPF: {formatCPF(onlyDigits(contrato.cliente.cpf))} | Tel: {formatPhone(onlyDigits(contrato.cliente.telefone))}
        </p>
      </div>

      {/* ── Período ── */}
      <div className="mb-3 flex gap-6 border-y border-gray-200 py-2">
        <div>
          <p className="text-xs text-gray-500">Retirada</p>
          <p className="font-semibold">{formatDate(contrato.dataInicio)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Devolução</p>
          <p className="font-semibold">{formatDate(contrato.dataFim)}</p>
        </div>
      </div>

      {/* ── Itens ── */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Itens</p>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-1 text-left">Produto</th>
              <th className="py-1 text-center">Qtd</th>
              <th className="py-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {contrato.itens.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-1">
                  {item.produto.nome}
                  {item.produto.tamanho && <span className="text-gray-500"> ({item.produto.tamanho})</span>}
                </td>
                <td className="py-1 text-center">{item.quantidade}</td>
                <td className="py-1 text-right">{formatCurrency(Number(item.subtotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Total ── */}
      <div className="mb-4 flex items-center justify-between border-t-2 border-black pt-2">
        <span className="font-bold uppercase">Total</span>
        <span className="text-lg font-bold">{formatCurrency(Number(contrato.valorTotal))}</span>
      </div>

      {/* ── Assinatura ── */}
      <div className="mt-8">
        <div className="mx-auto w-64 border-t border-black pt-1 text-center">
          <p className="text-xs">{contrato.cliente.nomeCompleto}</p>
          <p className="text-xs text-gray-500">Assinatura do Locatário</p>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        {contrato.empresa.cidade}/{contrato.empresa.estado} — {hoje}
      </p>

      {/* ─── Linha de recorte ─── */}
      <div className="my-5 flex items-center gap-2 text-gray-300">
        <div className="flex-1 border-t border-dashed" />
        <span className="text-xs">✂</span>
        <div className="flex-1 border-t border-dashed" />
      </div>

      {/* ── 2ª via (via do estabelecimento) ── */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">2ª via — Estabelecimento</p>
        <p className="font-mono text-sm font-bold">{contrato.numeroContrato}</p>
        <p className="text-xs text-gray-600">{contrato.cliente.nomeCompleto}</p>
        <p className="text-xs">
          {formatDate(contrato.dataInicio)} → {formatDate(contrato.dataFim)} |{' '}
          <span className="font-semibold">{formatCurrency(Number(contrato.valorTotal))}</span>
        </p>
      </div>
    </div>
  )
}
