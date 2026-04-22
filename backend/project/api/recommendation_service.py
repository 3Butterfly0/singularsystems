import os
import pandas as pd
from django.conf import settings
from rapidfuzz import process, fuzz
from app0.models import BuildSession

class RecommendationService:
    _df = None

    @classmethod
    def load_data(cls):
        if cls._df is None:
            # project root path
            file_path = os.path.join(settings.BASE_DIR, 'api', 'buildsfinal2.csv')
            if not os.path.exists(file_path):
                # fallback path
                file_path = 'd:/projects/ss/backend/project/api/buildsfinal2.csv'
            
            cls._df = pd.read_csv(file_path)
            cls._df.columns = [c.strip().lower() for c in cls._df.columns]
        return cls._df

    @classmethod
    def get_recommendations(cls, session: BuildSession, target_type: str):
        # returns a list of 1-2 recommended parts
        df = cls.load_data()
        
        current_parts = {}
        
        # map session fields to csv columns
        mapping = {
            'cpu': session.intel_cpu.name if session.intel_cpu else (session.amd_cpu.name if session.amd_cpu else None),
            'motherboard': session.intel_motherboard.name if session.intel_motherboard else (session.amd_motherboard.name if session.amd_motherboard else None),
            'ram': session.ram.name if session.ram else None,
            'gpu': session.gpu.name if session.gpu else None,
            'psu': session.psu.name if session.psu else None
        }

        filters = {k: v for k, v in mapping.items() if k != target_type and v is not None}

        if not filters:
            # no parts selected yet, recommend top items overall
            if target_type in df.columns:
                return df[target_type].value_counts().head(2).index.tolist()
            return []

        # filter csv using fuzzy matching
        filtered_df = df.copy()
        
        for part_type, part_name in filters.items():
            if part_type not in df.columns:
                continue
                
            unique_csv_parts = df[part_type].unique()
            best_match = process.extractOne(part_name, unique_csv_parts, scorer=fuzz.partial_ratio)
            
            if best_match and best_match[1] > 70: # threshold for match
                csv_part_name = best_match[0]
                filtered_df = filtered_df[filtered_df[part_type] == csv_part_name]
            
            # if filtered too much, stop filtering and use what we have
            if filtered_df.empty:
                break 

        # 3. Get top recommendations from the filtered set
        if target_type in filtered_df.columns:
            recommendations = filtered_df[target_type].value_counts().head(2).index.tolist()
            return recommendations
            
        return []

    @classmethod
    def mark_recommendations(cls, session: BuildSession, component_type: str, items_qs):
        # takes queryset of items and component type, returns list of dictionaries with 'is_recommended' flag.
        type_map = {
            'cpu': 'cpu',
            'motherboard': 'motherboard',
            'ram': 'ram',
            'gpu': 'gpu',
            'psu': 'psu'
        }
        
        csv_type = type_map.get(component_type)
        if not csv_type:
            return [{'item': item, 'is_recommended': False} for item in items_qs]

        rec_names = cls.get_recommendations(session, csv_type)
        
        results = []
        for item in items_qs:
            is_rec = False
            if rec_names:
                # used fuzzy match to check if this specific item is one of the recommended ones
                match = process.extractOne(item.name, rec_names, scorer=fuzz.token_set_ratio)
                if match and match[1] > 85:
                    is_rec = True
            
            results.append({
                'item': item,
                'is_recommended': is_rec
            })
            
        return results
