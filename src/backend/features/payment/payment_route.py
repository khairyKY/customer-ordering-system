from fastapi import APIRouter, Header, HTTPException, Depends
from .payment_controller import process_payment
from .payment_schema import PaymentRequest

router = APIRouter(prefix="/api/payment", tags=["payment"])

# Mock protect_route dependency from Member D (Auth Slice)
async def protect_route(authorization: str = Header(None)):
    if authorization:
        return True
    raise HTTPException(status_code=401, detail="Unauthorized")

@router.post("/process")
async def process_payment_endpoint(
    request_data: PaymentRequest, 
    _auth: bool = Depends(protect_route)
):
    try:
        result = await process_payment(request_data.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
