# agent-beads

Lokalne CLI w TypeScript, które zamienia wysokopoziomowy prompt lub plan w pliku `.md` na **małe, atomowe taski w stylu JIRA**, waliduje każdy z nich przez skill **codex-brainstorm**, a dopiero przewalidowane zapisuje w **Beads** (`bd` CLI).

Cel: nie pisać już ticketów ręcznie — jeden plan na wejściu, lista gotowych ticketów na wyjściu, każdy z tytułem, opisem, kryteriami akceptacji i zależnościami.

## Co konkretnie robi

1. **Czyta wejście** — albo prompt podany w argumentach, albo ścieżkę do `.md` (`--file`).
2. **Parsuje markdown** — wykrywa sekcje, listy i istniejące "task-like" bloki (jeśli plan zawiera już sekcje typu `### Task: ...`, są wykrywane i refinowane zamiast pisane od zera).
3. **Generuje drafty tasków** — LLM rozbija opis na małe, atomowe taski w schemacie JIRA: `title`, `description`, `acceptance_criteria`, `dependencies` (+ `type`, `priority`, `labels`).
4. **Waliduje każdy task przez codex-brainstorm** — sprawdza siedem rzeczy: jasność, wykonalność, rozmiar, jakość AC, zależności, konkretność, atomowość. Failed taski są przepisywane wg sugestii walidatora i ponownie sprawdzane (do `--max-refinements`).
5. **Zapisuje tylko przewalidowane taski w Beads** — przez `bd create` z `--acceptance`, `--type`, `--priority`, `--labels`. Zależności są wpinane w drugiej fazie przez `bd dep add`.
6. **Drukuje podsumowanie** — co weszło, co przeszło, co padło, jak wyglądają zależności, jakie założenia przyjął drafter.

**Najważniejsza zasada:** task nie trafia do Beads bez pozytywnej walidacji. `--dry-run` waliduje wszystko, ale nie pisze nic.

## Wymagania

- **Node ≥ 20**
- **`bd` CLI** (Beads): `brew install beads` (testowane na 1.0.3)
- **`claude` CLI** (opcjonalnie, ale zalecane) — żeby walidator faktycznie używał skilla codex-brainstorm:
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```
- **`ANTHROPIC_API_KEY`** w env — wymagane tylko jeśli `claude` CLI nie jest dostępny (tryb fallback przez SDK)

## Instalacja

```bash
git clone <repo>
cd ai-beads-task-agent
npm install
npm run build

# zainstaluj skill codex-brainstorm (raz, zostaje w ./.claude/skills/)
npx @smithery/cli@latest skill add sd0xdev/codex-brainstorm --agent claude-code
```

Po `npm run build` masz `dist/cli.js`. Dla wygody:

```bash
npm link            # rejestruje binarkę `agent-beads` globalnie
# albo alias:
alias agent-beads="node $(pwd)/dist/cli.js"
```

## Użycie

```bash
# 1. zainicjalizuj bazę Beads w katalogu projektu, do którego dodajesz taski
bd init

# 2. odpal agenta na prompcie
agent-beads "Dodaj logowanie przez Google do aplikacji React Native"

# albo z planu w pliku
agent-beads --file ./plan.md

# dry-run: zobacz drafty + walidację, ale nic nie zapisuj
agent-beads --file ./plan.md --dry-run

