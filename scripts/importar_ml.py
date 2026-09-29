"""Importa el Excel de publicaciones exportado desde Mercado Libre (Ventas > Publicaciones > Descargar)
y genera src/lib/seed.json, el catálogo inicial de la tienda.

Uso:  python3 scripts/importar_ml.py Publicaciones.xlsx
Requiere: pip install openpyxl
"""
import openpyxl, re, json, sys, collections, unicodedata
import pathlib
SRC = sys.argv[1]
OUT = pathlib.Path(__file__).resolve().parent.parent / 'src/lib/seed.json'
wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
rows = [r for r in wb['Publicaciones'].iter_rows(min_row=6, values_only=True) if r[1]]

MAKES = ['Chevrolet','Mitsubishi','Mazda','Peugeot','Changan','Nissan','Toyota','Ssangyong','Byd','Chery','Jac','Geely','Maxus',
 'Suzuki','Hyundai','Kia','Ford','Jeep','Dodge','Mg','Brilliance','Brillance','Great Wall','Dfsk','Dfm','Renault','Citroen','Honda','Volkswagen',
 'Subaru','Fiat','Daewoo','Samsung','Mahindra','Tata','Haval','Chrysler','Opel','Isuzu','Foton','Zotye','Lifan','Dongfeng','Jmc','Faw','Baic',
 'Kyc','Mercedes Benz','Mercedes','Hafei','Zna','Skoda','Seat','Audi','Bmw','Volvo','Land Rover','Mini','Jetour','Chevy','Gac','Dfm','Ram','Alfa Romeo','Lada','Proton','Kaiyi','Soueast','Changhe','Shineray','Dongfeng','Ssanyong','Chavrolet','Dewoo','Totoya']
CANON = {'Ssanyong':'SsangYong','Chavrolet':'Chevrolet','Dewoo':'Daewoo','Totoya':'Toyota','Brillance':'Brilliance','Mercedes':'Mercedes Benz','Chevy':'Chevrolet','Ssangyong':'SsangYong','Byd':'BYD','Jac':'JAC','Mg':'MG','Dfsk':'DFSK','Dfm':'DFM','Jmc':'JMC','Faw':'FAW','Baic':'BAIC','Kyc':'KYC','Bmw':'BMW','Zna':'ZNA','Gac':'GAC','Ram':'RAM'}
mk_re = re.compile(r'\b(' + '|'.join(sorted({re.escape(m) for m in MAKES}, key=len, reverse=True)) + r')\b', re.I)
STOP = re.compile(r'^(año|años|del\.?|tras\.?|delanter\w*|traser\w*|par|kit|con|sin|izq\w*|der\w*|motor|mec\w*|aut\w*|lado|original|japon\w*|korea|corea|taiw\w*|china|el|la|los|las|y|al|und|unidad|gasolina|diesel|bencin\w*|cc|4x2|4x4|2wd|4wd)$', re.I)
PAIRS = {('spark','gt'),('grand','nomade'),('gran','nomade'),('grand','vitara'),('gran','vitara'),('urban','cruiser'),('montero','sport'),('santa','fe'),('cargo','van')}
ALIAS = {'monterosport':'Montero Sport','sx-4':'SX4','bt50':'BT-50','bt-50':'BT-50','cx-70':'CX70','i30':'I-30','i10':'I-10','i20':'I-20','helantra':'Elantra','h-100':'H100','h-1':'H1','gran nomade':'Grand Nomade','gran vitara':'Grand Vitara','x-trail':'X-TRAIL','aveo-':'Aveo','x-':'X-TRAIL','qasqai':'Qashqai','tida':'Tiida','winlge':'Wingle','compas':'Compass','cx-5':'CX5','rav':'RAV4','rave':'RAV4','urban':'Urban Cruiser','santa':'Santa Fe','tarjet':'Trajet','rizzo':'Rezzo','gran':'Grand Vitara','md201':'M201','cs15':'CS15'}
NOT_MODEL = {'nissam','nissan','suzuki','peugeot','renault','lada','x'}
TWO = {'gt','lt','nomade','vitara','fe','cruiser','sport','sense','cross','pick'}
UPPER = {'gt','lt','zs','zx','cx5','cx7','cx3','cx70','cs35','crv','cr-v','rav4','sx4','np300','l200','d21','d22','sm3','sm5','f0','s2','s3','j2','j3','t60','x25','n300','n400','i-10','i-20','i-30','x-trail','hr-v','b15','h1','h100','qq','a30','t30'}
def fmt(w): return w.upper() if w.lower() in UPPER else w.capitalize()

