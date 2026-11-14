# Eiren — sound-based rhyming word thesaurus v2

**Project:** Eiren · Poet & Literary Gem  
**Branch:** `artist1970/Eiren.github.io:main`  
**Date:** 2026-11-13 local / 2026-11-14 UTC

## What was built
The public chat now consults three explicit same-origin resources, in this order:

1. `knowledge/cmudict-common-rhymes.v1.json`: **6,505** common English spellings with rhyme endings derived from an exact pinned revision of CMUdict; **882** spellings have multiple pronunciation records. The data is automatically filtered and **not individually editorially reviewed**. It is a static public resource, not a live remote service.
2. `knowledge/phonetic-rhyme-families.v1.json`: **647 unique words across 120 manually curated ARPABET-style sound families**, covering some additional terms and providing an offline fallback. These are editorial approximations, *not* CMUdict data.
3. `knowledge/rhyming-thesaurus.v1.json`: the original **41 curated headwords**, with example couplets, near rhymes and meaning-related vocabulary. Related words are a *writing thesaurus*, not guaranteed semantic equivalents.

The banks overlap. Do not sum them to claim an exact unique vocabulary size.

The corresponding browser modules are `eiren-cmudict-rhyme-v1.js`, `eiren-phonetic-rhyme-v1.js`, and `eiren-rhyme-thesaurus-v1.js`. They are loaded in `index.html` before `eiren-conversation-v1.js`.

## Phonetic method
The CMU-derived source uses ARPABET phones and digit-marked syllabic stress. A rhyme key is the **last primary-stressed vowel and every phone after it**, or the last secondary-stressed vowel if there is no primary stress. A match on that sequence is a **dictionary rhyme candidate**, not a verified rhyme in every accent, reading, or performance.

Near rhymes are explicitly labelled sound echoes: they have a phoneme edit distance of one from the matching stressed-vowel suffix. This is an approximation, not a phonological authority.

Multiple pronunciation variants (for example *read* and *wind*) remain distinguishable in the data; Eiren reminds the user to select the intended reading. A compound such as *passionflower* uses the reviewed final unit *flower*, not a guessed pronunciation for the entire botanical name.

The runtime favors roughly similar-length rhyming words and de-emphasizes a short list of function words and abbreviations in initial suggestions. A dictionary match never automatically changes a user's poem, grade, memory or published record.

## Exact source provenance and reuse
- CMUdict source: `https://github.com/cmusphinx/cmudict` pinned at commit `74790861f652b15e4ac49015a90074ad62a27690`, file `cmudict.dict`.
- Common-word filter: `https://github.com/first20hours/google-10000-english`, commit `d0736d492489198e4f9d650c7ab4143bc14c1e9e`, file `google-10000-english.txt`. A bounded first portion of the alphabetic word-frequency list was used; some words without suitable CMU pronunciations and a small explicit unsafe-word exclusion list were removed.
- **CMUdict © 1993–2014 Carnegie Mellon University**. Carnegie Mellon permits research and commercial usage without restriction and requests attribution. The upstream documentation warns that errors, omissions and inconsistencies may exist.

This source snapshot is intentionally pinned: updates should be diffed and reviewed before republishing, never fetched directly by a visitor from GitHub.

## Security, privacy and limitations
- Static asset fetches use same-origin relative paths and `credentials:"omit"`. The lookup engine does **not** transmit visitor messages or training material to the source dictionary.
- The live chat's existing locked-assessment, credentials and immediate-safety denials remain before rhyme lookup.
- Data validation rejects malformed or unexpected source records *as a whole* and retains the older offline rhyme guidance.
- The word-frequency filter is a vocabulary-scope tool, **not an exhaustive content-safety review**. Sound-based suggestions can be unsuitable, obscure or stylistically poor; reviewers should add a better vocabulary filter before expanding to students of all ages.
- Proper names, cultural terms, dialect variants and uncommon words may be absent. **No algorithm may invent a confident rhyme for an unknown spelling**.
- This is a local deterministic rhyme helper; it does **not** activate a neural model, a private CORE lookup, STOS, or automatic personal memory.

## Regression evidence
`tests/eiren-phonetic-rhyme.test.mjs` and `tests/eiren-cmudict-rhyme.test.mjs` run through the existing Eiren public-knowledge workflow with the earlier literary, safety, consent and federation checks. Release must be considered verified only after GitHub Actions actually executes the suite successfully at a specified source commit.

## Next research candidate (not yet implemented)
A revised, explicitly moderated, age-banded phonetic corpus and syllable-count/meter aid could broaden rhyme choices substantially without flooding beginners with obscure alternatives.
