"""Local in-memory persistence for development.

This project no longer depends on MongoDB, so the backend stores user data in memory
instead of requiring an external database connection.
"""


class InMemoryCollection:
    def __init__(self):
        self._documents = []

    def _matches(self, document, query):
        if not query or query == {}:
            return True

        if "$or" in query:
            return any(self._matches(document, clause) for clause in query["$or"])

        for key, expected in query.items():
            if key == "$or":
                continue
            if document.get(key) != expected:
                return False

        return True

    def find_one(self, query=None):
        if query is None:
            return self._documents[0] if self._documents else None

        for document in self._documents:
            if self._matches(document, query):
                return document

        return None

    def find(self, query=None):
        if query is None:
            return [document.copy() for document in self._documents]

        return [document.copy() for document in self._documents if self._matches(document, query)]

    def insert_one(self, document):
        self._documents.append(document.copy())
        return type("InsertResult", (), {"inserted_id": len(self._documents) - 1})()

    def update_one(self, query, update):
        document = self.find_one(query)
        if document is None:
            return type("UpdateResult", (), {"matched_count": 0, "modified_count": 0})()

        if "$set" in update:
            for key, value in update["$set"].items():
                document[key] = value

        return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1})()


users_collection = InMemoryCollection()