# Guias do Clínica Psi

Passo a passo do projeto, tela por tela e fase por fase. Os mocks do Penpot (`.png`) ficam junto do guia, na pasta da respectiva tela (`Tela 1` … `Tela 10`).

Cada guia termina com uma barra de navegação — **◀ anterior · próximo ▶** — para avançar sem voltar à lista de arquivos.

## Ordem de leitura

A ordem abaixo é a mesma em que as fases foram construídas (a sequência registrada no [`ESTADO_FINAL_COMPLETO.md`](ESTADO_FINAL_COMPLETO.md)).

| # | Guia | Pasta | O que cobre |
|---|------|-------|-------------|
| 01 | [Tela de Login](Tela%201/GUIA_01_TELA_LOGIN_EXPO.md) | `Tela 1` | Primeira tela: tema, teclado, inputs e botão — no Expo Go/Snack |
| 02 | [Cadastro (Passo 1)](Tela%202/GUIA_02_TELA_CADASTRO_EXPO.md) | `Tela 2` | Componentes compartilhados (`FormField`, `PasswordField`, `PrimaryButton`, `Stepper`…) |
| 03B | [Refatoração do Login](Tela%202/GUIA_03B_REFATORACAO_COMPONENTES_TELA_1.md) | `Tela 2` | O Login passa a usar os componentes criados no Guia 02 |
| 03 | [Navegação entre telas](Tela%202/GUIA_03_NAVEGACAO_EXPO.md) | `Tela 2` | Rota A (estado no `App.js`) × Rota B (React Navigation); Login ↔ Cadastro ↔ Painel |
| 04 | [Cadastro (Passo 2)](Tela%203/GUIA_04_TELA_CADASTRO_PASSO2_EXPO.md) | `Tela 3` | "Dados da clínica" e o stepper com passo concluído |
| 07 | [Painel](Tela%204/GUIA_07_PAINEL_EXPO.md) | `Tela 4` | Tela inicial pós-login, em estado vazio |
| 08 | [Barras do sistema](Tela%204/GUIA_08_BARRAS_SISTEMA_EXPO.md) | `Tela 4` | `StatusBar` + barra de navegação do Android (`SafeArea`) |
| 09 | [Novo Paciente](Tela%205/GUIA_09_NOVO_PACIENTE_EXPO.md) | `Tela 5` | O formulário de paciente como componente modal reutilizável |
| 10 | [Menu lateral](Tela%206/GUIA_10_MENU_EXPO.md) | `Tela 6` | Drawer `☰` animado |
| 11 | [Pacientes (lista vazia)](Tela%207/GUIA_11_PACIENTES_VAZIO_EXPO.md) | `Tela 7` | Lista vazia + navegação real pelos itens do drawer |
| 12 | [Agenda](Tela%208/GUIA_12_AGENDA_EXPO.md) | `Tela 8` | Agenda em estado vazio (dias, busca de fachada) |
| 13 | [Serviços](Tela%209/GUIA_13_SERVICOS_EXPO.md) | `Tela 9` | Catálogo de serviços com chips de filtro e toggles |
| 14 | [Configurações](Tela%2010/Guia%2014%20%28Configura%C3%A7%C3%B5es%29.md) | `Tela 10` | Última tela do app |
| 15 | [SQLite na API](Fase%20SQLite/GUIA_15_BANCO_SQLITE_API.md) | `Fase SQLite` | O banco volta a ser SQLite: adaptador, migrações, testes e teste de carga |
| 16 | [Reestruturação e limpeza](Fase%20SQLite/GUIA_16_REESTRUTURACAO_LIMPEZA.md) | `Fase SQLite` | A faxina do projeto: um Expo só (`app/`) e API sem pacotes de UI |

> Não existe GUIA_05 nem GUIA_06 nesta pasta — a numeração salta do 04 direto para o 07. As menções a um "GUIA_05" nos textos mais antigos se referem a uma fase de persistência planejada que não virou guia aqui; a persistência do projeto hoje é o SQLite da API (Guia 15).

## Veja também

- [`ESTADO_FINAL_COMPLETO.md`](ESTADO_FINAL_COMPLETO.md) — retrato final do app: todos os arquivos prontos para copiar/colar no Snack ou projeto local.
- [`docs/MUDANCAS.md`](../MUDANCAS.md) — histórico de decisões do projeto, incluindo a ida ao Supabase e a volta ao SQLite.
