"""
LeadForge AI — Scraping Adapter Base Class
All source adapters (Google Maps, Yelp, Mock, etc.) must implement this interface.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class CompanyResult:
    """
    Standardized company data returned by any adapter.
    All fields are optional except company_name and source.
    """
    company_name: str
    source: str  # "google_maps", "yelp", "yellow_pages", "mock"
    source_id: Optional[str] = None

    # Online presence
    website: Optional[str] = None
    phone: Optional[str] = None

    # Location
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None

    # Reviews
    rating: Optional[float] = None
    review_count: Optional[int] = None

    # Additional
    description: Optional[str] = None
    industry: Optional[str] = None
    categories: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "company_name": self.company_name,
            "source": self.source,
            "source_id": self.source_id,
            "website": self.website,
            "phone": self.phone,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "zip_code": self.zip_code,
            "rating": self.rating,
            "review_count": self.review_count,
            "description": self.description,
            "industry": self.industry,
        }


class BaseAdapter(ABC):
    """
    Abstract base class for all lead source adapters.
    Implement this interface to add new data sources.
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Identifier for this adapter (e.g. 'google_maps')."""
        ...

    @abstractmethod
    async def search_companies(
        self,
        industry: str,
        city: Optional[str] = None,
        state: Optional[str] = None,
        country: str = "USA",
        limit: int = 50,
    ) -> List[CompanyResult]:
        """
        Search for companies by industry and location.

        Args:
            industry: Industry name (e.g., "Dental Clinics", "Roofing Companies")
            city: Target city
            state: Target state/province
            country: Target country
            limit: Max results to return

        Returns:
            List of CompanyResult objects
        """
        ...

    def build_location_string(
        self,
        city: Optional[str],
        state: Optional[str],
        country: str,
    ) -> str:
        """Build a standardized location query string."""
        parts = [p for p in [city, state, country] if p]
        return ", ".join(parts)
