"""
Medicine Search Service
Loads the A-Z medicines dataset of India (253k+ medicines) and provides
fast search by name, composition, or manufacturer using an inverted index.
"""
import csv
import os
import re
from collections import defaultdict


class MedicineSearchService:
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.rows = []
        self.index = defaultdict(set)  # token -> set of row indices
        self._loaded = False

    def _ensure_loaded(self):
        if self._loaded:
            return
        if not os.path.exists(self.csv_path):
            # graceful: leave empty if file missing
            self._loaded = True
            return
        with open(self.csv_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                self.rows.append(row)
                # build searchable text per field
                name = row.get("name", "") or ""
                comp1 = row.get("short_composition1", "") or ""
                comp2 = row.get("short_composition2", "") or ""
                mfr = row.get("manufacturer_name", "") or ""
                mtype = row.get("type", "") or ""
                # tokenize and index
                for tok in set(self._tokenize(name + " " + comp1 + " " + comp2 + " " + mfr + " " + mtype)):
                    self.index[tok].add(i)
                # also index name tokens with higher weight by storing name field for ranking
        self._loaded = True

    @staticmethod
    def _tokenize(text):
        """Lowercase, split on non-alphanumeric, drop empties and very short tokens."""
        text = (text or "").lower()
        tokens = re.split(r"[^a-z0-9]+", text)
        return [t for t in tokens if len(t) >= 2]

    @staticmethod
    def _match_score(query_lower, field_value):
        """Relevance: exact > prefix > substring. Higher is better."""
        fv = (field_value or "").lower()
        if not fv:
            return 0
        if fv == query_lower:
            return 100
        if fv.startswith(query_lower):
            return 60
        if query_lower in fv:
            return 30
        return 0

    def search(self, query, limit=30):
        """Search medicines by name / composition / manufacturer."""
        self._ensure_loaded()
        q = (query or "").strip()
        if not q or not self.rows:
            return []

        q_lower = q.lower()
        query_tokens = self._tokenize(q)

        # candidate rows from inverted index (union of token matches)
        candidate_indices = set()
        for tok in query_tokens:
            # also match tokens that start with query tokens (prefix)
            for idx_token, idx_set in self.index.items():
                if idx_token.startswith(tok) or tok in idx_token:
                    candidate_indices.update(idx_set)

        # if no index hits, fall back to substring scan across all rows
        if not candidate_indices and len(q_lower) >= 2:
            candidate_indices = range(len(self.rows))

        scored = []
        for i in candidate_indices:
            row = self.rows[i]
            name = row.get("name", "") or ""
            comp1 = row.get("short_composition1", "") or ""
            comp2 = row.get("short_composition2", "") or ""
            mfr = row.get("manufacturer_name", "") or ""

            # scoring: name matches weighted highest
            score = 0
            score += self._match_score(q_lower, name) * 3
            score += self._match_score(q_lower, comp1) * 2
            score += self._match_score(q_lower, comp2) * 2
            score += self._match_score(q_lower, mfr)

            # small boost if all query tokens appear somewhere in the row
            row_text = " ".join([name, comp1, comp2, mfr]).lower()
            if all(tok in row_text for tok in query_tokens):
                score += 15

            if score > 0:
                scored.append((score, row))

        # sort by score desc, then by name asc for stability
        scored.sort(key=lambda x: (-x[0], x[1].get("name", "")))
        return [row for _, row in scored[:limit]]

    def stats(self):
        self._ensure_loaded()
        active = sum(1 for r in self.rows if (r.get("Is_discontinued", "") or "").upper() != "TRUE")
        return {
            "total": len(self.rows),
            "active": active,
            "discontinued": len(self.rows) - active,
        }

    def get(self, med_id):
        """Get a single medicine by id."""
        self._ensure_loaded()
        for r in self.rows:
            if str(r.get("id", "")) == str(med_id):
                return r
        return None
