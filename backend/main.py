from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.currency import router as currency_router

from database import Base, engine
from routers.auth import router as auth_router
from routers.budgets import router as budgets_router
from routers.transactions import router as transactions_router
from models.budget import Budget
from models.transaction import Transaction

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)


app.include_router(auth_router)
app.include_router(budgets_router)
app.include_router(transactions_router)
app.include_router(currency_router)


@app.get("/")
def read_root():
    return {
        "message": "BudgetFlow backend is running!"
    }
