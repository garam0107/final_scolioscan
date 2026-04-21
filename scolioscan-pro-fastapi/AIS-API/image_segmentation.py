from rembg import remove
from PIL import Image
import numpy as np
import os
import time
import io
from tqdm import tqdm
import concurrent.futures

def process_image(args):
    """处理单个图像并裁剪白边"""
    input_path, output_path = args
    try:
        # 打开图像
        img = Image.open(input_path).convert("RGBA")

        # 限制尺寸（可选）
        max_size = 2000
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = tuple(int(dim * ratio) for dim in img.size)
            img = img.resize(new_size, Image.LANCZOS)

        # 去背景
        img_no_bg = remove(img)

        # 合成白背景
        white_bg = Image.new("RGB", img_no_bg.size, (255, 255, 255))
        white_bg.paste(img_no_bg, mask=img_no_bg.split()[3])

        # ---------- 裁剪非白边区域 ----------
        np_img = np.array(white_bg)
        mask = np.any(np_img != [255, 255, 255], axis=-1)
        coords = np.argwhere(mask)

        if coords.size > 0:
            y0, x0 = coords.min(axis=0)
            y1, x1 = coords.max(axis=0) + 1
            cropped = white_bg.crop((x0, y0, x1, y1))
        else:
            cropped = white_bg  # 若全白，返回原图

        # 保存图像
        cropped.save(output_path, format="JPEG", quality=95)
        return True

    except Exception as e:
        print(f"process img {os.path.basename(input_path)} error: {str(e)}")
        return False

def run_image_segmentation(opt):
    input_folder = os.path.join(opt.basepath, "initial_img")
    output_folder = os.path.join(opt.basepath, "output_frames_seg")
    os.makedirs(output_folder, exist_ok=True)

    # 收集图像路径对
    image_pairs = []
    for filename in os.listdir(input_folder):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            input_path = os.path.join(input_folder, filename)
            output_path = os.path.join(output_folder, filename)
            image_pairs.append((input_path, output_path))

    start_time = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = list(tqdm(executor.map(process_image, image_pairs),
                            total=len(image_pairs),
                            desc="processing"))

    total_time = time.time() - start_time
    successful = sum(results)
    failed = len(results) - successful

    print("\ndone!")
    print(f"img num: {len(image_pairs)}")
    print(f"success: {successful}")
    print(f"fail: {failed}")
    print(f"time: {total_time:.2f}s")
    print(f"ave time: {total_time / len(image_pairs):.2f}s")


def process_image_bytes(image_bytes: bytes) -> Image.Image:
    """Run background removal and crop in-memory for a single image."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    max_size = 2000
    if max(img.size) > max_size:
        ratio = max_size / max(img.size)
        new_size = tuple(int(dim * ratio) for dim in img.size)
        img = img.resize(new_size, Image.LANCZOS)

    img_no_bg = remove(img)
    white_bg = Image.new("RGB", img_no_bg.size, (255, 255, 255))
    white_bg.paste(img_no_bg, mask=img_no_bg.split()[3])

    np_img = np.array(white_bg)
    mask = np.any(np_img != [255, 255, 255], axis=-1)
    coords = np.argwhere(mask)

    if coords.size > 0:
        y0, x0 = coords.min(axis=0)
        y1, x1 = coords.max(axis=0) + 1
        return white_bg.crop((x0, y0, x1, y1))
    return white_bg

def run_image_segmentation_raw(image_bytes: bytes) -> Image.Image:
    """Process a single raw image file and return the segmented PIL image."""
    return process_image_bytes(image_bytes)

