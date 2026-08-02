import asyncio
import hashlib
import math
import sqlite3
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path

from app.core.config import Settings


class PublicBudgetExhausted(Exception):
    pass


@dataclass(frozen=True)
class PublicBudgetSnapshot:
    enabled: bool
    budget_cny: float
    estimated_turn_cost_cny: float
    used_turns: int
    remaining_turns: int | None
    per_client_turn_limit: int


class PublicApiBudget:
    """Persistent, conservative request budget for an optional public backend.

    Each accepted AI turn reserves a fixed estimated cost before calling either
    provider. The database is deliberately free of raw IP addresses and user
    content. Provider-side account balance remains the final billing hard stop.
    """

    def __init__(self, settings: Settings):
        self.budget_cny = max(0.0, settings.public_ai_budget_cny)
        self.estimated_turn_cost_cny = max(
            0.001, settings.public_ai_estimated_turn_cost_cny
        )
        self.per_client_turn_limit = max(1, settings.public_ai_turns_per_client)
        self.database_path = Path(settings.public_ai_budget_db_path)
        self.salt = settings.public_ai_client_hash_salt or "cantonese-biz-public-demo"
        self._lock = asyncio.Lock()

    @property
    def enabled(self) -> bool:
        return self.budget_cny > 0

    @property
    def max_turns(self) -> int:
        if not self.enabled:
            return 0
        return max(
            1,
            math.floor(
                Decimal(str(self.budget_cny))
                / Decimal(str(self.estimated_turn_cost_cny))
            ),
        )

    def _client_hash(self, client_key: str) -> str:
        return hashlib.sha256(f"{self.salt}:{client_key}".encode()).hexdigest()

    def _connect(self) -> sqlite3.Connection:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.database_path, timeout=10)
        connection.execute(
            "CREATE TABLE IF NOT EXISTS budget (id INTEGER PRIMARY KEY CHECK (id = 1), used_turns INTEGER NOT NULL)"
        )
        connection.execute(
            "CREATE TABLE IF NOT EXISTS client_budget (client_hash TEXT PRIMARY KEY, used_turns INTEGER NOT NULL)"
        )
        connection.execute("INSERT OR IGNORE INTO budget (id, used_turns) VALUES (1, 0)")
        connection.commit()
        return connection

    def _reserve_sync(self, client_hash: str) -> PublicBudgetSnapshot:
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            used_turns = int(
                connection.execute(
                    "SELECT used_turns FROM budget WHERE id = 1"
                ).fetchone()[0]
            )
            client_row = connection.execute(
                "SELECT used_turns FROM client_budget WHERE client_hash = ?",
                (client_hash,),
            ).fetchone()
            client_turns = int(client_row[0]) if client_row else 0
            if used_turns >= self.max_turns or client_turns >= self.per_client_turn_limit:
                raise PublicBudgetExhausted
            connection.execute(
                "UPDATE budget SET used_turns = used_turns + 1 WHERE id = 1"
            )
            connection.execute(
                "INSERT INTO client_budget (client_hash, used_turns) VALUES (?, 1) "
                "ON CONFLICT(client_hash) DO UPDATE SET used_turns = used_turns + 1",
                (client_hash,),
            )
            return self._snapshot_sync(connection)

    def _snapshot_sync(
        self, connection: sqlite3.Connection | None = None
    ) -> PublicBudgetSnapshot:
        if not self.enabled:
            return PublicBudgetSnapshot(
                enabled=False,
                budget_cny=0,
                estimated_turn_cost_cny=self.estimated_turn_cost_cny,
                used_turns=0,
                remaining_turns=None,
                per_client_turn_limit=self.per_client_turn_limit,
            )
        owns_connection = connection is None
        active = connection or self._connect()
        try:
            used_turns = int(
                active.execute(
                    "SELECT used_turns FROM budget WHERE id = 1"
                ).fetchone()[0]
            )
        finally:
            if owns_connection:
                active.close()
        return PublicBudgetSnapshot(
            enabled=True,
            budget_cny=self.budget_cny,
            estimated_turn_cost_cny=self.estimated_turn_cost_cny,
            used_turns=used_turns,
            remaining_turns=max(0, self.max_turns - used_turns),
            per_client_turn_limit=self.per_client_turn_limit,
        )

    async def reserve(self, client_key: str) -> PublicBudgetSnapshot:
        if not self.enabled:
            return await self.snapshot()
        async with self._lock:
            return await asyncio.to_thread(
                self._reserve_sync, self._client_hash(client_key)
            )

    async def snapshot(self) -> PublicBudgetSnapshot:
        if not self.enabled:
            return self._snapshot_sync()
        async with self._lock:
            return await asyncio.to_thread(self._snapshot_sync)
