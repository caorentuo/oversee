from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class UserBase(BaseModel):
    username: str
    name: Optional[str] = None
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class TaskParticipantBase(BaseModel):
    user_id: int

class TaskParticipantResponse(TaskParticipantBase):
    id: int
    task_id: int
    assigned_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    name: str
    delivery_date: date
    status: Optional[str] = "待开始"

class TaskCreate(TaskBase):
    participant_ids: List[int] = []

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    delivery_date: Optional[date] = None
    status: Optional[str] = None
    participant_ids: Optional[List[int]] = None

class TaskResponse(TaskBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    participants: List[TaskParticipantResponse] = []

    class Config:
        from_attributes = True

class ProgressPersonView(BaseModel):
    user_id: int
    username: str
    name: Optional[str] = None
    tasks: List[TaskResponse]

class ProgressProjectView(BaseModel):
    task_id: int
    task_name: str
    status: str
    delivery_date: date
    participants: List[UserResponse]
