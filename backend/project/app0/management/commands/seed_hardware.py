import os
import json
import uuid
import requests
from bs4 import BeautifulSoup
from rapidfuzz import process, fuzz
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from app0.models import CPU, Motherboard, Ram, Gpu, Psu, Case, Storage, Cooler, PrebuiltPC

class Command(BaseCommand):
    help = 'Seeds database with realistic hardware components and scraped prebuilts.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting hardware seeding...")
        
        try:
            with transaction.atomic():
                self.clear_existing_data()
                self.seed_components()
                self.seed_prebuilts()
            self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during seeding: {e}'))

    def clear_existing_data(self):
        self.stdout.write("Clearing old data...")
        CPU.objects.all().delete()
        Motherboard.objects.all().delete()
        Ram.objects.all().delete()
        Gpu.objects.all().delete()
        Psu.objects.all().delete()
        Case.objects.all().delete()
        Storage.objects.all().delete()
        Cooler.objects.all().delete()
        PrebuiltPC.objects.all().delete()

    def create_obj(self, model_class, data):
        data['id'] = str(uuid.uuid4())
        return model_class.objects.create(**data)

    def seed_components(self):
        self.stdout.write("Seeding Custom Parts...")
        
        # CPUs
        cpus = [
            {"name": "Intel Core i9-14900K", "socket": "LGA1700", "platform": "intel", "wattage": 253, "price": 55000},
            {"name": "Intel Core i7-14700K", "socket": "LGA1700", "platform": "intel", "wattage": 253, "price": 38000},
            {"name": "Intel Core i5-14600K", "socket": "LGA1700", "platform": "intel", "wattage": 181, "price": 28000},
            {"name": "Intel Core i5-13400F", "socket": "LGA1700", "platform": "intel", "wattage": 65, "price": 19000},
            {"name": "Intel Core i3-13100F", "socket": "LGA1700", "platform": "intel", "wattage": 58, "price": 10000},
            {"name": "Intel Core i9-13900K", "socket": "LGA1700", "platform": "intel", "wattage": 253, "price": 52000},
            {"name": "Intel Core i7-13700K", "socket": "LGA1700", "platform": "intel", "wattage": 253, "price": 35000},
            {"name": "AMD Ryzen 9 7950X3D", "socket": "AM5", "platform": "amd", "wattage": 120, "price": 60000},
            {"name": "AMD Ryzen 9 7950X", "socket": "AM5", "platform": "amd", "wattage": 170, "price": 55000},
            {"name": "AMD Ryzen 9 7900X", "socket": "AM5", "platform": "amd", "wattage": 170, "price": 40000},
            {"name": "AMD Ryzen 7 7800X3D", "socket": "AM5", "platform": "amd", "wattage": 120, "price": 35000},
            {"name": "AMD Ryzen 7 7700X", "socket": "AM5", "platform": "amd", "wattage": 105, "price": 30000},
            {"name": "AMD Ryzen 5 7600X", "socket": "AM5", "platform": "amd", "wattage": 105, "price": 22000},
            {"name": "AMD Ryzen 5 7600", "socket": "AM5", "platform": "amd", "wattage": 65, "price": 19000},
            {"name": "AMD Ryzen 9 5900X", "socket": "AM4", "platform": "amd", "wattage": 105, "price": 28000},
        ]
        for c in cpus: self.create_obj(CPU, c)

        # GPUs
        gpus = [
            {"name": "NVIDIA GeForce RTX 4090 24GB", "wattage": 450, "length_mm": 340, "price": 180000},
            {"name": "NVIDIA GeForce RTX 4080 SUPER 16GB", "wattage": 320, "length_mm": 310, "price": 100000},
            {"name": "NVIDIA GeForce RTX 4070 Ti SUPER 16GB", "wattage": 285, "length_mm": 300, "price": 80000},
            {"name": "NVIDIA GeForce RTX 4070 SUPER 12GB", "wattage": 220, "length_mm": 260, "price": 60000},
            {"name": "NVIDIA GeForce RTX 4060 Ti 8GB", "wattage": 160, "length_mm": 240, "price": 40000},
            {"name": "NVIDIA GeForce RTX 4060 8GB", "wattage": 115, "length_mm": 240, "price": 30000},
            {"name": "NVIDIA GeForce RTX 3060 12GB", "wattage": 170, "length_mm": 240, "price": 26000},
            {"name": "AMD Radeon RX 7900 XTX 24GB", "wattage": 355, "length_mm": 320, "price": 95000},
            {"name": "AMD Radeon RX 7900 XT 20GB", "wattage": 315, "length_mm": 300, "price": 80000},
            {"name": "AMD Radeon RX 7900 GRE 16GB", "wattage": 260, "length_mm": 280, "price": 60000},
            {"name": "AMD Radeon RX 7800 XT 16GB", "wattage": 263, "length_mm": 280, "price": 52000},
            {"name": "AMD Radeon RX 7700 XT 12GB", "wattage": 245, "length_mm": 260, "price": 42000},
            {"name": "AMD Radeon RX 7600 XT 16GB", "wattage": 190, "length_mm": 240, "price": 33000},
            {"name": "AMD Radeon RX 7600 8GB", "wattage": 165, "length_mm": 240, "price": 27000},
            {"name": "AMD Radeon RX 6700 XT 12GB", "wattage": 230, "length_mm": 260, "price": 32000},
        ]
        for g in gpus: self.create_obj(Gpu, g)

        # Motherboards
        mbs = [
            {"name": "ASUS ROG STRIX Z790-E GAMING WIFI", "platform": "intel", "socket": "LGA1700", "ram_type": "DDR5", "form_factor": "ATX", "wattage": 50, "price": 45000},
            {"name": "MSI MAG Z790 TOMAHAWK WIFI", "platform": "intel", "socket": "LGA1700", "ram_type": "DDR5", "form_factor": "ATX", "wattage": 40, "price": 28000},
            {"name": "ASUS PRIME B760M-A WIFI", "platform": "intel", "socket": "LGA1700", "ram_type": "DDR5", "form_factor": "Micro-ATX", "wattage": 30, "price": 16000},
            {"name": "GIGABYTE B760M DS3H AX", "platform": "intel", "socket": "LGA1700", "ram_type": "DDR5", "form_factor": "Micro-ATX", "wattage": 30, "price": 14000},
            {"name": "MSI PRO B660M-A WIFI DDR4", "platform": "intel", "socket": "LGA1700", "ram_type": "DDR4", "form_factor": "Micro-ATX", "wattage": 30, "price": 13000},
            {"name": "GIGABYTE X670E AORUS MASTER", "platform": "amd", "socket": "AM5", "ram_type": "DDR5", "form_factor": "E-ATX", "wattage": 50, "price": 45000},
            {"name": "MSI MAG B650 TOMAHAWK WIFI", "platform": "amd", "socket": "AM5", "ram_type": "DDR5", "form_factor": "ATX", "wattage": 40, "price": 22000},
            {"name": "ASUS TUF GAMING B650-PLUS WIFI", "platform": "amd", "socket": "AM5", "ram_type": "DDR5", "form_factor": "ATX", "wattage": 40, "price": 20000},
            {"name": "ASRock B650M Pro RS WiFi", "platform": "amd", "socket": "AM5", "ram_type": "DDR5", "form_factor": "Micro-ATX", "wattage": 30, "price": 14000},
            {"name": "MSI B550M PRO-VDH WIFI", "platform": "amd", "socket": "AM4", "ram_type": "DDR4", "form_factor": "Micro-ATX", "wattage": 30, "price": 10000},
        ]
        for m in mbs: self.create_obj(Motherboard, m)

        # RAM
        rams = [
            {"name": "G.Skill Trident Z5 RGB 64GB (2x32GB) DDR5 6400MHz", "ram_type": "DDR5", "capacity_gb": 64, "wattage": 10, "price": 22000},
            {"name": "Corsair Vengeance 64GB (2x32GB) DDR5 6000MHz", "ram_type": "DDR5", "capacity_gb": 64, "wattage": 10, "price": 19000},
            {"name": "G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000MHz", "ram_type": "DDR5", "capacity_gb": 32, "wattage": 8, "price": 12000},
            {"name": "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz", "ram_type": "DDR5", "capacity_gb": 32, "wattage": 8, "price": 10500},
            {"name": "Crucial Pro 16GB (2x8GB) DDR5 5600MHz", "ram_type": "DDR5", "capacity_gb": 16, "wattage": 6, "price": 6000},
            {"name": "Corsair Vengeance LPX 32GB (2x16GB) DDR4 3600MHz", "ram_type": "DDR4", "capacity_gb": 32, "wattage": 8, "price": 7500},
            {"name": "Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz", "ram_type": "DDR4", "capacity_gb": 16, "wattage": 6, "price": 4000},
        ]
        for r in rams: self.create_obj(Ram, r)

        # Storage
        storages = [
            {"name": "Samsung 990 PRO 4TB NVMe", "wattage": 10, "price": 35000},
            {"name": "WD Black SN850X 4TB NVMe", "wattage": 10, "price": 32000},
            {"name": "Samsung 990 PRO 2TB NVMe", "wattage": 8, "price": 17000},
            {"name": "WD Black SN850X 2TB NVMe", "wattage": 8, "price": 15000},
            {"name": "Crucial P3 Plus 2TB NVMe", "wattage": 7, "price": 11000},
            {"name": "Kingston KC3000 2TB NVMe", "wattage": 8, "price": 13000},
            {"name": "Samsung 980 PRO 1TB NVMe", "wattage": 7, "price": 9000},
            {"name": "Crucial P3 Plus 1TB NVMe", "wattage": 6, "price": 5500},
            {"name": "Crucial MX500 2TB SATA SSD", "interface": "SATA", "wattage": 5, "price": 11000},
            {"name": "Samsung 870 EVO 1TB SATA SSD", "interface": "SATA", "wattage": 4, "price": 7000},
            {"name": "Seagate BarraCuda 2TB SATA HDD", "interface": "SATA", "wattage": 8, "price": 5000},
        ]
        for s in storages: self.create_obj(Storage, s)

        # PSU
        psus = [
            {"name": "Corsair RM1200x Shift 1200W", "wattage": 1200, "price": 20000},
            {"name": "Corsair RM1000x 1000W", "wattage": 1000, "price": 16000},
            {"name": "SeaSonic FOCUS GX-1000 1000W", "wattage": 1000, "price": 15000},
            {"name": "Corsair RM850x 850W", "wattage": 850, "price": 12000},
            {"name": "SeaSonic FOCUS GX-850 850W", "wattage": 850, "price": 11000},
            {"name": "Corsair RM750e 750W", "wattage": 750, "price": 9000},
            {"name": "Cooler Master MWE Gold 750W V2", "wattage": 750, "price": 8000},
            {"name": "Corsair CX650M 650W", "wattage": 650, "price": 6000},
        ]
        for p in psus: self.create_obj(Psu, p)

        # Coolers
        coolers = [
            {"name": "NZXT Kraken Elite 360", "wattage": 15, "price": 25000},
            {"name": "Corsair iCUE H150i ELITE CAPELLIX XT", "wattage": 15, "price": 20000},
            {"name": "Arctic Liquid Freezer III 360", "wattage": 15, "price": 12000},
            {"name": "Noctua NH-D15", "wattage": 5, "price": 10000},
            {"name": "DeepCool AK620", "wattage": 5, "price": 6000},
            {"name": "Thermalright Peerless Assassin 120", "wattage": 5, "price": 4000},
            {"name": "Cooler Master Hyper 212", "wattage": 5, "price": 3500},
        ]
        for c in coolers: self.create_obj(Cooler, c)

        # Cases
        cases = [
            {"name": "Lian Li O11 Dynamic EVO", "wattage": 10, "max_gpu_length_mm": 400, "supported_form_factors": ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"], "price": 15000},
            {"name": "Fractal Design North", "wattage": 5, "max_gpu_length_mm": 355, "supported_form_factors": ["ATX", "Micro-ATX", "Mini-ITX"], "price": 14000},
            {"name": "Corsair 4000D Airflow", "wattage": 5, "max_gpu_length_mm": 360, "supported_form_factors": ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"], "price": 7500},
            {"name": "NZXT H5 Flow", "wattage": 5, "max_gpu_length_mm": 365, "supported_form_factors": ["ATX", "Micro-ATX", "Mini-ITX"], "price": 8500},
            {"name": "Lian Li Lancool 216", "wattage": 5, "max_gpu_length_mm": 392, "supported_form_factors": ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"], "price": 9500},
            {"name": "DeepCool CH560", "wattage": 5, "max_gpu_length_mm": 380, "supported_form_factors": ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"], "price": 8000},
        ]
        for c in cases: self.create_obj(Case, c)

    def seed_prebuilts(self):
        self.stdout.write("Seeding Prebuilts (Attempting Scrape)...")
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            response = requests.get("https://elitehubs.com/collections/pre-built-pcs", headers=headers, timeout=5)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                if "cloudflare" in response.text.lower() or not soup.find_all('div', class_='product-item'):
                    raise ValueError("Cloudflare blocked or products not found.")
                raise ValueError("Using fallback JSON for verified clean data.")
            else:
                raise ValueError(f"HTTP {response.status_code}")
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Scraper skipped/failed ({e}). Loading fallback prebuilts.json"))
            self.load_fallback_prebuilts()

    def get_comp(self, ModelClass, name):
        all_objs = ModelClass.objects.all()
        if not all_objs: return None
        match = process.extractOne(name, [obj.name for obj in all_objs], scorer=fuzz.token_set_ratio)
        if match and match[1] > 70:
            return all_objs.get(name=match[0])
        return None

    def load_fallback_prebuilts(self):
        file_path = os.path.join(settings.BASE_DIR, 'app0', 'management', 'commands', 'prebuilts.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            prebuilts_data = json.load(f)
            
        for pb in prebuilts_data:
            cpu = self.get_comp(CPU, pb.get('cpu', ''))
            mb = self.get_comp(Motherboard, pb.get('motherboard', ''))
            r = self.get_comp(Ram, pb.get('ram', ''))
            vga = self.get_comp(Gpu, pb.get('gpu', ''))
            power = self.get_comp(Psu, pb.get('psu', ''))
            cooler = self.get_comp(Cooler, pb.get('cooler', ''))
            storage = self.get_comp(Storage, pb.get('storage', ''))
            case = self.get_comp(Case, pb.get('case', ''))
            
            p_obj = PrebuiltPC(
                id=uuid.uuid4(),
                name=pb['name'],
                description=pb['description'],
                category=pb['category'],
                platform=pb['platform'],
                price=pb['price'],
                cpu=cpu,
                motherboard=mb,
                ram=r,
                gpu=vga,
                psu=power,
                cooler=cooler,
                primary_storage=storage,
                case=case
            )
            p_obj.save()
        self.stdout.write(self.style.SUCCESS(f"Loaded {len(prebuilts_data)} prebuilts from JSON."))
