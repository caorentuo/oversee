from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import database, schemas, crud, models, auth

router = APIRouter(
    prefix="/api/progress",
    tags=["Progress"]
)

@router.get("/person", response_model=List[schemas.ProgressPersonView])
def get_progress_person(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_progress_by_person(db)

@router.get("/project", response_model=List[schemas.ProgressProjectView])
def get_progress_project(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_progress_by_project(db)
