import os
import time
import win32com.client
from datetime import datetime

# ========= CONFIG =========
PASTA_ORIGEM = r"\\10.42.92.192\Diversos\Isaac\Isaac\laser 2.0\teste\slddrw"
PASTA_DESTINO = r"\\10.42.92.192\Diversos\Isaac\Isaac\laser 2.0\teste\jpg"
LOG = "conversao.log"

os.makedirs(PASTA_DESTINO, exist_ok=True)


# ========= LOG =========
def log(msg):
    data = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    linha = f"[{data}] {msg}"
    print(linha)

    with open(LOG, "a", encoding="utf-8") as f:
        f.write(linha + "\n")


# ========= INICIAR SOLID =========
log("Iniciando SolidWorks...")

sw = win32com.client.Dispatch("SldWorks.Application")
sw.Visible = False

swDocDRAWING = 3
swSaveAsCurrentVersion = 0
swSaveAsOptions_Silent = 1


# ========= LOOP =========
for arquivo in os.listdir(PASTA_ORIGEM):

    if not arquivo.lower().endswith(".slddrw"):
        continue

    origem = os.path.join(PASTA_ORIGEM, arquivo)
    nome = os.path.splitext(arquivo)[0]
    destino = os.path.join(PASTA_DESTINO, nome + ".jpg")

    data_sld = os.path.getmtime(origem)

    precisa_converter = False

    # Se JPG não existe → gera
    if not os.path.exists(destino):
        precisa_converter = True
        log(f"{arquivo} → JPG não existe")

    else:
        data_jpg = os.path.getmtime(destino)

        # Se desenho é mais novo → atualiza
        if data_sld > data_jpg:
            precisa_converter = True
            log(f"{arquivo} → Atualizado, reconvertendo")

    # ========= CONVERTER =========
    if precisa_converter:

        try:
            log(f"Convertendo {arquivo}")

            doc = sw.OpenDoc6(origem, swDocDRAWING, 0, "", None, None)

            time.sleep(1)

            doc.SaveAs3(destino, swSaveAsCurrentVersion, swSaveAsOptions_Silent)

            sw.CloseDoc(origem)

            log(f"{arquivo} → OK")

        except Exception as e:
            log(f"ERRO em {arquivo}: {e}")

    else:
        log(f"{arquivo} → Sem alteração")


# ========= FINAL =========
sw.ExitApp()
log("Finalizado.")
