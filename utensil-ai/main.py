from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional, Dict
from collections import Counter
import math
from datetime import datetime

app = FastAPI()

class ProductInfo(BaseModel):
    id: str
    name: str
    category: str
    season: str 
    price: float
    image: Optional[str] = "📦"
    popularity: Optional[float] = 0.5 

class HomeRecommendationRequest(BaseModel):
    user_id: str
    past_purchases: List[str]
    recent_searches: List[str]
    current_month: int
    weeks_to_next_festival: int = 4 # 👉 NEW: Crucial for the "Temporal" aspect
    catalog: List[ProductInfo] 

# =====================================================================
# THE FSDP KNOWLEDGE GRAPH (Cultural Event Calendar)
# Represents Event Nodes and their Edge Weights to Product Categories
# =====================================================================
FSDP_GRAPH = {
    "Diwali_Dhanteras": {
        "active_months": [9, 10, 11],
        "category_edges": {"Cookware": 0.9, "Serveware": 0.8, "Storage": 0.5}, # Edge Weights
        "bulk_order_threshold": 0.75 # Used for predicting B2B surges
    },
    "Wedding_Season": {
        "active_months": [4, 5, 11, 12],
        "category_edges": {"Dinner Sets": 0.95, "Gift Combos": 0.9, "Cookware": 0.6},
        "bulk_order_threshold": 0.80
    },
    "Summer_Prep": {
        "active_months": [3, 4],
        "category_edges": {"Water Bottles": 0.9, "Juice Dispensers": 0.85, "Storage": 0.6},
        "bulk_order_threshold": 0.40
    }
}

@app.post("/api/ai/home-recommend")
def get_home_recommendations(req: HomeRecommendationRequest):
    scored_products = []

    # Identify Active Temporal Events (Event Nodes)
    active_events = []
    for event_name, data in FSDP_GRAPH.items():
        if req.current_month in data["active_months"]:
            active_events.append((event_name, data))

    # 1. BUILD USER BEHAVIOR NODE (Graph Personalization)
    purchased_categories = [p.category for p in req.catalog if p.id in req.past_purchases]
    total_purchases = len(purchased_categories)
    category_affinity = {}
    if total_purchases > 0:
        counts = Counter(purchased_categories)
        category_affinity = {cat: count / total_purchases for cat, count in counts.items()}

    # 2. GRAPH TRAVERSAL & SCORING
    for product in req.catalog:
        
        # --- A. TEMPORAL GRAPH ACTIVATION (The "Temporal Network" part) ---
        # Calculates how strongly an event propagates demand to this product
        temporal_fsdp_score = 0.1 # Baseline graph node weight
        bulk_likelihood = False
        
        for event_name, event_data in active_events:
            # Check if an edge exists between this Event Node and Product Category
            edge_weight = event_data["category_edges"].get(product.category, 0.0)
            
            if edge_weight > 0:
                # Mathematical Temporal Decay: Demand spikes exponentially as weeks_to_next_festival -> 0
                # Formula: Edge Weight * e^(-0.2 * weeks)
                decay_factor = math.exp(-0.2 * req.weeks_to_next_festival)
                activation_score = edge_weight * decay_factor
                
                temporal_fsdp_score = max(temporal_fsdp_score, activation_score)
                
                # Check bulk B2B/B2C predictive threshold
                if activation_score >= event_data["bulk_order_threshold"]:
                    bulk_likelihood = True

        # --- B. USER-PRODUCT EDGE (Behavioral Scoring) ---
        behavior_score = category_affinity.get(product.category, 0.0)

        # --- C. INTENT EDGE (Search Scoring with Recency Decay) ---
        search_score = 0.0
        for i, search_term in enumerate(reversed(req.recent_searches)):
            term = search_term.lower()
            weight = 1.0 / (i + 1) # 1.0, 0.5, 0.33...
            
            if term in product.name.lower():
                search_score += (1.0 * weight)
            elif term in product.category.lower():
                search_score += (0.6 * weight)
                
        search_score = min(1.0, search_score)

        # --- D. GLOBAL NODE POPULARITY ---
        pop_score = product.popularity

        # --- FSDP HYBRID ALGORITHM ---
        # Weights dynamically shift. If an event is highly active (temporal_fsdp_score > 0.6), 
        # the network prioritizes seasonality over past behavior.
        if temporal_fsdp_score > 0.6:
            total_score = (temporal_fsdp_score * 0.50) + (search_score * 0.20) + (behavior_score * 0.15) + (pop_score * 0.15)
        else:
            total_score = (behavior_score * 0.35) + (search_score * 0.30) + (temporal_fsdp_score * 0.20) + (pop_score * 0.15)

        # Smart Tagline Generator
        tagline = "Recommended for You"
        if bulk_likelihood:
            tagline = "🔥 High Festival Demand (Bulk Stock Available)"
        elif search_score > 0.7:
            tagline = "Based on your recent search"
        elif temporal_fsdp_score > 0.7:
            tagline = f"Trending for Upcoming Festivals"
        elif behavior_score > 0.5:
            tagline = f"Because you love {product.category}"

        scored_products.append({
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "price": product.price,
            "img": product.image,
            "score": round(total_score, 3), 
            "tagline": tagline,
            "fsdp_score": round(temporal_fsdp_score, 3),
            "bulk_surge_predicted": bulk_likelihood # Answers your paper's B2B predictive claim!
        })

    # Sort descending by precise total graph score
    scored_products.sort(key=lambda x: x["score"], reverse=True)

    # 1. PERSONALIZED
    personalized = [p for p in scored_products if p["id"] not in req.past_purchases][:4]

    # 2. EVENT-PROPAGATED (Trending by Category based heavily on FSDP Activation)
    trending_dict = {}
    fsdp_sorted = sorted(scored_products, key=lambda x: x["fsdp_score"], reverse=True)
    
    for p in fsdp_sorted:
        cat = p["category"]
        if cat not in trending_dict:
            p_copy = dict(p)
            # Override tagline if it's the absolute top item propagated by the event
            if p_copy["fsdp_score"] > 0.6:
                p_copy["tagline"] = f"🔥 #1 Festival Pick in {cat}"
            trending_dict[cat] = p_copy

    trending_list = list(trending_dict.values())[:4]

    return {
        "personalized": personalized,
        "trending_by_category": trending_list
    }