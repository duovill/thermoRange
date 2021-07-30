from lidar_lite import Lidar_Lite
import time
import board
from adafruit_motorkit import MotorKit
from adafruit_motor import stepper

kit = MotorKit(i2c=board.I2C())

kit.stepper1.release()
kit.stepper2.release()

print("deinit", kit._pca.deinit())