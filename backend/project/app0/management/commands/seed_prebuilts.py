import csv
import os
import uuid
import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings
from rapidfuzz import process, fuzz
from app0.models import (
    intelCPU, amdCPU, intelMotherboard, amdMotherboard, 
    ram, gpu, psu, case, storage, cooler, PrebuiltPC
)

class Command(BaseCommand):
    help = 'Seeds PrebuiltPC setups using the most popular combinations from the CSV.'

    def handle(self, *args, **kwargs):
        file_path = os.path.join(settings.BASE_DIR, 'api', 'buildsfinal2.csv')
        df = pd.read_csv(file_path)
        
        # Identify the top 3 most popular builds (combinations of CPU, MB, RAM, GPU, PSU)
        # We group by all columns except Build No.
        build_counts = df.groupby(['CPU', 'Motherboard', 'RAM', 'GPU', 'PSU']).size().reset_index(name='count')
        top_builds = build_counts.sort_values(by='count', ascending=False).head(5)

        categories = ['Gaming', 'Video Editing', 'Professional', 'Budget Gaming', 'Workstation']
        
        created_count = 0
        for i, (index, row) in enumerate(top_builds.iterrows()):
            try:
                # Determine platform
                is_amd = "AMD" in row['CPU'] or "Ryzen" in row['CPU']
                platform = 'amd' if is_amd else 'intel'
                
                # Fetch components from DB using fuzzy matching
                def get_comp(ModelClass, name):
                    all_objs = ModelClass.objects.all()
                    match = process.extractOne(name, [obj.name for obj in all_objs], scorer=fuzz.token_set_ratio)
                    if match and match[1] > 80:
                        return all_objs.get(name=match[0])
                    return None

                cpu = get_comp(amdCPU if is_amd else intelCPU, row['CPU'])
                mb = get_comp(amdMotherboard if is_amd else intelMotherboard, row['Motherboard'])
                r = get_comp(ram, row['RAM'])
                vga = get_comp(gpu, row['GPU'])
                power = get_comp(psu, row['PSU'])
                
                if not (cpu and mb):
                    self.stdout.write(self.style.WARNING(f"Skipping build {i}: Core components not found in DB."))
                    continue

                name = f"Master Build {categories[i]}"
                category_slug = categories[i].lower().replace(' ', '_')
                if 'gaming' in category_slug: cat = 'gaming'
                elif 'edit' in category_slug: cat = 'editing'
                else: cat = 'design'

                prebuilt, created = PrebuiltPC.objects.get_or_create(
                    name=name,
                    defaults={
                        'description': f"A high-performing {categories[i]} setup optimized for stability and speed.",
                        'category': cat,
                        'platform': platform,
                        'intel_cpu': cpu if platform == 'intel' else None,
                        'amd_cpu': cpu if platform == 'amd' else None,
                        'intel_motherboard': mb if platform == 'intel' else None,
                        'amd_motherboard': mb if platform == 'amd' else None,
                        'ram': r,
                        'gpu': vga,
                        'psu': power,
                        # For storage/cooler/case, we pick defaults if available or leave null
                        'storage': storage.objects.first(),
                        'case': case.objects.first(),
                        'cooler': cooler.objects.first(),
                        'price': None # Will be calculated by total_price property
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Created prebuilt: {name}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating prebuilt {i}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} prebuilt setups!"))
