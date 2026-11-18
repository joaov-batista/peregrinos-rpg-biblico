#!/usr/bin/env python3
"""Gera as mídias do site (public/site/) a partir da mesma gravação do trailer:
os clipes curtos de cada chefe (mudos, em laço), os pôsteres, as imagens da galeria e as versões leves dos trailers.

Uso: python3 scripts/site-midia.py <pasta dos quadros> <pasta dos trailers> <public/site>
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

QUADROS, TRAILERS, SITE = sys.argv[1:4]
os.makedirs(SITE, exist_ok=True)
D = json.load(open(os.path.join(QUADROS, 'cenas.json')))
FPS = D['fps']
q = lambda n: os.path.join(QUADROS, '%05d.jpg' % n)
def limpo(n, raio=15):  # perto do quadro n, o que tem menos branco (o chefe pisca branco quando leva golpe)
  def branco(k):
    return int((np.asarray(Image.open(q(k)).convert('L').resize((320, 180))) > 235).sum())
  return min(range(n - raio, n + raio + 1, 3), key=branco)
run = lambda *a: subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *a], check=True)

for c in D['cenas']:
  ini, fim = c['ini'] + 6, c['fim'] - 2  # sem o clarão do corte
  # clipe: 960x540, mudo, em laço, leve para o celular
  run('-framerate', str(FPS), '-start_number', str(ini), '-i', os.path.join(QUADROS, '%05d.jpg'), '-frames:v', str(fim - ini),
      '-vf', 'scale=960:540:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
      os.path.join(SITE, 'chefe-%s.mp4' % c['chefe']))
  Image.open(q(limpo(ini + (fim - ini) // 2))).convert('RGB').resize((960, 540), Image.LANCZOS).save(os.path.join(SITE, 'chefe-%s.webp' % c['chefe']), quality=80)

# a galeria: um quadro marcante de quatro lutas
for i, (chefe, k) in enumerate([('golias', 0.45), ('satanas', 0.4), ('leviata', 0.55), ('behemote', 0.35)], 1):
  c = next(x for x in D['cenas'] if x['chefe'] == chefe)
  Image.open(q(limpo(int(c['ini'] + (c['fim'] - c['ini']) * k)))).convert('RGB').resize((1280, 720), Image.LANCZOS).save(os.path.join(SITE, 'print-%d.webp' % i), quality=82)

# o fundo do topo do site: um laço limpo (sem letreiros), com o miolo de cada luta
lista = os.path.join(SITE, '..', '.heroi.txt')
with open(lista, 'w') as f:
  for c in D['cenas']:
    m = (c['ini'] + c['fim']) // 2
    for n in range(m - 36, m + 36): f.write("file '%s'\nduration %f\n" % (q(n), 1 / FPS))
run('-f', 'concat', '-safe', '0', '-i', lista, '-vf', 'scale=1280:720:flags=lanczos,fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', os.path.join(SITE, 'heroi.mp4'))
os.remove(lista)

# trailers leves para a página (o original em alta fica em art/)
run('-i', os.path.join(TRAILERS, 'trailer-batalhas-16x9.mp4'), '-vf', 'scale=1280:720:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', os.path.join(SITE, 'trailer-16x9.mp4'))
run('-i', os.path.join(TRAILERS, 'trailer-batalhas-9x16.mp4'), '-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', os.path.join(SITE, 'trailer-9x16.mp4'))
c = next(x for x in D['cenas'] if x['chefe'] == 'leviata')
Image.open(q(limpo(int(c['ini'] + (c['fim'] - c['ini']) * 0.55)))).convert('RGB').resize((1280, 720), Image.LANCZOS).save(os.path.join(SITE, 'trailer-poster.webp'), quality=80)
for f in sorted(os.listdir(SITE)): print(f, os.path.getsize(os.path.join(SITE, f)) // 1024, 'KB')
