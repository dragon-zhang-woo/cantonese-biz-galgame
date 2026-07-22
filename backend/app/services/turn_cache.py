import asyncio
import hashlib
import time
from collections import OrderedDict

from app.models.schemas import TurnRequest, TurnResponse


class TurnCache:
    def __init__(self, ttl_seconds: int = 600, max_entries: int = 64):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._items: OrderedDict[str, tuple[float, TurnResponse]] = OrderedDict()
        self._lock = asyncio.Lock()

    @staticmethod
    def key(request: TurnRequest) -> str:
        payload = request.model_dump_json().encode("utf-8")
        return hashlib.sha256(payload).hexdigest()

    async def get(self, request: TurnRequest) -> TurnResponse | None:
        if self.ttl_seconds <= 0:
            return None
        key = self.key(request)
        async with self._lock:
            item = self._items.get(key)
            if item is None:
                return None
            created_at, response = item
            if time.monotonic() - created_at > self.ttl_seconds:
                del self._items[key]
                return None
            self._items.move_to_end(key)
            return response.model_copy(deep=True)

    async def set(self, request: TurnRequest, response: TurnResponse) -> None:
        if self.ttl_seconds <= 0:
            return
        key = self.key(request)
        async with self._lock:
            self._items[key] = (time.monotonic(), response.model_copy(deep=True))
            self._items.move_to_end(key)
            while len(self._items) > self.max_entries:
                self._items.popitem(last=False)
