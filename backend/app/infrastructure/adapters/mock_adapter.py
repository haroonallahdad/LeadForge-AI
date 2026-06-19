"""
LeadForge AI — Mock Data Adapter
Generates realistic fake business data for development and testing.
Replace with real API adapters in production.

This adapter creates companies that look and behave like real leads,
with varied website quality, ratings, and contact info — ideal for
demonstrating the full pipeline without API keys.
"""
import asyncio
import random
import string
import hashlib
from typing import List, Optional
from app.infrastructure.adapters.base import BaseAdapter, CompanyResult


# ─────────────────────────────────────────────────────────────────────────────
# Industry-specific company name templates
# ─────────────────────────────────────────────────────────────────────────────

COMPANY_PREFIXES = [
    "Premier", "Elite", "Pro", "Advanced", "Superior", "Perfect",
    "Reliable", "Expert", "Master", "Quality", "Prime", "Best",
    "Metro", "City", "Urban", "Regional", "National", "Local",
    "Sunrise", "Summit", "Horizon", "Eagle", "Apex", "Sterling",
    "Prestige", "Heritage", "Pioneer", "Legacy", "Platinum",
]

COMPANY_SUFFIXES = {
    "dental": ["Dental", "Dental Clinic", "Family Dentistry", "Dental Care", "Smiles", "Orthodontics"],
    "law": ["Law Firm", "Legal Services", "Attorneys", "Law Group", "Legal Associates", "Counsel"],
    "roofing": ["Roofing", "Roofing Co.", "Roof Repair", "Roofing Solutions", "Roofing & Construction"],
    "hvac": ["HVAC", "Heating & Cooling", "Air Solutions", "Climate Control", "HVAC Services"],
    "plumbing": ["Plumbing", "Plumbers", "Plumbing Services", "Pipe Solutions", "Drain Experts"],
    "construction": ["Construction", "Builders", "Contractors", "Building Co.", "Construction Group"],
    "real estate": ["Realty", "Real Estate", "Properties", "Real Estate Group", "Homes & Property"],
    "accounting": ["Accounting", "CPA", "Financial Services", "Bookkeeping", "Tax Services"],
    "medical": ["Medical Clinic", "Healthcare", "Medical Center", "Health Services", "Family Medicine"],
    "auto": ["Auto", "Automotive", "Car Center", "Auto Repair", "Motors"],
    "insurance": ["Insurance", "Insurance Agency", "Coverage Solutions", "Insurance Group"],
    "restaurant": ["Restaurant", "Grill", "Kitchen", "Bistro", "Eatery", "Dining"],
    "hotel": ["Hotel", "Inn", "Suites", "Lodge", "Hospitality"],
    "salon": ["Salon", "Hair Studio", "Beauty Salon", "Hair & Beauty", "Spa & Salon"],
    "gym": ["Fitness", "Gym", "Health Club", "Sports Center", "Fitness Studio"],
    "vet": ["Veterinary Clinic", "Animal Hospital", "Pet Care", "Veterinary Services"],
    "cleaning": ["Cleaning", "Cleaning Services", "Clean Solutions", "Janitorial Services"],
    "it": ["Technologies", "Tech Solutions", "IT Services", "Digital Solutions", "Software"],
    "default": ["Solutions", "Services", "Group", "Associates", "Company", "Corp"],
}

OWNER_FIRST_NAMES = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard",
    "Joseph", "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda",
    "Barbara", "Elizabeth", "Susan", "Jessica", "Sarah", "Karen", "Maria",
    "Steve", "Brian", "Kevin", "Timothy", "Mark", "Daniel", "Paul", "Andrew",
]

OWNER_LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
]

STREETS = [
    "Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Elm St", "Park Blvd",
    "Lake Rd", "Hill Dr", "Forest Ave", "River St", "Washington Blvd",
    "Lincoln Ave", "Church St", "Broadway", "5th Ave", "Commerce Dr",
]

TECH_HARBOR_SERVICES = [
    "Web Development",
    "Mobile Application Development",
    "Custom Software Development",
    "Graphic Designing",
    "Social Media Management",
    "Ads Marketing",
    "SEO Services",
    "Cybersecurity Services",
    "Automation Solutions",
]


def _industry_key(industry: str) -> str:
    """Map industry name to template key."""
    lower = industry.lower()
    if "dental" in lower:
        return "dental"
    elif "law" in lower or "legal" in lower or "attorney" in lower:
        return "law"
    elif "roof" in lower:
        return "roofing"
    elif "hvac" in lower or "heat" in lower or "cool" in lower:
        return "hvac"
    elif "plumb" in lower:
        return "plumbing"
    elif "construct" in lower or "builder" in lower:
        return "construction"
    elif "real estate" in lower or "realt" in lower:
        return "real estate"
    elif "account" in lower or "cpa" in lower or "tax" in lower:
        return "accounting"
    elif "medical" in lower or "clinic" in lower or "health" in lower:
        return "medical"
    elif "auto" in lower or "car" in lower:
        return "auto"
    elif "insur" in lower:
        return "insurance"
    elif "restaurant" in lower or "food" in lower or "dining" in lower:
        return "restaurant"
    elif "hotel" in lower or "hospit" in lower:
        return "hotel"
    elif "salon" in lower or "beauty" in lower or "hair" in lower:
        return "salon"
    elif "gym" in lower or "fitness" in lower:
        return "gym"
    elif "vet" in lower or "animal" in lower or "pet" in lower:
        return "vet"
    elif "clean" in lower or "janitor" in lower:
        return "cleaning"
    elif "tech" in lower or "software" in lower or "it " in lower:
        return "it"
    return "default"


