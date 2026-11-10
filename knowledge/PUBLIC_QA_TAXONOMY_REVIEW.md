# Eiren — canonical public Q&A taxonomy (candidate)

The authored `knowledge/public-qa.candidate.v1.json` still contains all **500 original question records**, each with its original `topic`, wording, and `review-pending` status.

The separate `knowledge/public-qa-taxonomy.candidate.v1.json` maps **85 authored topic labels into 10 canonical domains**. It is an editorial discovery aid; it does **not** rewrite records, confer approval, or change the live Eiren chat.

The domains are Reading & Interpretation; Poetry & Poetics; Fiction, Narrative & Drama; Composition & Revision; Rhetoric & Argument; Grammar & Vocabulary; Translation & Multilingual Text; Literary History & Comparison; Research, Sources & Archives; and Literary Mentoring & Performance.

The mapping is intentionally **single-valued** for stable catalog filtering. Many questions are interdisciplinary, and secondary tags can be introduced only in a separately reviewed search model. Current draft mapping choices are not literary facts and can be adjusted through review.

## Acceptance gates
- Existing and taxonomy regression checks pass on the staged PR.
- All authored topic labels remain represented, no fallback domain, no empty canonical domains.
- Every item retains its existing review-pending source and response, with no authority to change grades or accounts.
- Editorial reviewers validate canonical placement, any needed cross-domain secondary tags, and how Eiren's voice presents results before authorized public publication.

**Status:** taxonomy authored, validation pending/required, editorial approval blocked.