# verbose: dodatkowo pokazuje pełne wyjście walidatora i kolejne iteracje
agent-beads --file ./plan.md --verbose
```

### Wszystkie flagi

| Flaga | Opis |
|---|---|
| `--file, -f <path>` | Wczytaj plan z pliku `.md` |
| `--dry-run` | Waliduj wszystko, ale nie zapisuj do Beads |
| `--verbose, -v` | Drukuje wynik walidacji i historię iteracji |
| `--validator <name>` | `claude-cli` \| `local-llm` \| `auto` (default: `auto`) |
| `--max-refinements <n>` | Budżet iteracji walidatora na task (default: 2) |
| `--type <t>` | Domyślny typ bd: `task`/`feature`/`bug`/`epic`/`chore`/`decision` (default: `task`) |
| `--priority <P0..P4>` | Domyślny priorytet bd (default: `P2`) |
| `--label <name>` | Label dodawany do każdego taska. Można powtórzyć. |
| `--help, -h` | Pomoc |
| `--version` | Wersja |

### Zmienne środowiskowe

| Zmienna | Co |
|---|---|
| `ANTHROPIC_API_KEY` | Wymagane dla fallbacka (gdy `claude` CLI nie jest dostępny) |
| `AGENT_BEADS_MODEL` | Model dla SDK fallbacka (default: `claude-sonnet-4-6`) |
| `AGENT_BEADS_CLAUDE_BIN` | Override ścieżki do `claude` CLI |
| `AGENT_BEADS_BD_BIN` | Override ścieżki do `bd` CLI |

## Jak działa walidacja (i kiedy "fallback")

Walidator codex-brainstorm jest skillem Claude Code, więc do "natywnego" wywołania potrzebny jest `claude` CLI. Architektura ma dwie ścieżki:

- **Primary: `claude -p` z odwołaniem do skilla `codex-brainstorm`.**
  Skill jest zainstalowany lokalnie w `./.claude/skills/codex-brainstorm/` — Claude CLI uruchamiany z cwd projektu sam go znajdzie i użyje. Walidator wykorzystuje wtedy adversarial Claude+Codex debate (właściwa metodyka skilla).

- **Fallback: bezpośrednie API Anthropic.**
  Jeśli `claude` CLI nie jest na PATH, CLI drukuje **głośny warning** i przechodzi na SDK z promptem walidującym, który zawiera ten sam zestaw checków co skill (clarity / feasibility / size / acceptance criteria / dependencies / specificity / atomicity). To nie jest pełne wywołanie skilla — to równoważnik bez adversarial debate.

Wybór następuje automatycznie. Wymuszenie konkretnej ścieżki: `--validator=claude-cli` lub `--validator=local-llm`.

## Mapowanie JIRA → Beads

| JIRA-style pole | bd flag |
|---|---|
| `title` | `bd create [title]` |
| `description` | `--body-file <tmp>` (newline-safe) |
| `acceptance_criteria[]` | `--acceptance` (renderowane jako bullet list) |
| `type` | `--type` (`task`/`feature`/`bug`/`epic`/`chore`/`decision`) |
| `priority` | `--priority` (`P0`–`P4`) |
| `labels[]` | `--labels a,b,c` |
| `dependencies[]` | druga faza: `bd dep add <id> <dep-id>` (typ: `blocks`) |

Persystencja jest dwufazowa — najpierw wszystkie taski, potem zależności. Jest to odporne na cykle i forward refs w drafcie.

## Struktura projektu

```
src/
├── cli.ts                          # entry, orchestration
├── cli/parseArgs.ts                # arg parsing + help
├── config.ts                       # defaults, env var overrides
├── logger.ts                       # info/warn/error/debug
├── types.ts                        # TaskDraft, ValidationResult, RunSummary
├── input/readInput.ts              # prompt vs --file routing
├── parser/parseMarkdown.ts         # sekcje, bullets, "task hints"
├── tasks/
│   ├── draftTasks.ts               # prompt drafter + JSON shape
│   └── normalizeTask.ts            # strict coercion → TaskDraft
├── llm/
│   ├── LlmClient.ts                # interfejs backendu LLM
│   ├── ClaudeCliLlm.ts             # `claude -p` (primary)
│   ├── AnthropicSdkLlm.ts          # SDK + prompt caching (fallback)
│   └── createLlmClient.ts          # auto-detect z warningiem
├── brainstorm/
│   ├── prompts.ts                  # system + refinement template
│   ├── BrainstormValidator.ts      # parsuje validator JSON
│   └── validateAndRefine.ts        # pętla validate → suggest → revalidate
├── beads/
│   ├── BeadsClient.ts              # interfejs (bd-cli | beads-mcp)
│   ├── BdCliClient.ts              # bd create/dep przez child_process
│   ├── BeadsMcpClient.ts           # stub pod przyszłe MCP
│   ├── mapTaskToBd.ts              # JIRA → bd flagi
│   └── persistGraph.ts             # 2-fazowo: stwórz, potem wire deps
├── output/printSummary.ts          # raport końcowy
└── utils/extractJson.ts            # tolerancyjny JSON extractor

