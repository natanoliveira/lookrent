# 📦 Sistema SaaS de Gestão de Locação — Arquitetura Completa (Monorepo)

Crie a arquitetura completa, profissional e pronta para produção de um sistema **monorepo SaaS** para gestão de locação de produtos (roupas, fantasias, calçados, cintos, sandálias e similares), utilizando as melhores práticas atuais.

---

# 🎯 Objetivo

Sistema web moderno, escalável e altamente vendável para empresas de aluguel de produtos físicos, com:

- Experiência **mobile-first** e responsiva (desktop)
- Arquitetura segura
- Estrutura SaaS multi-tenant
- Diferenciais competitivos claros
- Preparado para crescimento e billing futuro

---

# 🏗 Arquitetura Técnica

## 📦 Monorepo

Utilizar **Turborepo ou Nx**.

### Estrutura sugerida:

<!-- apps/
web/        → Next.js (App Router)
api/        → Backend (Route Handlers / Server Actions)
packages/
ui/         → shadcn + radix + kibo
db/         → Prisma + schema.prisma
config/     → eslint, tsconfig, tailwind
utils/      → helpers compartilhados -->

```
apps/
  web/        → Next.js (App Router)
  api/        → Backend (Route Handlers / Server Actions)
packages/
  ui/         → shadcn + radix + kibo
  db/         → Prisma + schema.prisma
  config/     → eslint, tsconfig, tailwind
  utils/      → helpers compartilhados
```
---

# 🖥 Frontend

- Next.js (App Router)
- React + TypeScript
- Server Components
- Server Actions
- Middleware para proteção
- TailwindCSS
- shadcn/ui + Radix UI + Kibo UI
- Mobile-first

### 🎨 Paleta obrigatória

- `#01033E`
- `#003FFF`
- `#817EFE`
- `#D4D6E2`

---

# 🔐 Segurança

- JWT Bearer
- Expiração: 1 hora
- Refresh token
- Access token armazenado em **HTTPOnly Cookie**
- NÃO utilizar localStorage para tokens
- Middleware protegendo rotas
- RBAC (controle por perfil: ADMIN, GERENTE, ATENDENTE)
- Hash de senha com bcrypt
- Validação com Zod
- Rate limiting
- CSRF protection

Explicar detalhadamente a estratégia adotada.

---

# 🗄 Banco de Dados

- PostgreSQL
- Hospedado na Neon
- Prisma ORM

---

# 📌 Modelagem Obrigatória

Gerar o `schema.prisma` completo e estruturado incluindo:

---

## 🏢 Empresa (Multi-tenant)

Campos:
- id
- nome
- cnpj
- email
- telefone
- endereço completo
- logo
- plano
- ativo
- createdAt
- updatedAt

Relacionamentos:
- usuários
- clientes
- produtos
- contratos
- pagamentos
- configurações

---

## 👤 Usuários

Campos:
- id
- empresaId
- nome
- email
- senhaHash
- role (ADMIN, GERENTE, ATENDENTE)
- ativo
- createdAt
- updatedAt

Relacionamento com empresa.

Implementar controle multi-tenant com isolamento por empresa.

---

## 👥 Clientes

Campos obrigatórios:
- id
- empresaId
- cpf
- nomeCompleto
- endereço completo
- telefone
- email
- createdAt
- updatedAt

Índices para:
- CPF
- empresaId

---

## 👕 Produtos

- id
- empresaId
- nome
- referencia
- codigoInterno
- tamanho
- quantidadeTotal
- quantidadeDisponivel
- valorLocacao
- valorCusto
- ativo
- createdAt
- updatedAt

---

## 📑 Contratos

- id
- empresaId
- clienteId
- numeroContrato
- dataInicio
- dataFim
- valorTotal
- status
- qrCode
- createdAt
- updatedAt

---

## 📦 ItensContrato

- id
- contratoId
- produtoId
- quantidade
- valorUnitario
- subtotal

---

## 📦 Movimentação de Aluguel

- id
- contratoId
- tipo (RETIRADA | DEVOLUCAO)
- data
- observacao

---

## 💳 Formas de Pagamento

- id
- empresaId
- nome (PIX, Cartão, Dinheiro, Boleto, etc)
- ativo

---

## 💰 Pagamentos

- id
- empresaId
- contratoId
- formaPagamentoId
- valor
- dataPagamento
- status (PENDENTE | PAGO | CANCELADO)
- createdAt

---

## 💵 Contas a Receber

- id
- empresaId
- contratoId
- valorOriginal
- valorPago
- vencimento
- status

---

## 🎫 Tickets (Dívidas)

- id
- empresaId
- clienteId
- contratoId
- valor
- motivo
- status

---

## ⚙ Configurações da Empresa

- id
- empresaId
- textoContrato
- observacoesPadrao
- multaPorAtraso
- diasCarencia
- dadosBancarios
- createdAt
- updatedAt

---

# 🧾 Funcionalidades

- Página de Aluguéis (registro de cliente + produtos)
- Impressão de contrato em PDF
- QR Code no contrato
- QR Code redirecionando para rota autenticada
- Conciliação financeira (Venda x Recebimento)
- Controle de estoque por período
- Multa automática por atraso
- Dashboard estratégico

---

# 🚀 Diferenciais Competitivos

Criar diferenciais claros como:

- Controle inteligente de giro de estoque
- Alertas automáticos
- Gestão inteligente de inadimplência
- Dashboard financeiro estratégico
- Multi-filial
- White-label
- API pública futura
- Sistema preparado para integrações

Explicar o diferencial estratégico de mercado.

---

# 📈 Estratégia SaaS

Explicar:

- Estratégia multi-tenant
- Isolamento lógico de dados por empresa
- Controle por plano
- Limites por assinatura
- Estrutura preparada para billing futuro
- Escalabilidade horizontal

---

# 📄 Tela de Login

Layout dividido:

- Lado esquerdo → formulário
- Lado direito → descrição do sistema + diferenciais
- Design moderno e persuasivo

---

# 📦 Entregáveis Esperados

Fornecer:

1. Arquitetura completa
2. Estrutura de pastas
3. `schema.prisma` completo
4. Estratégia de segurança detalhada
5. Estratégia SaaS
6. Diferenciais competitivos
7. Fluxo completo do sistema
8. Boas práticas modernas adotadas

---

⚠️ Não gerar explicação superficial.  
Gerar arquitetura profunda, técnica e pronta para produção.