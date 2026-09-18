from fastapi import APIRouter, HTTPException
import requests

router = APIRouter(
    prefix="/currency",
    tags=["currency"],
)


@router.get("/rate")
def get_exchange_rate(
    base: str = "INR",
    target: str = "USD",
):
    base = base.upper()
    target = target.upper()

    supported = {"INR", "USD", "EUR"}

    if base not in supported or target not in supported:
        raise HTTPException(
            status_code=400,
            detail="Unsupported currency",
        )

    if base == target:
        return {
            "base": base,
            "target": target,
            "rate": 1,
        }

    try:
        response = requests.get(
            f"https://api.frankfurter.dev/v2/rate/{base}/{target}",
            timeout=5,
        )
        response.raise_for_status()

        data = response.json()

        return {
            "base": base,
            "target": target,
            "rate": data["rate"],
        }

    except requests.RequestException:
        raise HTTPException(
            status_code=503,
            detail="Unable to fetch exchange rate",
        )