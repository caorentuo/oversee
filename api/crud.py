from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas, auth

# User CRUD
def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username, 
        name=user.name,
        department=user.department,
        password_hash=hashed_password,
        role="user"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
        
    if user_update.username is not None:
        db_user.username = user_update.username
    if user_update.name is not None:
        db_user.name = user_update.name
    if user_update.department is not None:
        db_user.department = user_update.department
    if user_update.password is not None and user_update.password != "":
        db_user.password_hash = auth.get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

# Task CRUD
def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
    db_task = models.Task(
        name=task.name,
        delivery_date=task.delivery_date,
        status=task.status,
        created_by=user_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Add participants
    if task.participant_ids:
        for p_id in task.participant_ids:
            participant = models.TaskParticipant(task_id=db_task.id, user_id=p_id)
            db.add(participant)
        db.commit()
    
    # 最后再统一 refresh 一次，确保包含 participants
    db.refresh(db_task)
    return db_task

def get_tasks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Task).offset(skip).limit(limit).all()

def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        return None
    
    if task_update.name is not None:
        db_task.name = task_update.name
    if task_update.delivery_date is not None:
        db_task.delivery_date = task_update.delivery_date
    if task_update.status is not None:
        db_task.status = task_update.status
        
    if task_update.participant_ids is not None:
        # Clear existing participants
        db.query(models.TaskParticipant).filter(models.TaskParticipant.task_id == task_id).delete()
        
        # Add new participants
        for p_id in task_update.participant_ids:
            participant = models.TaskParticipant(task_id=task_id, user_id=p_id)
            db.add(participant)
            
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False

# Dashboard/Progress Data
def get_progress_by_person(db: Session):
    users = db.query(models.User).all()
    result = []
    for user in users:
        tasks = []
        for p in user.participations:
            tasks.append(p.task)
        result.append({
            "user_id": user.id,
            "username": user.username,
            "name": user.name,
            "tasks": tasks
        })
    return result

def get_progress_by_project(db: Session):
    tasks = db.query(models.Task).all()
    result = []
    for task in tasks:
        participants = [p.user for p in task.participants]
        result.append({
            "task_id": task.id,
            "task_name": task.name,
            "status": task.status,
            "delivery_date": task.delivery_date,
            "participants": participants
        })
    return result