def parse_vehicle(t):
    m = mk_re.search(t)
    if not m: return None, None, t
    make = m.group(1).title(); make = CANON.get(make, make)
    rest = t[m.end():].replace('/', ' / ').split()
    model = []
    for w in rest:
        w = w.strip(',.;()')
        if not w or w in '/-+' or STOP.match(w): break
        if not model:
            # un número puede ser el modelo (Peugeot 307, Mazda 3, Peugeot 2008) solo si va primero
            if re.fullmatch(r'\d{1,3}', w) or (make == 'Peugeot' and re.fullmatch(r'[1-5]00[1-8]', w)) or not re.search(r'\d[.,-]|^\d', w):
                model.append(w); continue
            break
        pair = (model[0].lower(), w.lower())
        if pair in PAIRS: model.append(w)
        elif model[0].lower() == 'new': model = [w]
        break
    if model and model[0].lower() in NOT_MODEL: model = []
    if model:
        k = ' '.join(model).lower()
        model = ALIAS.get(k, ' '.join(fmt(x) for x in model)).split()
    ys_text = t[:m.start()] + ' ' + ' '.join(rest[len(model):])
    return make, (' '.join(fmt(w) for w in model) or None), ys_text

def parse_years(t):
    ys = [int(y) for y in re.findall(r'(?<![\d.,])((?:19[6-9]|20[0-3])\d)(?![\d.,])', t)]
    if ys:
        if len(ys) > 1: return min(ys), max(ys)
        return ys[0], (2026 if re.search(r'%d\s*(\+|en adelante|adelante)' % ys[0], t, re.I) else ys[0])
    m = re.search(r'(?<![\d.,])(\d{2})\s*(?:-|al|a)\s*(\d{2})(?![\d.,])', t)
    if m:
        f = lambda y: 1900 + y if y >= 50 else 2000 + y
        a, b = f(int(m.group(1))), f(int(m.group(2)))
        if a <= b: return a, b
    return None, None

GROUPS = [
 ('frenos', r'freno|pastilla|cinta|calipers|bomba de freno|cilindro de rueda|tambor'),
 ('embrague', r'embrague|volante motor|collar'),
 ('direccion', r'direcci|axial|extremo|homocin|rodamiento|maza|palier|terminal'),
 ('suspension', r'amortiguad|bandeja|bieleta|base|rótula|rotula|suspensi|resorte|buje|espiral|barra'),
 ('refrigeracion', r'agua|termostato|refrigera|radiador|fan clutch|ventilador|electroventilador'),
 ('encendido', r'bobina|bujía|bujia|distribuidor|encendido|sensor|alternador|motor de arranque|interruptor|telecomando|eléctric|electric'),
 ('filtros', r'filtro|admisi'),
 ('motor', r'distribuci|aceite|motor|correa|camisa|culata|empaquetadura|junta|pist|tensor|polea|carter|cárter|metal'),
 ('carroceria', r'parachoque|espejo|moldura|airbag|foco|faro|óptico|optico|manilla|capot|tapabarro|puerta|luz|guardafango|mascara|máscara'),
]
def group(cat, title):
    for g, rx in GROUPS:
        if re.search(rx, cat or '', re.I): return g
    for g, rx in GROUPS:
        if re.search(rx, title, re.I): return g
    return 'otros'

