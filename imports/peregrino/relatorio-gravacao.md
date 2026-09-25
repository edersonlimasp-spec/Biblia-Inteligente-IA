# Relatório de gravação — O Peregrino

Livro: `c6e1dea2-b191-40aa-b38d-4916f55c4216`.

Foram concluídas duas transações, nesta ordem: banco de conteúdo Neon e banco de desenvolvimento. Cada transação validou os dados antes do `COMMIT`. Nenhuma transação falhou ou exigiu `ROLLBACK`. O banco de produção **não foi alterado**; nenhum sync foi acionado e não houve publicação.

Os arquivos de referência são `imports/peregrino/final/09.md`, `10.md`, `16.md`, `17.md` e `18.md`. Os registros anteriores estão em `imports/peregrino/backup/neon.json` e `imports/peregrino/backup/desenvolvimento.json`.

## Verificação após o commit

| Banco | SHA-256 dos cinco conteúdos igual ao dos arquivos | Capítulos | `order_num` | `chapters_count` | Capítulos 1–8 e 11–15 | Demais campos de `library_books` |
| --- | --- | ---: | --- | ---: | --- | --- |
| Conteúdo Neon | 5/5 | 18 | 1–18, sem duplicatas | 18 | Idênticos ao backup | Idênticos ao backup |
| Desenvolvimento | 5/5 | 18 | 1–18, sem duplicatas | 18 | Idênticos ao backup | Idênticos ao backup |

| Capítulo | SHA-256 do arquivo e do conteúdo no Neon e no desenvolvimento |
| ---: | --- |
| 9 | `4dc3f46f8b05a81e2290cbe1f3458b6c948a6271bc4d8412b0fa4837b2a645f5` |
| 10 | `69152366e71c38edd3676746975252997d49344fea267f100fd0163a3e720e5e` |
| 16 | `1f72ca3b3e40fbc3f64c5edcc55de54eafdbbe209c28e07c7403a68d03e9b42d` |
| 17 | `db0f31dfc230e57965b9268800902c0f0f543db960fd6ff39cb00589d22f11b7` |
| 18 | `2dd4c71524997550209acf7f75b6ebe93c4626fb4bec6d3deabfac1aacc4e23a` |

O capítulo 18 usa o mesmo ID nos dois bancos: `a8e36c42-6894-44cd-b721-51c6927bebfa`. Foi gravado com `is_sample = false` e `estimated_read_time = NULL`. Os IDs dos capítulos 9, 10, 16 e 17 foram mantidos. Os títulos de 9 e 10 foram mantidos; os de 16, 17 e 18 correspondem aos títulos solicitados. O `updated_at` dos capítulos alterados foi atualizado; `library_books.updated_at` permaneceu igual ao backup.

Produção ainda depende de uma execução futura do seed na inicialização ou pela rota administrativa, sem que nenhuma delas tenha sido acionada nesta tarefa.