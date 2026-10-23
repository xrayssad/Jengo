from pydantic import BaseModel
from typing import Optional, List

class RegisterIn(BaseModel):
    email: str
    password: str
    full_name: str = ""

class LoginIn(BaseModel):
    email: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: Optional[str] = None
    email: Optional[str] = None

class ListingIn(BaseModel):
    category: str
    title: str
    description: str = ""
    price: float
    period: str
    location: str
    city: str = "Dar es Salaam"
    images: List[str] = []

class BookingIn(BaseModel):
    listing_id: str
    message: str = ""
