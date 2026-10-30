"""Export the archived eight-slide PDF for the web viewer (Poppler + Pillow)."""
from pathlib import Path
import json
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools/qr'))
from PIL import Image

slides = json.loads((ROOT / 'docs/reference/detailed-plan-text.json').read_text(encoding='utf-8'))['slides']
output = ROOT / 'public/slides'
output.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix='link-on-slides-') as folder:
    subprocess.run(['pdftoppm', '-png', '-scale-to-x', '1920', '-scale-to-y', '-1', str(ROOT / 'docs/reference/LINK_ON_Detailed_Plan.pdf'), str(Path(folder) / 'slide')], check=True)
    pages = sorted(Path(folder).glob('slide-*.png'))
    if len(pages) != 8 or len(slides) != 8:
        raise ValueError('The viewer requires the eight archived slides in order.')
    manifest = []
    for number, (page, slide) in enumerate(zip(pages, slides), 1):
        image = Image.open(page).convert('RGB')
        name = f'slide-{number:02}.webp'
        image.save(output / name, format='WEBP', lossless=True, method=6)
        manifest.append({'number': number, 'title': slide['name'].split(' · ', 1)[-1], 'src': '/slides/' + name, 'width': image.width, 'height': image.height, 'text': '\n'.join(slide['text'])})
    (ROOT / 'src/plan-slides.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print('Exported 8 slides. The source PDF was not changed.')
