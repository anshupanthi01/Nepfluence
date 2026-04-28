from pydantic import BaseModel, ConfigDict

class APIModel(BaseModel):
    # Allows returning SQLAlchemy objects directly in FastAPI responses
    model_config = ConfigDict(from_attributes=True)