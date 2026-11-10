# Eiren — 500-record forensic editorial audit
**Audit date:** 2026-11-09  
**Scope:** `knowledge/public-qa.candidate.v1.json` on integration candidate branch. Read public educational draft only. No CORE, STOS, account, or live chat code inspected/modified as part of this Q&A audit.

## Verified machine-checkable inventory
- 500 records; 500 unique IDs; 500 unique question strings.
- No exact normalized duplicate answers in the audited snapshot.
- All records tagged `review-pending`, with public guidance provenance.
- Answer character lengths in initial audit: minimum 106, mean 153, maximum 194.
- A lexical Jaccard review at 0.65 found no high-overlap question pairs; this is not semantic proof of originality.
- 1 question-shaped-record contains a **learner statement** rather than a question: `eiren-public-002`, “I do not know how to start my story.” This is authentic student input and should not be rewritten merely to add punctuation.
- The bank is distributed across many narrow topics, including overlapping labels such as `research` / `research-methods` / `research-ethics` and `writing` / `writing-workshop` / `writing-process`.

## Editorial findings and disposition
| Priority | Finding | Disposition |
| --- | --- | --- |
| P1 | Automated format tests cannot verify literary correctness, quotation provenance, or citation integrity. | **BLOCK APPROVAL** until independent literary editorial review, with item-level evidence. |
| P1 | Public answers are not a live mentor's contextual chat; no reason to infer full personality parity from Q&A count. | Retain source-only publication boundary; browser and persona checks remain pending. |
| P2 | Topic taxonomy is highly fragmented and can weaken retrieval/routing. | Draft a separate canonical-domain mapping (e.g., reading, writing, poetry, fiction, rhetoric, grammar, language, translation, history, research, mentoring) without deleting specialist topic tags. |
| P2 | Mentor voice is predominantly concise and instructional. A sophisticated literary persona may benefit from gentle interpretive follow-up, richer examples, and clearly differentiated voice. | Review a stratified sample before authorized revision. Avoid canned ornamental language. |
| P3 | `eiren-public-002` is a declarative prompt. | **ACCEPT** as natural student utterance; search and conversation tests must not require every prompt to end in '?' . |

## Tests and review gates
Added `tests/public-qa-editorial-audit.test.mjs` to the existing candidate workflow. Checks 500 records, review-pending status, unique normalized question AND answer strings, answer length bounds, provenance, topic diversity, and public/no-authority contract. It does **not** approve any content.

## Proposed editorial acceptance workflow
1. Preserve an immutable candidate snapshot and review record-level accuracy/provenance in themed batches.
2. Mark each item `accepted`, `revise`, or `reject` in a separate reviewer-controlled ledger, never by simply setting source `status: approved`.
3. Re-run automated checks after any revisions; re-evaluate duplicate meanings with human judgment, not lexical scores alone.
4. Prepare a distinct approved-public export only after documented review; keep a separate authorization to promote it to Creative Spark's active public-source registry.
5. Test browser retrieval, mentor voice, CSP, and safe fallback before any live cutover.

**Decision:** Authoring complete; **editorial approval blocked** pending record-level review. No merge or publication authorized by this audit.
