import { PrismaClient, Role, PlanoEmpresa, StatusContrato, TipoMovimentacao, StatusPagamento, StatusContaReceber, StatusTicket } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Helpers ────────────────────────────────────────────────────────────────

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

function fakeDate(daysFromNow: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d
}

function fakeCPF(i: number): string {
  const n = String(i).padStart(9, '0')
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${String(i % 99).padStart(2, '0')}`
}

const NOMES = [
  'Ana Silva', 'Bruno Souza', 'Carla Oliveira', 'Diego Pereira', 'Elaine Costa',
  'Fábio Martins', 'Gabriela Rocha', 'Henrique Lima', 'Isabela Santos', 'João Ferreira',
  'Karina Alves', 'Leonardo Ribeiro', 'Mariana Carvalho', 'Natan Rodrigues', 'Olivia Nunes',
  'Pedro Gomes', 'Renata Barbosa', 'Samuel Castro', 'Tatiana Melo', 'Ulisses Dias',
  'Vanessa Cardoso', 'Wesley Correia', 'Ximena Pinto', 'Yara Monteiro', 'Zélia Freitas',
  'Alexandre Braga', 'Beatriz Nascimento', 'Caio Teixeira', 'Daniela Cunha', 'Eduardo Mendes',
  'Fernanda Lopes', 'Gustavo Ramos', 'Helena Viana', 'Igor Coelho', 'Juliana Pires',
]

const CIDADES = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Fortaleza', 'Manaus']
const ESTADOS = { 'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Belo Horizonte': 'MG', 'Curitiba': 'PR', 'Porto Alegre': 'RS', 'Salvador': 'BA', 'Fortaleza': 'CE', 'Manaus': 'AM' }
const BAIRROS = ['Centro', 'Jardim América', 'Vila Nova', 'Santa Cruz', 'Boa Vista', 'Alto da Serra', 'Parque Industrial']

const PRODUTOS_NAMES = [
  { nome: 'Terno Azul Marinho', referencia: 'TRN-001', tamanho: 'P' },
  { nome: 'Terno Azul Marinho', referencia: 'TRN-001', tamanho: 'M' },
  { nome: 'Terno Azul Marinho', referencia: 'TRN-001', tamanho: 'G' },
  { nome: 'Terno Preto Slim', referencia: 'TRN-002', tamanho: 'M' },
  { nome: 'Terno Preto Slim', referencia: 'TRN-002', tamanho: 'G' },
  { nome: 'Terno Cinza Classic', referencia: 'TRN-003', tamanho: 'M' },
  { nome: 'Terno Cinza Classic', referencia: 'TRN-003', tamanho: 'GG' },
  { nome: 'Vestido de Festa Vermelho', referencia: 'VST-001', tamanho: 'P' },
  { nome: 'Vestido de Festa Vermelho', referencia: 'VST-001', tamanho: 'M' },
  { nome: 'Vestido de Festa Azul', referencia: 'VST-002', tamanho: 'M' },
  { nome: 'Vestido de Festa Azul', referencia: 'VST-002', tamanho: 'G' },
  { nome: 'Vestido Longo Dourado', referencia: 'VST-003', tamanho: 'P' },
  { nome: 'Vestido Longo Dourado', referencia: 'VST-003', tamanho: 'M' },
  { nome: 'Fantasia Rei Leão', referencia: 'FNT-001', tamanho: 'Único' },
  { nome: 'Fantasia Fada Madrinha', referencia: 'FNT-002', tamanho: 'Único' },
  { nome: 'Fantasia Pirata', referencia: 'FNT-003', tamanho: 'Infantil' },
  { nome: 'Fantasia Pirata', referencia: 'FNT-003', tamanho: 'Adulto' },
  { nome: 'Fantasia Super-Herói Vermelho', referencia: 'FNT-004', tamanho: 'M' },
  { nome: 'Fantasia Super-Herói Vermelho', referencia: 'FNT-004', tamanho: 'G' },
  { nome: 'Smoking Branco', referencia: 'SMK-001', tamanho: 'M' },
  { nome: 'Smoking Branco', referencia: 'SMK-001', tamanho: 'G' },
  { nome: 'Sapato Social Preto', referencia: 'SPC-001', tamanho: '40' },
  { nome: 'Sapato Social Preto', referencia: 'SPC-001', tamanho: '42' },
  { nome: 'Sapato Social Preto', referencia: 'SPC-001', tamanho: '44' },
  { nome: 'Sapato Social Marrom', referencia: 'SPC-002', tamanho: '40' },
  { nome: 'Sapato Social Marrom', referencia: 'SPC-002', tamanho: '42' },
  { nome: 'Sandália Dourada', referencia: 'SDL-001', tamanho: '36' },
  { nome: 'Sandália Dourada', referencia: 'SDL-001', tamanho: '38' },
  { nome: 'Sandália Prateada', referencia: 'SDL-002', tamanho: '36' },
  { nome: 'Sandália Prateada', referencia: 'SDL-002', tamanho: '38' },
  { nome: 'Cinto Couro Preto', referencia: 'CNT-001', tamanho: 'M' },
  { nome: 'Cinto Couro Marrom', referencia: 'CNT-002', tamanho: 'G' },
  { nome: 'Gravata Azul', referencia: 'GRV-001', tamanho: 'Único' },
  { nome: 'Gravata Vermelha', referencia: 'GRV-002', tamanho: 'Único' },
  { nome: 'Gravata Preta', referencia: 'GRV-003', tamanho: 'Único' },
  { nome: 'Chapéu Cartola', referencia: 'CHT-001', tamanho: 'Único' },
  { nome: 'Coroa Dourada', referencia: 'CRN-001', tamanho: 'Único' },
  { nome: 'Luvas Brancas', referencia: 'LVS-001', tamanho: 'M' },
  { nome: 'Bolsa de Festa Prata', referencia: 'BLS-001', tamanho: 'Único' },
  { nome: 'Bolsa de Festa Dourada', referencia: 'BLS-002', tamanho: 'Único' },
]

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed...')

  // Cleanup
  await prisma.ticket.deleteMany()
  await prisma.contaReceber.deleteMany()
  await prisma.pagamento.deleteMany()
  await prisma.movimentacaoAluguel.deleteMany()
  await prisma.itemContrato.deleteMany()
  await prisma.contrato.deleteMany()
  await prisma.produto.deleteMany()
  await prisma.cliente.deleteMany()
  await prisma.formaPagamento.deleteMany()
  await prisma.configuracaoEmpresa.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.empresa.deleteMany()

  console.log('  ✓ Banco limpo')

  // ── Empresa ───────────────────────────────────────────────────────────────
  const empresa = await prisma.empresa.create({
    data: {
      nome: 'LookRent Trajes e Fantasias',
      cnpj: '12.345.678/0001-90',
      email: 'contato@lookrent.com.br',
      telefone: '(11) 98765-4321',
      logradouro: 'Rua das Flores',
      numero: '1234',
      complemento: 'Sala 5',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100',
      plano: PlanoEmpresa.PROFISSIONAL,
      ativo: true,
    },
  })
  console.log(`  ✓ Empresa criada: ${empresa.nome}`)

  // ── Configuração da Empresa ───────────────────────────────────────────────
  await prisma.configuracaoEmpresa.create({
    data: {
      empresaId: empresa.id,
      textoContrato: `O locatário se compromete a devolver os itens nas mesmas condições em que foram retirados, limpos e sem avarias.
Danos causados aos itens serão cobrados do locatário conforme avaliação da empresa.
A multa por atraso na devolução será cobrada conforme contratado.
Este contrato é regido pelas leis brasileiras, especialmente o Código Civil.`,
      observacoesPadrao: 'Peças devem ser devolvidas em sacola plástica transparente. Não é necessário lavar.',
      multaPorAtraso: 5.00,
      diasCarencia: 1,
      dadosBancarios: 'Banco: Nubank | Agência: 0001 | Conta: 12345678-9 | Chave PIX: contato@lookrent.com.br',
    },
  })

  // ── Usuários ──────────────────────────────────────────────────────────────
  const senhaHash = await hash('senha123', 10)

  await prisma.usuario.create({
    data: {
      empresaId: empresa.id,
      nome: 'Administrador LookRent',
      email: 'admin@lookrent.com.br',
      senhaHash,
      role: Role.ADMIN,
    },
  })

  await prisma.usuario.create({
    data: {
      empresaId: empresa.id,
      nome: 'Maria Gerente',
      email: 'gerente@lookrent.com.br',
      senhaHash,
      role: Role.GERENTE,
    },
  })

  await prisma.usuario.createMany({
    data: [
      { empresaId: empresa.id, nome: 'Carlos Atendente', email: 'carlos@lookrent.com.br', senhaHash, role: Role.ATENDENTE },
      { empresaId: empresa.id, nome: 'Priscila Atendente', email: 'priscila@lookrent.com.br', senhaHash, role: Role.ATENDENTE },
    ],
  })

  console.log(`  ✓ 4 usuários criados (admin, gerente, 2 atendentes)`)
  console.log(`    Login: admin@lookrent.com.br / senha123`)

  // ── Formas de Pagamento ───────────────────────────────────────────────────
  const formas = await prisma.formaPagamento.createManyAndReturn({
    data: [
      { empresaId: empresa.id, nome: 'PIX' },
      { empresaId: empresa.id, nome: 'Dinheiro' },
      { empresaId: empresa.id, nome: 'Cartão de Débito' },
      { empresaId: empresa.id, nome: 'Cartão de Crédito' },
      { empresaId: empresa.id, nome: 'Transferência Bancária' },
    ],
  })
  console.log(`  ✓ ${formas.length} formas de pagamento`)

  // ── Clientes ──────────────────────────────────────────────────────────────
  const clienteData = NOMES.map((nome, i) => {
    const cidade = pick(CIDADES)
    return {
      empresaId: empresa.id,
      cpf: fakeCPF(i + 1),
      nomeCompleto: nome,
      logradouro: `Rua ${pick(['das Acácias', 'dos Ipês', 'Brasil', 'São José', 'Boa Vista'])}`,
      numero: String(rand(1, 999)),
      complemento: i % 3 === 0 ? `Apto ${rand(1, 200)}` : null,
      bairro: pick(BAIRROS),
      cidade,
      estado: ESTADOS[cidade as keyof typeof ESTADOS],
      cep: `${String(rand(10000, 99999))}-${String(rand(100, 999))}`,
      telefone: `(${rand(11, 99)}) 9${rand(1000, 9999)}-${rand(1000, 9999)}`,
      email: i % 4 !== 0 ? `${nome.toLowerCase().replace(/ /g, '.')}${i}@email.com` : null,
    }
  })

  const clientes = await prisma.cliente.createManyAndReturn({ data: clienteData })
  console.log(`  ✓ ${clientes.length} clientes criados`)

  // ── Produtos ──────────────────────────────────────────────────────────────
  const produtoData = PRODUTOS_NAMES.map((p, i) => ({
    empresaId: empresa.id,
    nome: p.nome,
    referencia: p.referencia,
    codigoInterno: `LR-${String(i + 1).padStart(4, '0')}`,
    tamanho: p.tamanho,
    quantidadeTotal: rand(2, 5),
    quantidadeDisponivel: rand(1, 3),
    valorLocacao: parseFloat((rand(3000, 25000) / 100).toFixed(2)),
    valorCusto: parseFloat((rand(8000, 80000) / 100).toFixed(2)),
    ativo: true,
  }))

  const produtos = await prisma.produto.createManyAndReturn({ data: produtoData })
  console.log(`  ✓ ${produtos.length} produtos criados`)

  // ── Contratos com Itens, Pagamentos, Movimentações e Contas ──────────────
  const statusList: StatusContrato[] = [
    StatusContrato.ATIVO, StatusContrato.ATIVO, StatusContrato.ATIVO,
    StatusContrato.FINALIZADO, StatusContrato.FINALIZADO,
    StatusContrato.PENDENTE, StatusContrato.CANCELADO,
  ]

  let numContrato = 1000
  let contratosCount = 0
  let pagamentosCount = 0
  let ticketsCount = 0

  for (let i = 0; i < 25; i++) {
    const cliente = pick(clientes)
    const status = pick(statusList)
    const dataInicio = fakeDate(rand(-90, 30))
    const dataFim = new Date(dataInicio)
    dataFim.setDate(dataFim.getDate() + rand(3, 14))

    // Seleciona 1 a 4 produtos aleatórios
    const qtdItens = rand(1, 4)
    const produtosSelecionados = [...produtos].sort(() => Math.random() - 0.5).slice(0, qtdItens)

    const itens = produtosSelecionados.map((prod) => {
      const quantidade = rand(1, 2)
      const valorUnitario = Number(prod.valorLocacao)
      return { produtoId: prod.id, quantidade, valorUnitario, subtotal: valorUnitario * quantidade }
    })

    const valorTotal = itens.reduce((acc, it) => acc + it.subtotal, 0)

    const contrato = await prisma.contrato.create({
      data: {
        empresaId: empresa.id,
        clienteId: cliente.id,
        numeroContrato: `CTR-${numContrato++}`,
        dataInicio,
        dataFim,
        valorTotal,
        status,
        qrCode: `https://lookrent.app/c/${numContrato}`,
        itens: { create: itens },
      },
    })
    contratosCount++

    // Movimentações
    if (status !== StatusContrato.PENDENTE) {
      await prisma.movimentacaoAluguel.create({
        data: {
          contratoId: contrato.id,
          tipo: TipoMovimentacao.RETIRADA,
          data: dataInicio,
          observacao: 'Itens retirados em perfeitas condições.',
        },
      })

      if (status === StatusContrato.FINALIZADO) {
        await prisma.movimentacaoAluguel.create({
          data: {
            contratoId: contrato.id,
            tipo: TipoMovimentacao.DEVOLUCAO,
            data: dataFim,
            observacao: 'Itens devolvidos sem avarias.',
          },
        })
      }
    }

    // Pagamento
    const formaPag = pick(formas)
    const pago = status === StatusContrato.FINALIZADO || (status === StatusContrato.ATIVO && rand(0, 1) === 1)
    const statusPag = status === StatusContrato.CANCELADO
      ? StatusPagamento.CANCELADO
      : pago ? StatusPagamento.PAGO : StatusPagamento.PENDENTE

    await prisma.pagamento.create({
      data: {
        empresaId: empresa.id,
        contratoId: contrato.id,
        formaPagamentoId: formaPag.id,
        valor: valorTotal,
        dataPagamento: pago ? dataInicio : new Date(),
        status: statusPag,
      },
    })
    pagamentosCount++

    // Conta a Receber
    const vencido = dataFim < new Date() && !pago
    const statusConta = status === StatusContrato.CANCELADO
      ? StatusContaReceber.CANCELADA
      : pago ? StatusContaReceber.PAGA
      : vencido ? StatusContaReceber.VENCIDA
      : StatusContaReceber.ABERTA

    await prisma.contaReceber.create({
      data: {
        empresaId: empresa.id,
        contratoId: contrato.id,
        valorOriginal: valorTotal,
        valorPago: pago ? valorTotal : 0,
        vencimento: dataFim,
        status: statusConta,
      },
    })

    // Ticket de dívida para vencidos
    if (vencido && rand(0, 1) === 1) {
      const multa = parseFloat((valorTotal * 0.05).toFixed(2))
      await prisma.ticket.create({
        data: {
          empresaId: empresa.id,
          clienteId: cliente.id,
          contratoId: contrato.id,
          valor: multa,
          motivo: `Multa por atraso na devolução — Contrato ${contrato.numeroContrato}`,
          status: StatusTicket.ABERTO,
        },
      })
      ticketsCount++
    }
  }

  // Contratos extras apenas com status FINALIZADO para histórico
  for (let i = 0; i < 10; i++) {
    const cliente = pick(clientes)
    const dataInicio = fakeDate(rand(-180, -91))
    const dataFim = new Date(dataInicio)
    dataFim.setDate(dataFim.getDate() + rand(3, 7))

    const produtosSelecionados = [...produtos].sort(() => Math.random() - 0.5).slice(0, rand(1, 3))
    const itens = produtosSelecionados.map((prod) => {
      const quantidade = 1
      const valorUnitario = Number(prod.valorLocacao)
      return { produtoId: prod.id, quantidade, valorUnitario, subtotal: valorUnitario }
    })
    const valorTotal = itens.reduce((acc, it) => acc + it.subtotal, 0)

    const contrato = await prisma.contrato.create({
      data: {
        empresaId: empresa.id,
        clienteId: cliente.id,
        numeroContrato: `CTR-${numContrato++}`,
        dataInicio,
        dataFim,
        valorTotal,
        status: StatusContrato.FINALIZADO,
        itens: { create: itens },
      },
    })
    contratosCount++

    await prisma.movimentacaoAluguel.createMany({
      data: [
        { contratoId: contrato.id, tipo: TipoMovimentacao.RETIRADA, data: dataInicio },
        { contratoId: contrato.id, tipo: TipoMovimentacao.DEVOLUCAO, data: dataFim },
      ],
    })

    await prisma.pagamento.create({
      data: {
        empresaId: empresa.id,
        contratoId: contrato.id,
        formaPagamentoId: pick(formas).id,
        valor: valorTotal,
        dataPagamento: dataInicio,
        status: StatusPagamento.PAGO,
      },
    })
    pagamentosCount++

    await prisma.contaReceber.create({
      data: {
        empresaId: empresa.id,
        contratoId: contrato.id,
        valorOriginal: valorTotal,
        valorPago: valorTotal,
        vencimento: dataFim,
        status: StatusContaReceber.PAGA,
      },
    })
  }

  console.log(`  ✓ ${contratosCount} contratos criados`)
  console.log(`  ✓ ${pagamentosCount} pagamentos criados`)
  console.log(`  ✓ ${ticketsCount} tickets de dívida abertos`)

  console.log('\n✅ Seed concluído com sucesso!\n')
  console.log('  Credenciais de acesso:')
  console.log('  ┌────────────────────────────────────────┐')
  console.log('  │ ADMIN    admin@lookrent.com.br         │')
  console.log('  │ GERENTE  gerente@lookrent.com.br       │')
  console.log('  │ ATENDENTE carlos@lookrent.com.br       │')
  console.log('  │ Senha    senha123                      │')
  console.log('  └────────────────────────────────────────┘')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
