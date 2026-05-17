from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router as tickets_router

app = FastAPI(title="Ticket System API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(tickets_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
