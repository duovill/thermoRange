from lidar_lite import Lidar_Lite
import time

lidar = Lidar_Lite()
connected = lidar.connect(1)

if connected < -1:
  print ("Not Connected")

while True:
  print ("{},".format(lidar.getDistance()))
  #print (lidar.getVelocity())
  time.sleep(0.5)
