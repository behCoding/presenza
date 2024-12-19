import os
from dotenv import load_dotenv
from pydantic import BaseSettings  #Install pydantic v.1.*


# Load environment variables from the .env file
load_dotenv()

# set SECRET_KEY='bee2eff3492c7e0ed089acc1c7ae213edf8be4ecbfa5226fead016a4fdbe4fecdd6089282dcdb6898be5ad2a20b8db828ad5c9be16765875f8d4baca2d4048563b7819c0b75986a8d06b244f5cd9ae33fd85539ef99fb57b53b71ee8eda1e1048b8bdc5091e982409f914c9b5680a87de4d78e24031a7170fbea39c0012f03b6a255053a3cb589e567a20b2cc2e97db9a89f8b9d61a0bbbf18c0f6504a12ff53e5cef9043aca11440f98e724c77d01e02bbdf06e2f3a4165ef191281568e9c951d1c451b7043e1b337c0817b20bf28c003538305b8d9585c463da9ae13450b0c40d1c734253ebd5b32a6f15dc6f3ae946365145836b27e31d5fd976f25473243'
# set DATABASE_URL= "postgresql://postgres:behrad6623@localhost/presenza"
# set ALGORITHM= "HS256" or export for linux
ACCESS_TOKEN_EXPIRE_MINUTES = 60

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:Storelink2024@localhost/presenza")
    SECRET_KEY: str = os.getenv("SECRET_KEY", 'bee2eff3492c7e0ed089acc1c7ae213edf8be4ecbfa5226fead016a4fdbe4fecdd6089282dcdb6898be5ad2a20b8db828ad5c9be16765875f8d4baca2d4048563b7819c0b75986a8d06b244f5cd9ae33fd85539ef99fb57b53b71ee8eda1e1048b8bdc5091e982409f914c9b5680a87de4d78e24031a7170fbea39c0012f03b6a255053a3cb589e567a20b2cc2e97db9a89f8b9d61a0bbbf18c0f6504a12ff53e5cef9043aca11440f98e724c77d01e02bbdf06e2f3a4165ef191281568e9c951d1c451b7043e1b337c0817b20bf28c003538305b8d9585c463da9ae13450b0c40d1c734253ebd5b32a6f15dc6f3ae946365145836b27e31d5fd976f25473243')
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(ACCESS_TOKEN_EXPIRE_MINUTES)

    class Config:
        case_sensitive = True


settings = Settings()
