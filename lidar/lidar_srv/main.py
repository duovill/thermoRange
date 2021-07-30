from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from celery import Celery
from pydantic import BaseModel, ValidationError, validator
from ipaddress import IPv4Address
from tasks import measure_volume as measure_volume_task
from typing import List
import json

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Scanner(BaseModel):
    ip: IPv4Address
    port: int

    @validator('port')
    def port_range(cls, v):
        if int(v) < 1 or int(v) > 65535:
            raise ValueError('port must be in 0..65535')
        return v

class PointList(BaseModel):
    points: List[List[int]]

@app.post("/scan")
async def scan(scanner: Scanner):
    # TODO: itt olvassuk be httpn keresztul a scannertol, most egy minta filet hasznalunk
    with open('./testdata.json') as json_file:
        return {"points": json.load(json_file)}

@app.post("/measure")
def measure(points: PointList):
    return {"volume": measure_volume_task(points.points)}
