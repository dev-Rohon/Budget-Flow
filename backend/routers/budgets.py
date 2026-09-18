from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.budget import Budget
from models.user import User
from schemas.budget import BudgetCreate, BudgetResponse
from utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/budgets",
    tags=["budgets"],
)


@router.post(
    "",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_budget = (
        db.query(Budget)
        .filter(
            Budget.category == payload.category,
            Budget.user_id == current_user.id,
        )
        .first()
    )

    if existing_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A budget for this category already exists",
        )

    budget = Budget(
        user_id=current_user.id,
        name=payload.name,
        category=payload.category,
        total=payload.total,
        icon=payload.icon,
        color=payload.color,
    )

    db.add(budget)
    db.commit()
    db.refresh(budget)

    return budget


@router.get(
    "",
    response_model=list[BudgetResponse],
)
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id)
        .order_by(Budget.created_at.desc())
        .all()
    )


@router.put(
    "/{budget_id}",
    response_model=BudgetResponse,
)
def update_budget(
    budget_id: int,
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == current_user.id,
        )
        .first()
    )

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )

    duplicate_budget = (
        db.query(Budget)
        .filter(
            Budget.category == payload.category,
            Budget.user_id == current_user.id,
            Budget.id != budget_id,
        )
        .first()
    )

    if duplicate_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A budget for this category already exists",
        )

    budget.name = payload.name
    budget.category = payload.category
    budget.total = payload.total
    budget.icon = payload.icon
    budget.color = payload.color

    db.commit()
    db.refresh(budget)

    return budget


@router.delete(
    "/{budget_id}",
)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == current_user.id,
        )
        .first()
    )

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )

    db.delete(budget)
    db.commit()

    return {
        "message": "Budget deleted successfully"
    }