from rest_framework.response import Response
from rest_framework.decorators import api_view
import pandas as pd
import csv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
from django.conf import settings

file_path = os.path.join(settings.BASE_DIR, 'C:/Users/ayush/Desktop/MPL SEM6/SingularSystems_Backend/backend/project/api/buildsfinal2.csv')

with open(file_path, 'r') as file:
    csvreader = csv.reader(file)
    cpus = []
    motherboards = []
    rams = []
    gpus = []
    psus = []
    for row in csvreader:
        cpus.append(row[1])
        motherboards.append(row[2])
        rams.append(row[3])
        gpus.append(row[4])
        psus.append(row[5]) 
cpus.pop(0)    
motherboards.pop(0)
rams.pop(0)
gpus.pop(0)
psus.pop(0)
    

data = {
    'CPU': cpus,
    'Motherboard': motherboards,
    'GraphicCard': gpus,
    'Ram': rams,
    'PSU': psus
}

df = pd.DataFrame(data)


df['text'] = df.apply(lambda x: ' '.join(x), axis=1)


tfidf_vectorizer = TfidfVectorizer()
tfidf_matrix = tfidf_vectorizer.fit_transform(df['text'])


cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)


def recommend_items_for_cpu(input_cpu):
    idx = df.index[df['CPU'] == input_cpu].tolist()[0]
    sim_mb_scores = list(enumerate(cosine_sim[idx]))
    sim_mb_scores = sorted(sim_mb_scores, key=lambda x: x[1], reverse=True)
    sim_mb_scores = sim_mb_scores[1:]  # Exclude the input CPU itself
    recommended_motherboards = [(df.iloc[i[0]]['Motherboard'], i[1]) for i in sim_mb_scores]

    return recommended_motherboards


def recommend_items_for_cpu_and_motherboard(input_cpu, input_motherboard):
    cpu_idx = df.index[df['CPU'] == input_cpu].tolist()[0]
    mb_idx = df.index[df['Motherboard'] == input_motherboard].tolist()[0]

    sim_gc_scores = cosine_sim[cpu_idx, mb_idx]
    recommended_graphic_cards = [(df.iloc[cpu_idx]['GraphicCard'], sim_gc_scores)]

    return recommended_graphic_cards

def recommend_items_for_cpu_and_motherboard_and_gpu(input_cpu, input_motherboard, input_gpu):
    cpu_idx = df.index[df['CPU'] == input_cpu].tolist()[0]
    mb_idx = df.index[df['Motherboard'] == input_motherboard].tolist()[0]
    gpu_idx = df.index[df['GraphicCard'] == input_gpu].tolist()[0]

    sim_ram_scores = cosine_sim[cpu_idx, gpu_idx]
    recommended_ram = [(df.iloc[cpu_idx]['Ram'], sim_ram_scores)]

    return recommended_ram

def recommend_items_for_cpu_and_motherboard_and_gpu_and_ram(input_cpu, input_motherboard, input_gpu, input_ram):
    cpu_idx = df.index[df['CPU'] == input_cpu].tolist()[0]
    mb_idx = df.index[df['Motherboard'] == input_motherboard].tolist()[0]
    gpu_idx = df.index[df['GraphicCard'] == input_gpu].tolist()[0]
    ram_idx = df.index[df['Ram'] == input_ram].tolist()[0]

    sim_psu_scores = cosine_sim[cpu_idx, gpu_idx]
    recommended_psu = [(df.iloc[cpu_idx]['PSU'], sim_psu_scores)]

    return recommended_psu





@api_view(['POST'])
def returnMotherboard(request):
    cpu = request.data['cpu']
    mb= recommend_items_for_cpu(cpu)
    # return cpu
    return Response(mb[0][0])

@api_view(['POST'])
def returnGPU(request):
    cpu = request.data['cpu']
    mb = request.data['mb']
    gpu = recommend_items_for_cpu_and_motherboard(cpu, mb)
    return Response(gpu[0][0])

@api_view(['POST'])
def returnRAM(request):
    cpu = request.data['cpu']
    mb = request.data['mb']
    gpu = request.data['gpu']
    ram = recommend_items_for_cpu_and_motherboard_and_gpu(cpu, mb, gpu)
    return Response(ram[0][0])

@api_view(['POST'])
def returnPSU(request):
    cpu = request.data['cpu']
    mb = request.data['mb']
    gpu = request.data['gpu']
    ram = request.data['ram']
    psu = recommend_items_for_cpu_and_motherboard_and_gpu_and_ram(cpu, mb, gpu, ram)
    return Response(psu[0][0])