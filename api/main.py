from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, database, auth
from .routers import auth as auth_router, tasks, progress, users

# 创建数据库表
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="任务进度监督工具 API")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://127.0.0.1:5174", "http://127.0.0.1:5175"], # 前端开发地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(progress.router)

# 初始化管理员账号
@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        # Check for new admin
        admin_user = auth.get_user_by_username(db, "caorentuo")
        if not admin_user:
            hashed_password = auth.get_password_hash("linkinpark1")
            new_admin = models.User(username="caorentuo", name="曹任拓", department="管理层", password_hash=hashed_password, role="admin")
            db.add(new_admin)
            db.commit()
            print("Admin user created: caorentuo")
            
        # 移除旧的 admin 账号（如果存在）
        old_admin = auth.get_user_by_username(db, "admin")
        if old_admin:
            db.delete(old_admin)
            db.commit()
            print("Old admin user removed")
            
    except Exception as e:
        print(f"Error during startup: {e}")
        db.rollback()
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Task Progress API"}
