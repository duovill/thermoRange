from celery import Celery
import numpy as np
from typing import List
import open3d as o3d
from pyntcloud import PyntCloud

app = Celery('tasks', result_backend='redis://localhost:6379/0', broker='redis://localhost:6379/0')

@app.task
def measure_volume(points: List[List[int]]):
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(np.array(points))

    cloud = PyntCloud.from_instance("open3d", pcd)
    convex_hull_id = cloud.add_structure("convex_hull")
    convex_hull = cloud.structures[convex_hull_id]
    volume = convex_hull.volume 

    return volume