from pathlib import Path
from rembg import remove, new_session
from PIL import Image
from io import BytesIO

input_folder = Path("club-logos-original")
output_folder = Path("club-logos-transparent")

output_folder.mkdir(exist_ok=True)

session = new_session("u2net")

files = list(input_folder.glob("*.png"))

print(f"Найдено эмблем: {len(files)}")

for file in files:
    try:
        image = Image.open(file).convert("RGBA")

        result = remove(image, session=session)

        output_path = output_folder / file.name
        result.save(output_path, format="PNG")

        print(f"Готово: {file.name}")

    except Exception as error:
        print(f"Ошибка {file.name}: {error}")

print("Обработка завершена!")