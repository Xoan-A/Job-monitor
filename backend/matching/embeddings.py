from __future__ import annotations

import logging
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

_model = None


def preload_model():
    global _model
    if _model is not None:
        return
    try:
        from fastembed import TextEmbedding
        _model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")
        logger.info("Preloaded embedding model: all-MiniLM-L6-v2")
    except Exception as e:
        logger.warning("Failed to preload embedding model: %s", e)


def _get_model():
    global _model
    if _model is None:
        preload_model()
    return _model


def generate_embedding(text: str) -> Optional[bytes]:
    model = _get_model()
    if model is None:
        return None
    if not text or not text.strip():
        return None
    try:
        embeddings = list(model.embed([text]))
        if embeddings:
            vec = np.array(embeddings[0], dtype=np.float32)
            return vec.tobytes()
    except Exception as e:
        logger.error("Embedding generation failed: %s", e)
    return None


def cosine_similarity(a: Optional[bytes], b: Optional[bytes]) -> Optional[float]:
    if a is None or b is None:
        return None
    try:
        vec_a = np.frombuffer(a, dtype=np.float32)
        vec_b = np.frombuffer(b, dtype=np.float32)
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
    except Exception:
        return None


def embedding_to_list(embedding_bytes: Optional[bytes]) -> Optional[list]:
    if embedding_bytes is None:
        return None
    try:
        vec = np.frombuffer(embedding_bytes, dtype=np.float32)
        return vec.tolist()
    except Exception:
        return None


def list_to_embedding(embedding_list: Optional[list]) -> Optional[bytes]:
    if embedding_list is None:
        return None
    try:
        vec = np.array(embedding_list, dtype=np.float32)
        return vec.tobytes()
    except Exception:
        return None
