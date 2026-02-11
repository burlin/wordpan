from pydantic import BaseModel, Field
from typing import List, Dict


class WordPairEnrichmentOutput(BaseModel):
    """Schema for word pair enrichment output."""

    examples: List[str] = Field(
        ...,
        description="Example sentences that include both words"
    )
    similar_words: Dict[str, List[str]] = Field(
        ...,
        description="Similar words for each input word"
    )
    paraphrases: List[str] = Field(
        ...,
        description="Paraphrased versions of the examples"
    )
