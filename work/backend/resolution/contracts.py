"""Provider-neutral contract. Real providers implement the same async interface as mocks."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class SourceState(StrEnum):
    AVAILABLE = 'AVAILABLE'
    RECORD_FOUND = 'RECORD_FOUND'
    RECORD_NOT_FOUND = 'RECORD_NOT_FOUND'
    TEMPORARILY_UNAVAILABLE = 'TEMPORARILY_UNAVAILABLE'
    PERMANENTLY_UNAVAILABLE = 'PERMANENTLY_UNAVAILABLE'
    ACCESS_DENIED = 'ACCESS_DENIED'
    INVALID_RESPONSE = 'INVALID_RESPONSE'
    TIMEOUT = 'TIMEOUT'
    NOT_APPLICABLE = 'NOT_APPLICABLE'
    IDENTIFIER_INSUFFICIENT = 'IDENTIFIER_INSUFFICIENT'
    UNVERIFIED = 'UNVERIFIED'
    VERIFIED = 'VERIFIED'
    STALE = 'STALE'


class CheckState(StrEnum):
    MATCH = 'MATCH'
    PARTIAL_MATCH = 'PARTIAL_MATCH'
    CONFLICT = 'CONFLICT'
    UNVERIFIED = 'UNVERIFIED'
    NOT_FOUND = 'NOT_FOUND'
    NOT_AVAILABLE = 'NOT_AVAILABLE'
    NOT_APPLICABLE = 'NOT_APPLICABLE'
    INSUFFICIENT_EVIDENCE = 'INSUFFICIENT_EVIDENCE'
    HUMAN_REVIEW_REQUIRED = 'HUMAN_REVIEW_REQUIRED'


@dataclass(frozen=True)
class Capabilities:
    facts: frozenset[str]
    jurisdictions: frozenset[str] = frozenset({'Rajasthan'})
    identifier_sets: tuple[tuple[str, ...], ...] = (('survey_number', 'village', 'tehsil', 'district'),)
    authority: float = .85
    independence_group: str = ''
    max_age_days: int = 365


@dataclass
class SourceResponse:
    status: SourceState
    records: list[dict[str, Any]] = field(default_factory=list)
    message: str = ''


@dataclass(frozen=True)
class Requirement:
    fact: str
    reason: str
    min_sources: int = 1


class SourceAdapter(ABC):
    source_type: str
    source_system: str
    simulated: bool = False

    @abstractmethod
    def get_capabilities(self) -> Capabilities: ...

    @abstractmethod
    async def search_record(self, query: dict) -> SourceResponse: ...

    @abstractmethod
    async def fetch_record(self, identifier: str) -> SourceResponse: ...

    @abstractmethod
    def validate_response(self, record: dict) -> None: ...

    @abstractmethod
    def normalize_record(self, record: dict) -> list[dict]: ...

    def get_source_status(self):
        return SourceState.AVAILABLE

    def get_provenance(self):
        return {'sourceType': self.source_type, 'sourceSystem': self.source_system,
                'simulated': self.simulated, 'contractVersion': '1'}
