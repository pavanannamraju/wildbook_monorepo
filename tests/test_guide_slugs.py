from app.domain.guides.catalog_service import allocate_unique_slug, _slugify_reference_name


def test_slugify_name() -> None:
    assert _slugify_reference_name("Ravi Kumar") == "ravi-kumar"
    assert _slugify_reference_name("  Surendra  Wadiwa ") == "surendra-wadiwa"


def test_allocate_unique_slug_suffixes() -> None:
    taken: set[str] = set()
    assert allocate_unique_slug("Ravi Kumar", is_taken=taken.__contains__) == "ravi-kumar"
    taken.add("ravi-kumar")
    assert allocate_unique_slug("Ravi Kumar", is_taken=taken.__contains__) == "ravi-kumar-2"
    taken.add("ravi-kumar-2")
    assert allocate_unique_slug("Ravi Kumar", is_taken=taken.__contains__) == "ravi-kumar-3"
