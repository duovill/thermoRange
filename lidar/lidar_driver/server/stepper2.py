import time
import board
from adafruit_motorkit import MotorKit
from adafruit_motor import stepper

kit = MotorKit(i2c=board.I2C())

def vertical():
	for i in range(100):
		kit.stepper1.onestep()
		time.sleep(0.02)

# for i in range(3):
# 	kit.stepper2.onestep()
# 	# vertical()
# 	time.sleep(0.08)

for i in range(5000):
	kit.stepper2.onestep(style=4)

	# vertical()
	# time.sleep(0.01)

kit.stepper1.release()
kit.stepper2.release()

print("deinit", kit._pca.deinit())
