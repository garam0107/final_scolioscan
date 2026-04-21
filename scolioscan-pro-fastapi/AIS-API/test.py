
# import cv2
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
from tensorflow.keras.models import model_from_json
model3 = model_from_json(open('./keypointsmodel/keypoints_architecture.json').read()) 
model3.load_weights("./keypointsmodel/keypoints_weigts.hdf5")




index=178

test_image_path = "F:/cyx/20250611_cyx_ais/work_260304/renqubeijin/194.png"

img = Image.open(test_image_path).convert('RGB')
h, w, _ = np.array(img).shape 

b_cx, b_cy = w / 2, h / 2  # 中心点
b_w, b_h = w, h  # 整张图片的宽高

img_resized = np.array(img.resize((256, 256))) / 255.0
img_resized = np.expand_dims(img_resized, axis=0)
   
   




# 预测关键点
predictions0 = model3.predict(img_resized.reshape(1,256,256,3)) # 模型输出归一化坐标

predictions0.shape

# predictions0=y_nor[0]

# y_nor[0].shape
u0,v0=np.split(predictions0,2,axis=-1)





def denor(x,maxn, minn):
# xx=(x-minn)/(maxn-minn)
    xx=x*(maxn-minn)+minn


    return xx


umin =-0.46649292628443784
umax =0.36221122112211224
vmin =-0.2185929648241206
vmax =0.4490084985835694









# umin1= -0.43354430379746833
# umax1= 0.35561497326203206
# vmin1= -0.11611374407582939
# vmax1= 0.4027777777777778

y_nor10=denor(u0,umax,umin)
y_nor20=denor(v0,vmax,vmin)
y_nor20.shape
y_nor0=np.concatenate((y_nor10,y_nor20),axis=-1).reshape(10,2)
y_nor0.shape




# y_nor0=Y[0].reshape(10,2)
keypoints_normalized = np.zeros((10,2))
keypoints_normalized[:, 0] = y_nor0[:, 0] * b_w + b_cx
keypoints_normalized[:, 1] = -y_nor0[:, 1] * b_h + b_cy





keypoints3 = keypoints_normalized.reshape(10, 2)











import matplotlib.pyplot as plt
import matplotlib.image as mpimg

# 你的点的坐标，假设是 (x, y) 格式
# points1 = keypoints1
# points2 = keypoints2
points3 = keypoints3
img = mpimg.imread(test_image_path)

# 创建一个图形
fig, ax = plt.subplots()

# 显示图片
ax.imshow(img)

x_coords3, y_coords3 = zip(*points3)
import numpy as np

# 假设 x_coords3 和 y_coords3 已经是长度为 10 的列表或 numpy 数组
x_coords3 = np.array(x_coords3)
y_coords3 = np.array(y_coords3)

import numpy as np

# 假设 x_coords3 和 y_coords3 已经是包含 10 个元素的列表或数组
x_coords3 = np.array(x_coords3)
y_coords3 = np.array(y_coords3)

angles_degrees = []

# 一共 5 组
for i in range(4):
    # j 是与 i 配对的另一个点的索引 (0配9, 1配8, 2配7, 3配6, 4配5)
    j = 9 - i 
    
    x1, y1 = x_coords3[i], y_coords3[i]
    x2, y2 = x_coords3[j], y_coords3[j]
    
    # 计算 x 和 y 的差值 (向量指向：从点 i 指向点 j)
    dx = x2 - x1
    
    # 【注意】：图像坐标系 Y 轴是向下的。
    # 用 y1 - y2 是把 Y 轴反转回我们数学上习惯的“向上为正”，这样算出来的角度符合直觉
    # 如果你想严格按照图像像素坐标系的原始方向，请改成 dy = y2 - y1
    dy = y1 - y2  
    
    # 计算夹角（np.arctan2 自动处理象限问题，范围在 -180 到 180 之间）
    angle_rad = np.arctan2(dy, dx)
    angle_deg = abs(np.degrees(angle_rad))
    
    angles_degrees.append(angle_deg)
    
    print(f"第 {i+1} 组 (点{i+1} 和 点{j+1}) 的夹角为: {angle_deg:.2f}°")
print("ave angle")
print(np.mean(angles_degrees))
# angles_degrees = np.abs(np.array(angles_degrees))

# ax.scatter(x_coords3, y_coords3, color='orange', s=4, label='Points')
# # 关闭坐标轴
# ax.axis('off')

# # 保存修改后的图片
# plt.savefig('image_with_points'+str(index)+'.png', bbox_inches='tight', pad_inches=0,dpi=300)

# # 显示图像
# plt.show()







