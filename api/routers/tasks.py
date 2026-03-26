from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import database, schemas, crud, models, auth

router = APIRouter(
    prefix="/api/tasks",
    tags=["Tasks"]
)

@router.post("/", response_model=schemas.TaskResponse)
def create_task(task: schemas.TaskCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to create tasks")
    try:
        return crud.create_task(db=db, task=task, user_id=current_user.id)
    except Exception as e:
        print(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[schemas.TaskResponse])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # \u53ea\u6709\u7ba1\u7406\u5458\u53ef\u4ee5\u67e5\u770b\u6240\u6709\u4efb\u52a1\uff0c\u666e\u901a\u7528\u6237\u53ef\u80fd\u53ea\u9700\u8981\u67e5\u770b\u81ea\u5df1\u7684\u4efb\u52a1\uff0c\u4f46\u6839\u636e\u9700\u6c42\uff0c\u8fdb\u5ea6\u662f\u516c\u5f00\u7684\uff0c\u6240\u4ee5\u8fd9\u91cc\u4fdd\u7559
    return crud.get_tasks(db, skip=skip, limit=limit)

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update tasks")
    db_task = crud.update_task(db, task_id, task)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete tasks")
    success = crud.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}
