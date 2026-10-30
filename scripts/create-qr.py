"""Build the branded QR PNG. Install Pillow and qrcode before running."""
from pathlib import Path
import sys, re, xml.etree.ElementTree as ET
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'.tools/qr'))
import qrcode
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
S=2; W,H=1200,1440
# Flat white canvas; only the existing brand accents appear in decoration.
img=Image.new('RGB',(W*S,H*S),'white')
d=ImageDraw.Draw(img)
# Original LINK paths and ON toggle geometry, with no reshaping.
ox,oy,scale=295,155,610/128
root=ET.parse(ROOT/'public/assets/logo-128-link.svg').getroot()
for path in root.findall('.//{http://www.w3.org/2000/svg}path'):
    tokens=re.findall(r'[MHVLZ]|-?\d+(?:\.\d+)?',path.attrib['d']); points=[]; i=0; x=y=0; command=''
    while i<len(tokens):
        if tokens[i].isalpha(): command=tokens[i];i+=1
        if command=='Z': break
        if command in ('M','L'): x=float(tokens[i]);y=float(tokens[i+1]);i+=2
        elif command=='H': x=float(tokens[i]);i+=1
        elif command=='V': y=float(tokens[i]);i+=1
        points.append(((ox+x*scale)*S,(oy+(y+1.56)*scale)*S))
    d.polygon(points,fill=path.attrib['fill'])
def logo_box(x,y,w,h):return ((ox+x*scale)*S,(oy+y*scale)*S,(ox+(x+w)*scale)*S,(oy+(y+h)*scale)*S)
d.rounded_rectangle(logo_box(87.37,4.61,40.635,20.317),radius=10.1585*scale*S,fill='#00aef3')
d.ellipse(logo_box(110.05,6.98,15.577,15.577),fill='white')
d.ellipse(logo_box(116.49,13.41,2.709,2.709),fill='#ef028d')
on_font=Path('C:/Windows/Fonts/arialbd.ttf')
if not on_font.exists(): on_font=ROOT/'public/fonts/NotoSansKR-VF.ttf'
font=ImageFont.truetype(str(on_font),round(8.8*scale*S))
d.text(((ox+99.42*scale)*S,(oy+14.77*scale)*S),'ON',font=font,fill='#003cdc',anchor='mm')
font=ImageFont.truetype(str(ROOT/'public/fonts/NotoSansKR-VF.ttf'),36*S)
font.set_variation_by_axes([500])
d.text((600*S,342*S),'나에게 맞는 혜택, 알아서 LINK!',font=font,fill='#111315',anchor='mm')
# Two solid shapes frame the white scan area without outlining it.
# Both sit outside the full four-module quiet zone.
d.ellipse((-110*S,704*S,210*S,1024*S),fill='#00aef3')
d.rounded_rectangle((1000*S,1190*S,1120*S,1310*S),radius=32*S,fill='#ef028d')
qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H,border=4)
qr.add_data('https://link-on.kro.kr/');qr.make(fit=True)
m=qr.get_matrix();n=len(m);unit=18;startx=(W-n*unit)/2;starty=890-n*unit/2
for row,line in enumerate(m):
 for col,on in enumerate(line):
  if not on:continue
  a,b=col-4,row-4;side=n-8
  finder=(a<7 and b<7) or (a>=side-7 and b<7) or (a<7 and b>=side-7)
  color='#003cdc' if finder else '#111315'
  x,y=(startx+col*unit)*S,(starty+row*unit)*S
  d.rectangle((x,y,x+unit*S-1,y+unit*S-1),fill=color)
img=img.convert('RGB').resize((W,H),Image.Resampling.LANCZOS)
output=ROOT/'docs/assets/LINK-ON-QR.png';img.save(output,dpi=(300,300),optimize=True)
print(f'{output} | {W}x{H} | modules: {n-8} | quiet zone: 4 | ECC H')