def clean_desc(d):
    if not isinstance(d, str): return '', {}
    cut = re.split(r'Somos CEPPICAR|CEPPICAR Tienda|_{5,}|-{5,}|Antes de realizar', d)[0].strip()
    info = {}
    for k, rx in [('Marca', r'^\s*Marca\s*:\s*(.+)$'), ('Origen', r'^\s*(?:Procedencia|Origen)\s*:\s*(.+)$'), ('Garantía', r'^\s*Garant[ií]a\s*:?\s*(.+)$'), ('Lado', r'^\s*Lado\s*:\s*(.+)$'), ('Tipo', r'^\s*Tipo\s*:\s*(.+)$')]:
        m = re.search(rx, cut, re.I | re.M)
        if m: info[k] = m.group(1).strip()[:60]
    lines = [l.strip() for l in cut.splitlines() if l.strip() and not re.match(r'^(Marca|Procedencia|Origen|Garant|Producto Nuevo|Lado|Tipo)\b', l.strip(), re.I)]
    return ' '.join(lines)[:320], info

num = lambda x: float(x) if isinstance(x, (int, float)) else (float(x) if isinstance(x, str) and re.fullmatch(r'\d+(\.\d+)?', x) else 0)
parents, variants = {}, collections.defaultdict(list)
for r in rows:
    if r[3]: variants[r[1]].append((str(r[6]).strip().title(), int(num(r[7]))))
    else: parents[r[1]] = r


def slugify(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:60].rstrip('-')

COLORS = {'suspension':'#0b3d91','refrigeracion':'#0097a7','direccion':'#0f9d8a','motor':'#ef6c00','embrague':'#6d4fc2','frenos':'#d32f2f','encendido':'#c99700','carroceria':'#546e7a','filtros':'#2e7d32','otros':'#6b7280'}

items = []
for iid, r in parents.items():
    title = re.sub(r'\s+', ' ', str(r[5])).strip()
    var = variants.get(iid, [])
    stock = int(num(r[7])) + sum(q for _, q in var)
    if stock <= 0: continue
    price = int(num(r[8]))
    if not price: continue
    make, model, ytext = parse_vehicle(title)
    y0, y1 = parse_years(ytext)
    desc, info = clean_desc(r[22])
    sku = str(r[4] or '').strip()
    cat = group(r[28], title)
    veh = ' '.join(x for x in [make, model, f"{y0}-{y1}" if y0 else None] if x)
    it = {
        'slug': f"{slugify(title)}-{iid[3:]}",
        'name': title, 'category': cat, 'mlCategory': str(r[28] or ''),
        'short': veh or 'Consulta compatibilidad', 'description': desc,
        'brand': info.get('Marca', ''), 'origin': info.get('Origen', ''), 'warranty': info.get('Garantía', '3 meses'),
        'make': make or '', 'model': model or '', 'yearFrom': y0, 'yearTo': y1,
        'sku': sku if sku and sku not in ('0', '0.0') else '', 'mlId': iid,
        'color': COLORS[cat], 'featured': False, 'visible': r[27] == 'Activa', 'active': r[27] == 'Activa', 'sort': 0,
        'freeShipping': r[24] == 'Ofreces envío gratis',
        'variants': [{'id': f"{iid}-{i+1}", 'label': n, 'price': price, 'stock': q} for i, (n, q) in enumerate(var)]
                    or [{'id': iid, 'label': 'Unidad', 'price': price, 'stock': stock}],
    }
    items.append(it)

# Destacados: el activo con más stock de cada categoría, hasta 6.
seen = set()
for it in sorted(items, key=lambda i: (-i['active'], -sum(v['stock'] for v in i['variants']))):
    if it['active'] and it['category'] not in seen and len(seen) < 6:
        it['featured'] = True; seen.add(it['category'])
for i, it in enumerate(sorted(items, key=lambda i: (-i['active'], i['name']))): it['sort'] = i + 1
items.sort(key=lambda i: i['sort'])

json.dump(items, open(OUT, 'w'), ensure_ascii=False, indent=0)
C = collections.Counter
print('productos', len(items), 'activos', sum(i['active'] for i in items), 'destacados', sum(i['featured'] for i in items))
print('sin marca', sum(1 for i in items if not i['make']), 'sin años', sum(1 for i in items if not i['yearFrom']))
print(C(i['category'] for i in items))
