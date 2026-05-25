import os
import shutil
from pathlib import Path

def main():
    base_dir = Path(r"c:\Users\Farex\Desktop\ảnh 12 a2")
    src_dir = base_dir / "photos" / "PTS"
    
    drives = [
        {"path": base_dir / "Drive_1", "size": 0, "limit": 12.5 * 1024**3}, # ~12.5GB limit
        {"path": base_dir / "Drive_2", "size": 0, "limit": 12.5 * 1024**3},
        {"path": base_dir / "Drive_3", "size": 0, "limit": 15.0 * 1024**3}
    ]
    
    # Lấy tất cả ảnh
    files = []
    for p in src_dir.rglob("*"):
        if p.is_file() and p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
            files.append(p)
            
    # Sort files by size or just alphabetically
    files.sort(key=lambda x: str(x))
    
    print(f"Bắt đầu copy {len(files)} ảnh vào 3 Drive...")
    
    drive_idx = 0
    done = 0
    
    for f in files:
        size = f.stat().st_size
        
        # Nếu Drive hiện tại vượt quá limit thì chuyển sang Drive tiếp theo
        if drives[drive_idx]["size"] + size > drives[drive_idx]["limit"] and drive_idx < 2:
            drive_idx += 1
            
        target_drive = drives[drive_idx]["path"]
        rel_path = f.relative_to(src_dir)
        target_file = target_drive / rel_path
        
        target_file.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, target_file)
        
        drives[drive_idx]["size"] += size
        done += 1
        
        if done % 100 == 0 or done == len(files):
            print(f"Đã copy {done}/{len(files)} ảnh...")
            
    print("\nHOÀN TẤT PHÂN CHIA!")
    for i, d in enumerate(drives, 1):
        gb = d['size'] / (1024**3)
        print(f"Drive_{i}: {gb:.2f} GB")

if __name__ == "__main__":
    main()
