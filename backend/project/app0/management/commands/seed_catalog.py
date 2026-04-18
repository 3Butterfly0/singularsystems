import csv
import uuid
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from app0.models import intelCPU, amdCPU, intelMotherboard, amdMotherboard, ram, gpu, psu

class Command(BaseCommand):
    help = 'Seeds database from buildsfinal2.csv'

    def handle(self, *args, **kwargs):
        file_path = os.path.join(settings.BASE_DIR, 'api', 'buildsfinal2.csv')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                cpu_name = row['CPU'].strip()
                mb_name = row['Motherboard'].strip()
                ram_name = row['RAM'].strip()
                gpu_name = row['GPU'].strip()
                psu_name = row['PSU'].strip()
                
                # Determine platform
                is_amd = "AMD" in cpu_name or "Ryzen" in cpu_name

                # Socket derivation based on MB chipset (loose heuristic mapping)
                socket = 'Generic'
                if 'B650' in mb_name or 'X670' in mb_name or 'A620' in mb_name: socket = 'AM5'
                elif 'B550' in mb_name or 'X570' in mb_name or 'B450' in mb_name: socket = 'AM4'
                elif 'Z690' in mb_name or 'Z790' in mb_name or 'B660' in mb_name or 'B760' in mb_name: socket = 'LGA1700'
                
                # RAM Type derivation
                ram_type = 'DDR5' if 'DDR5' in ram_name else 'DDR4'
                
                # PSU Wattage
                w_str = psu_name.replace('W', '').strip()
                try: 
                    wattage = int(w_str)
                except ValueError: 
                    wattage = 500

                try:
                    if is_amd:
                        amdCPU.objects.get_or_create(name=cpu_name, defaults={'id': str(uuid.uuid4()), 'socket': socket, 'price': 300, 'wattage': 105})
                        amdMotherboard.objects.get_or_create(name=mb_name, defaults={'id': str(uuid.uuid4()), 'socket': socket, 'ram_type': ram_type, 'price': 150})
                    else:
                        intelCPU.objects.get_or_create(name=cpu_name, defaults={'id': str(uuid.uuid4()), 'socket': socket, 'price': 300, 'wattage': 125})
                        intelMotherboard.objects.get_or_create(name=mb_name, defaults={'id': str(uuid.uuid4()), 'socket': socket, 'ram_type': ram_type, 'price': 150})
                    
                    ram.objects.get_or_create(name=ram_name, defaults={'id': str(uuid.uuid4()), 'ram_type': ram_type, 'price': 100})
                    gpu.objects.get_or_create(name=gpu_name, defaults={'id': str(uuid.uuid4()), 'wattage': 300, 'price': 500})
                    psu.objects.get_or_create(name=psu_name, defaults={'id': str(uuid.uuid4()), 'wattage': wattage, 'price': 100})
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Error processing {row}: {e}"))

        self.stdout.write(self.style.SUCCESS("Successfully seeded catalog from CSV!"))
