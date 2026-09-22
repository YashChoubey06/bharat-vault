"""Register real provider factories here without changing the resolution algorithm."""
from .contracts import SourceAdapter

_factories = []


def register(factory):
    """A factory must create a SourceAdapter with bounded asynchronous I/O."""
    if factory not in _factories:
        _factories.append(factory)


def configured():
    adapters = [factory() for factory in _factories]
    if any(not isinstance(adapter, SourceAdapter) for adapter in adapters):
        raise TypeError('Configured providers must implement SourceAdapter')
    return adapters