.claude/skills/codex-brainstorm/    # skill (instalowany przez smithery)
examples/plan-example.md
scripts/smoke-parser.ts             # offline test parser → normalize → payload
```

## Pod przyszłe Beads MCP

Cały transport do Beads stoi za interfejsem `BeadsClient` ([src/beads/BeadsClient.ts](src/beads/BeadsClient.ts)). Dziś jedyna realna implementacja to `BdCliClient`. Kiedy pojawi się Beads MCP:

1. Wypełnij `BeadsMcpClient` (dziś rzuca `not implemented`).
2. Dodaj wybór backendu w [src/cli.ts](src/cli.ts) (np. flaga `--beads=mcp`).
3. Reszta kodu (drafter, walidator, persistGraph, summary) nie wymaga zmian.

## Tryby

- **Normal** — drafty → walidacja → zapis przewalidowanych w Beads.
- **`--dry-run`** — drafty + walidacja, **żadnego** zapisu. Pre-flight `bd init` jest pominięty (więc działa nawet bez `.beads/`).
- **`--verbose`** — drukuje pełne JSON-y walidatora dla każdej iteracji każdego taska. Bardzo gadatliwe — przyda się gdy chcesz zobaczyć dlaczego task nie przeszedł.

## Exit codes

| Code | Znaczenie |
|---|---|
| `0` | Wszystko OK, wszystkie taski przeszły walidację |
| `1` | Błąd środowiska (brak `bd init`, brak `ANTHROPIC_API_KEY` przy fallbacku, błąd persystencji, etc.) |
| `2` | Błąd argumentów CLI |
| `3` | Niektóre taski nie przeszły walidacji (przewalidowane są zapisane, niezwalidowane — pominięte) |

## Znane ograniczenia

- **Brak Beads MCP** — `bd` CLI to dziś jedyne realne wyjście do Beads. Architektura jest gotowa pod swap, ale klient MCP musi powstać kiedy serwer się pojawi.
- **Skill action z fallbacka** — gdy `claude` CLI nie jest dostępny, używamy SDK z naszym promptem zamiast prawdziwego skilla. Działa, ale to nie to samo co adversarial debate.
- **Limit pliku 1 MB** — dla `.md` na wejściu. Większe plany podziel ręcznie.
- **Brak testów jednostkowych** — jest tylko `scripts/smoke-parser.ts` jako sanity check parsera/normalizera/payloadu offline.

## Smoke test (offline, bez LLM/Beads)

```bash
npx tsx scripts/smoke-parser.ts
```

Sprawdza, że parser markdown wykrywa sekcje i task hints, normalizer rzuca na pustym title/AC, a `mapTaskToBdPayload` produkuje poprawne argumenty `bd create`.

## Roadmap (gdyby ktoś pytał)

- [ ] Klient Beads MCP (jak będzie serwer)
- [ ] Testy jednostkowe (vitest) dla parsera, normalizera, mappera, walidatora (z mocked LLM)
- [ ] `--update <bd-id>` żeby aktualizować istniejące beady zamiast tworzyć nowe
- [ ] `--epic <bd-id>` żeby wszystkie utworzone taski lądowały jako children danego epica
