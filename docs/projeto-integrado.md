# Projeto Integrado — Colaboração Multi-Professor

**Versão:** Schema v1 (Fase 1 — Regras + Documentação)  
**Data:** Fevereiro 2026  
**Status:** ✅ Regras do Firestore implementadas | ⏳ UI pendente (Fase 2)

---

## O que é o Projeto Integrado?

O **Projeto Integrado** permite que múltiplos professores colaborem em uma mesma turma, atribuindo tarefas, distribuindo LXC e registrando o progresso dos alunos — tudo de forma segura, sem que os dados do professor criador sejam comprometidos.

## Modelo de Dados

### Princípio fundamental

> `ownerId` é **imutável**. Nunca é transferido. O professor dono é o único que pode excluir alunos, turmas ou escolas.

### Como funciona a associação

Cada turma (`classes/{classId}`) possui dois campos chave:

| Campo | Tipo | Descrição |
|---|---|---|
| `seed` | `string` (12 chars) | Código único de convite, ex: `ABC123XYZ789` |
| `sharedWith` | `string[]` | UIDs dos professores colaboradores (máx. **25**) |

O fluxo de associação:
1. **Prof. A (Dono)** compartilha a `seed` da turma (WhatsApp, e-mail, etc.)
2. **Prof. B (Colaborador)** busca no Firestore a turma usando a `seed`
3. **Prof. B** faz `updateDoc` adicionando seu UID ao array `sharedWith` via `arrayUnion`
4. O `ownerId` da turma **permanece como UID de A** — inalterado

### Campo `classId` nas transações (NOVO)

Todas as novas transações criadas por colaboradores devem incluir o campo `classId`. Isso é o que permite as regras do Firestore validarem o acesso sem depender do `ownerId`.

```
transactions/{txId} {
  ownerId:      "uid-do-professor-que-criou"  // pode ser A ou B
  classId:      "id-da-turma"                 // NOVO - obrigatório para colaboradores
  studentId:    "id-do-aluno"
  teacherName:  "Sigla/Nome do professor"
  ...
}
```

---

## Permissões por Papel

| Recurso | Dono (ownerId) | Colaborador (sharedWith) |
|---|---|---|
| **Escolas** | CRUD total | ❌ sem acesso |
| **Turmas** | CRUD total | Ler + adicionar-se ao sharedWith |
| **Alunos** | CRUD total | Ler + Criar + Editar (sem excluir) |
| **Transações** | CRUD total | CRUD total (da turma compartilhada) |
| **Catálogo** (tarefas/medalhas) | CRUD total | ❌ sem acesso |

> **Obs. sobre marcações de alunos:** O colaborador pode editar campos como `marked`, `markedColor`, `markedLabel`, `nickname` — mas **não pode alterar** `ownerId`, `classId` ou `schoolId`.

---

## Capacidade

- **Máximo de colaboradores por turma:** 25
- O array `sharedWith` do Firestore suporta isso nativamente. A verificação `uid in array` é O(n), trivial para n=25.

---

## O que foi implementado na Fase 1

- [x] **`firestore.rules`** — regras granulares com funções helper (`isOwner`, `isCollaboratorOf`)
- [x] Esta documentação

## Roadmap — Fase 2 (UI)

Os itens abaixo são o próximo passo de implementação. **Nenhum código de UI foi alterado nesta fase.**

- [ ] **Tela "Projeto Integrado"** na sidebar (nova view)
  - Exibir seed da turma selecionada (com botão de copiar)
  - Campo de input para entrar com seed de outra turma
  - Lista de colaboradores atuais da turma (sharedWith)
  - Botão para o dono remover um colaborador
- [ ] **`firestoreService.ts`** — novas funções:
  - `firestoreLookupBySeed(seed)` → busca a turma pela seed
  - `firestoreJoinClassBySeed(uid, classId)` → `arrayUnion` em sharedWith
  - `firestoreLeaveClass(uid, classId)` → `arrayRemove` em sharedWith
  - `fetchSharedClassData(uid)` → busca turmas onde uid está em sharedWith
- [ ] **`DashboardView`** — adaptar para exibir turmas compartilhadas além das próprias
- [ ] **Transações** — garantir que `classId` é sempre incluído ao criar transações

---

## Avisos de Segurança

> [!CAUTION]
> **Nunca** use `setDoc` ou `updateDoc` para alterar o `ownerId` de qualquer documento. O Firestore Rules bloqueia isso, mas o código também deve ser escrito para nunca tentar.

> [!WARNING]
> A seed é um código de **convite único**, não uma senha. Qualquer professor autenticado que tiver a seed pode se adicionar à turma. O dono pode remover colaboradores a qualquer momento via `arrayRemove`.

> [!NOTE]
> O catálogo de tarefas/medalhas/penalidades **não é compartilhado** entre professores nesta versão. O colaborador usará o catálogo do seu próprio perfil ao criar tarefas. Uma possível evolução futura seria expor o catálogo do dono para o colaborador durante a sessão da turma.