def _make_slug(name: str) -> str:
    """Convert company name to URL-friendly slug."""
    slug = name.lower()
    for ch in [" ", "'", ",", ".", "&", "(", ")", "/"]:
        slug = slug.replace(ch, "-")
    slug = slug.strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug


def _deterministic_random(seed: str, n: int) -> random.Random:
    """Create a seeded Random instance for reproducible mock data."""
    seed_int = int(hashlib.md5(seed.encode()).hexdigest(), 16) % (2 ** 32) + n
    return random.Random(seed_int)


class MockAdapter(BaseAdapter):
    """
    Generates realistic fake business data for any industry/location.
    Uses deterministic seeding so the same query always returns the same companies.
    """

    @property
    def source_name(self) -> str:
        return "mock"

    async def search_companies(
        self,
        industry: str,
        city: Optional[str] = None,
        state: Optional[str] = None,
        country: str = "USA",
        limit: int = 50,
    ) -> List[CompanyResult]:
        """Generate realistic mock companies for the given industry/location."""
        # Small delay to simulate real API behavior
        await asyncio.sleep(0.1)

        results = []
        ikey = _industry_key(industry)
        suffixes = COMPANY_SUFFIXES.get(ikey, COMPANY_SUFFIXES["default"])

        for i in range(limit):
            rng = _deterministic_random(f"{industry}-{city}-{state}-{country}", i)

            # Generate company name
            prefix = rng.choice(COMPANY_PREFIXES)
            suffix = rng.choice(suffixes)
            owner_last = rng.choice(OWNER_LAST_NAMES)

            name_style = rng.randint(0, 2)
            if name_style == 0:
                company_name = f"{prefix} {suffix}"
            elif name_style == 1:
                company_name = f"{owner_last} {suffix}"
            else:
                company_name = f"{prefix} {owner_last} {suffix}"

            # Website (60% have one, 40% don't — a key scoring opportunity)
            has_website = rng.random() > 0.40
            website = None
            if has_website:
                domain_slug = _make_slug(company_name)
                tld = rng.choice([".com", ".net", ".biz", ".co"])
                # 30% of sites are low quality (no SSL)
                protocol = "https" if rng.random() > 0.30 else "http"
                website = f"{protocol}://www.{domain_slug}{tld}"

            # Phone
            area_code = rng.randint(200, 999)
            phone = f"({area_code}) {rng.randint(200,999)}-{rng.randint(1000,9999)}"

            # Rating and reviews
            has_reviews = rng.random() > 0.20
            rating = round(rng.uniform(2.8, 5.0), 1) if has_reviews else None
            review_count = rng.randint(1, 450) if has_reviews else None

            # Street address
            street_num = rng.randint(100, 9999)
            street = rng.choice(STREETS)
            address = f"{street_num} {street}, {city or 'Unknown'}, {state or ''}"

            results.append(CompanyResult(
                company_name=company_name,
                source=self.source_name,
                source_id=f"mock_{hashlib.md5(f'{company_name}{city}'.encode()).hexdigest()[:12]}",
                website=website,
                phone=phone,
                address=address,
                city=city,
                state=state,
                country=country,
                rating=rating,
                review_count=review_count,
                industry=industry,
            ))

        return results


class GooglePlacesAdapter(BaseAdapter):
    """
    Google Places API adapter.
    Requires GOOGLE_PLACES_API_KEY in environment.
    Falls back to MockAdapter if no key is configured.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._fallback = MockAdapter()

    @property
    def source_name(self) -> str:
        return "google_maps"

    async def search_companies(
        self,
        industry: str,
        city: Optional[str] = None,
        state: Optional[str] = None,
        country: str = "USA",
        limit: int = 50,
    ) -> List[CompanyResult]:
        """Search Google Places API for businesses."""
        if not self.api_key:
            return await self._fallback.search_companies(industry, city, state, country, limit)

        import httpx
        results = []
        location_str = self.build_location_string(city, state, country)
        query = f"{industry} in {location_str}"

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                # Text search to get place IDs
                response = await client.get(
                    "https://maps.googleapis.com/maps/api/place/textsearch/json",
                    params={
                        "query": query,
                        "key": self.api_key,
                        "type": "establishment",
                    }
                )
                data = response.json()

                for place in data.get("results", [])[:limit]:
                    name = place.get("name", "")
                    website = place.get("website")
                    rating = place.get("rating")
                    review_count = place.get("user_ratings_total")
                    address = place.get("formatted_address", "")
                    place_id = place.get("place_id", "")

                    # Parse location from address
                    addr_parts = address.split(",")
                    parsed_city = addr_parts[-3].strip() if len(addr_parts) >= 3 else city
                    parsed_state = addr_parts[-2].strip().split(" ")[0] if len(addr_parts) >= 2 else state

                    results.append(CompanyResult(
                        company_name=name,
                        source=self.source_name,
                        source_id=place_id,
                        website=website,
                        phone=None,
                        address=address,
                        city=parsed_city or city,
                        state=parsed_state or state,
                        country=country,
                        rating=rating,
                        review_count=review_count,
                        industry=industry,
                    ))

        except Exception as e:
            # Fallback to mock on API error
            return await self._fallback.search_companies(industry, city, state, country, limit)

        return results


def get_adapter(settings) -> BaseAdapter:
    """
    Factory function — returns the appropriate adapter based on configuration.
    Priority: Google Maps (if API key set) → Mock
    """
    if settings.use_mock_adapter or not settings.google_places_api_key:
        return MockAdapter()
    return GooglePlacesAdapter(api_key=settings.google_places_api_key)
