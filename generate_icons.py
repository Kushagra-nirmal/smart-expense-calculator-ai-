import zlib
import struct
import os

def create_png_icon(filename, size):
    def make_chunk(chunk_type, data):
        return struct.pack('>I', len(data)) + chunk_type + data + struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
    
    header = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    ihdr = make_chunk(b'IHDR', ihdr_data)
    
    raw = bytearray()
    half = size / 2.0
    
    for y in range(size):
        raw.append(0)  # Filter type 0
        for x in range(size):
            # Normalized coordinates (-1.0 to 1.0)
            nx = (x - half) / half
            ny = (y - half) / half
            dist = (nx * nx + ny * ny) ** 0.5
            
            # Rounded squircle background
            corner_roundness = (abs(nx)**4 + abs(ny)**4) ** 0.25
            
            if corner_roundness > 0.92:
                # Outside icon squircle -> Transparent
                raw.extend([0, 0, 0, 0])
            elif corner_roundness > 0.88:
                # Border outline
                raw.extend([255, 255, 255, 60])
            else:
                # Gradient background (deep slate to indigo)
                bg_t = (x + y) / (size * 2.0)
                r = int(15 + bg_t * 20)
                g = int(23 + bg_t * 30)
                b = int(42 + bg_t * 50)
                
                # Central Wallet Card emblem
                # Wallet rectangle: x in [-0.55, 0.55], y in [-0.35, 0.40]
                if -0.52 <= nx <= 0.52 and -0.32 <= ny <= 0.38:
                    # Wallet card background gradient (Indigo to Violet)
                    card_t = (nx + 0.52) / 1.04
                    cr = int(99 + card_t * 70)    # 99 to 169
                    cg = int(102 - card_t * 17)   # 102 to 85
                    cb = int(241 + card_t * 6)    # 241 to 247
                    
                    # Diamond emblem in center (nx in [-0.15, 0.15], ny in [-0.05, 0.22])
                    diamond_val = abs(nx) * 1.5 + abs(ny - 0.08)
                    if diamond_val < 0.18:
                        # Emerald / Cyan Diamond
                        raw.extend([6, 182, 212, 255])
                    elif -0.02 <= ny <= 0.04:
                        # Wallet flap line
                        raw.extend([30, 27, 75, 220])
                    else:
                        raw.extend([cr, cg, cb, 255])
                elif -0.42 <= nx <= 0.42 and -0.48 <= ny <= -0.32:
                    # Top credit card peeking out
                    raw.extend([16, 185, 129, 230]) # Emerald
                else:
                    raw.extend([r, g, b, 255])
                
    idat_data = zlib.compress(bytes(raw), 9)
    idat = make_chunk(b'IDAT', idat_data)
    iend = make_chunk(b'IEND', b'')
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(header + ihdr + idat + iend)

create_png_icon('Frontend/public/icon-192.png', 192)
create_png_icon('Frontend/public/icon-512.png', 512)
create_png_icon('Frontend/public/icon-maskable-192.png', 192)
create_png_icon('Frontend/public/icon-maskable-512.png', 512)
print("Icons generated successfully!")
