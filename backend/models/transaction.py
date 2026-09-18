from datetime import datetime, date

from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)

    amount = Column(Numeric(12, 2), nullable=False)

    status = Column(
        String(50),
        nullable=False,
        default="Completed",
    )

    type = Column(
        String(20),
        nullable=False,
    )

    icon = Column(
        String(100),
        nullable=False,
        default="receipt_long",
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    user = relationship("User", back_populates="transactions")