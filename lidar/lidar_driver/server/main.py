from lidar_lite import Lidar_Lite
import time
import board
from adafruit_motorkit import MotorKit
from adafruit_motor import stepper
import math
from fastapi import FastAPI

app = FastAPI()

kit = MotorKit(i2c=board.I2C())

lidar = Lidar_Lite()
connected = lidar.connect(1)

if connected < -1:
  print("Not Connected")

rad = 0.0174532925
N = 200*2 # vizszintes motor lepesszam egy teljes fordulat alatt

@app.get("/scan")
def scan():
  r = []
  for i in range(100):
      for j in range(N):
          kit.stepper1.onestep(style=3)
          try:
            d = lidar.getDistance()
          except Exception:
            print("lidar read exception")

          a0 = i*rad*1.8/2
          a1 = j*rad*1.8
          
          x = d*math.sin(a0)*math.cos(a1)
          y = d*math.sin(a0)*math.sin(a1)
          z = d*math.cos(a0)

          r.append([x, y, z])
          print("{},{},{}".format(x, y, z))

      kit.stepper2.onestep(style=1)

  print("done")

  kit.stepper1.release()
  kit.stepper2.release()
  kit._pca.deinit()
  print("motors released")

  return {"points": r}

