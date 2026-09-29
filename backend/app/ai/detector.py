import re
import math
from typing import List, Dict, Any, Tuple

# Common LLM / ChatGPT Resume Hallmark Phrases & Clichés
AI_HALLMARK_PHRASES = [
    # Classic LLM introductory / conversational leaks
    (r"as an ai language model", "AI Disclosure Artifact", "Explicit AI assistant disclosure leak"),
    (r"as a language model", "AI Disclosure Artifact", "Explicit AI assistant disclosure leak"),
    (r"here is a (?:tailored|customized|sample|professional) resume", "AI Prompt Artifact", "Unedited LLM chat greeting artifact"),
    (r"certainly!? here is", "AI Prompt Artifact", "Conversational AI response artifact"),
    (r"i hope this (?:resume|cv|application) (?:helps|finds you well)", "AI Prompt Artifact", "Conversational chat artifact"),
    (r"\[(?:insert|your|company|client|employer|date|name|phone|email|city)[\w\s]*\]", "Placeholder Artifact", "Unreplaced prompt bracket placeholder"),
    
    # Overused LLM Résumé Stock Clichés
    (r"spearheaded (?:cross-functional|strategic|key|multifaceted|transformative)", "Overused AI Cliché", "Generic high-density AI action verb cluster"),
    (r"demonstrated (?:a )?proven track record of", "Overused AI Cliché", "Formulaic LLM résumé intro phrase"),
    (r"proven track record of (?:driving|delivering|scaling|leading|executing)", "Overused AI Cliché", "Stock LLM summary cliché"),
    (r"passionate and results-driven professional", "Overused AI Cliché", "Standard ChatGPT opening archetype"),
    (r"results-oriented (?:and|professional|engineer|developer|leader)", "Overused AI Cliché", "Standard ChatGPT summary archetype"),
    (r"adept at navigating (?:complex|multifaceted|dynamic)", "Overused AI Cliché", "Textbook LLM competency phrasing"),
    (r"leveraging cutting-edge (?:technologies|tools|methodologies|solutions)", "Overused AI Cliché", "Overused generative AI buzzword"),
    (r"orchestrated (?:the )?(?:seamless|end-to-end|successful|multifaceted)", "Overused AI Cliché", "Common ChatGPT structural phrase"),
    (r"driving (?:scalable|robust|sustainable|unprecedented|optimal) (?:growth|solutions|performance|efficiency)", "Overused AI Cliché", "Hyperbolic AI impact template"),
    (r"championed (?:best practices|continuous improvement|initiatives)", "Overused AI Cliché", "Frequent LLM bullet point opener"),
    (r"fostered a collaborative environment to (?:maximize|enhance|drive)", "Overused AI Cliché", "Generic AI soft-skill filler"),
    (r"harnessed the power of", "Overused AI Cliché", "Overly literary LLM metaphor"),
    (r"unwavering commitment to (?:excellence|quality|innovation)", "Overused AI Cliché", "High-frequency AI adjective-noun pair"),
    (r"catalyst for (?:change|innovation|growth|transformation)", "Overused AI Cliché", "ChatGPT stock metaphor"),
    (r"in the realm of", "Overused AI Cliché", "Literary AI transitional phrase"),
    (r"pioneered innovative (?:solutions|approaches|strategies)", "Overused AI Cliché", "Standard AI accomplishment template"),
    (r"streamlined operations (?:resulting in|yielding) \d+%", "Overused AI Cliché", "Formulaic AI impact statement"),
    (r"seamlessly (?:integrated|transitioned|collaborated|executed)", "Overused AI Cliché", "Overused LLM adverb pattern"),
    (r"testament to (?:my|our|strong)", "Overused AI Cliché", "Literary AI flourish"),
    (r"meticulously (?:designed|architected|executed|crafted)", "Overused AI Cliché", "Formulaic ChatGPT adverbial booster"),
    (r"dynamic and (?:multifaceted|adaptable|visionary) (?:leader|professional|developer)", "Overused AI Cliché", "Formulaic LLM identity statement"),
    (r"bridging the gap between", "Overused AI Cliché", "Standard conversational cliché"),
]

def calculate_burstiness(sentences: List[str]) -> Tuple[float, float]:
    """
    Measures sentence length variance (Burstiness).
    Human writing has high burstiness (spikes of short and long sentences).
    AI writing has low burstiness (uniform sentence lengths, ~14-20 words).
    Returns (burstiness_score 0-100, variance).
    """
    if len(sentences) < 3:
        return 50.0, 0.0
        
    lengths = [len(s.split()) for s in sentences if len(s.split()) > 2]
    if len(lengths) < 3:
        return 50.0, 0.0
        
    mean = sum(lengths) / len(lengths)
    if mean == 0:
        return 50.0, 0.0
        
    variance = sum((x - mean) ** 2 for x in lengths) / len(lengths)
    std_dev = math.sqrt(variance)
    coef_variation = std_dev / mean
    
    # Higher coefficient of variation = more human-like burstiness (natural spikes)
    # CV < 0.35 indicates unnaturally uniform sentence length (typical LLM output)
    if coef_variation < 0.25:
        uniformity_score = 90.0 # Highly uniform -> AI indicator
    elif coef_variation < 0.40:
        uniformity_score = 70.0
    elif coef_variation < 0.60:
        uniformity_score = 40.0
    else:
        uniformity_score = 15.0 # High burstiness -> Human
        
    return uniformity_score, coef_variation

def calculate_vocabulary_entropy(text: str) -> Tuple[float, float]:
    """
    Calculates Type-Token Ratio (TTR) and repetitive corporate vocabulary density.
    """
    words = [w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', text)]
    if len(words) < 20:
        return 50.0, 0.5
        
    unique_words = set(words)
    ttr = len(unique_words) / len(words)
    
    # LLMs frequently reuse a narrow band of corporate buzzwords (synergy, scalable, robust, streamline)
    buzzwords = [
        "robust", "scalable", "spearheaded", "orchestrated", "seamless", "synergy",
        "paradigm", "leveraging", "streamlined", "fostered", "pioneered", "cutting-edge",
        "innovative", "transformative", "optimal", "meticulous", "adept", "multifaceted"
    ]
    buzz_count = sum(1 for w in words if w in buzzwords)
    buzz_ratio = (buzz_count / len(words)) * 100
    
    return buzz_ratio, ttr

def calculate_bullet_homogeneity(text: str) -> float:
    """
    Measures if bullet points follow formulaic AI syntax:
    [Action Verb in Past Tense] + [Object with Adjectives] + [resulting in / by X%]
    """
    lines = [l.strip() for l in text.split('\n') if l.strip().startswith(('-', '•', '*', '–')) or (len(l.strip()) > 30 and re.match(r'^[A-Z][a-z]+ed\b', l.strip()))]
    if len(lines) < 3:
        return 30.0
        
    formulaic_count = 0
    pattern = re.compile(r'^[•\-\*\–\s]*([A-Z][a-z]+ed)\b.*(?:resulting in|by \d+%|to (?:improve|reduce|increase|optimize|enhance))\b', re.IGNORECASE)
    
    for line in lines:
        if pattern.search(line):
            formulaic_count += 1
            
    ratio = formulaic_count / len(lines)
    return min(100.0, ratio * 120.0)

def detect_ai_content(raw_text: str) -> Dict[str, Any]:
    """
    Comprehensive AI Content Detection and Authenticity Analysis for Resume Text.
    Returns:
      - ai_score: float (0 - 100)
      - ai_label: "Human Written" | "AI Assisted / Mixed" | "Likely AI-Generated"
      - confidence: float (0.8 - 0.99)
      - flagged_phrases: List[Dict] (detected exact snippets and reasons)
      - metrics: Dict (burstiness, vocabulary, homogeneity scores)
      - reasoning: str (recruiter-friendly plain explanation)
    """
    if not raw_text or len(raw_text.strip()) < 50:
        return {
            "ai_score": 0.0,
            "ai_label": "Human Written",
            "confidence": 0.5,
            "flagged_phrases": [],
            "metrics": {
                "burstiness_uniformity": 0.0,
                "buzzword_density": 0.0,
                "bullet_homogeneity": 0.0,
                "cliche_count": 0
            },
            "reasoning": "Insufficient text length to evaluate AI content."
        }
        
    clean_text = raw_text.strip()
    
    # 1. Detect Hallmark Phrases & Prompt Artifacts
    flagged_phrases: List[Dict[str, Any]] = []
    direct_artifact_found = False
    
    for pattern_str, category, explanation in AI_HALLMARK_PHRASES:
        pattern = re.compile(pattern_str, re.IGNORECASE)
        for match in pattern.finditer(clean_text):
            start = max(0, match.start() - 30)
            end = min(len(clean_text), match.end() + 30)
            snippet = clean_text[start:end].replace('\n', ' ').strip()
            
            flagged_phrases.append({
                "phrase": match.group(0),
                "snippet": f"...{snippet}...",
                "category": category,
                "explanation": explanation
            })
            
            if "Artifact" in category:
                direct_artifact_found = True
                
    # 2. Analyze Sentence Length Uniformity (Burstiness)
    sentences = re.split(r'[.!?\n]+', clean_text)
    burstiness_uniformity, cv = calculate_burstiness(sentences)
    
    # 3. Analyze Vocabulary Entropy & Buzzword Ratio
    buzz_ratio, ttr = calculate_vocabulary_entropy(clean_text)
    
    # 4. Bullet Point Syntactic Homogeneity
    bullet_homogeneity = calculate_bullet_homogeneity(clean_text)
    
    # 5. Composite Score Calculation
    # Weighting:
    # - Hallmark Clichés & Artifacts: 45%
    # - Bullet Syntactic Homogeneity: 25%
    # - Sentence Burstiness Uniformity: 20%
    # - Buzzword Density: 10%
    
    cliche_score = min(100.0, len(flagged_phrases) * 18.0)
    buzz_score = min(100.0, buzz_ratio * 25.0)
    
    raw_ai_score = (
        (cliche_score * 0.45) +
        (bullet_homogeneity * 0.25) +
        (burstiness_uniformity * 0.20) +
        (buzz_score * 0.10)
    )
    
    # If direct prompt artifact found (e.g. "as an AI" or "[Insert Company]"), force high score
    if direct_artifact_found:
        raw_ai_score = max(88.0, raw_ai_score)
        
    ai_score = round(max(0.0, min(100.0, raw_ai_score)), 1)
    
    # Classification Label
    if ai_score >= 70.0:
        ai_label = "Likely AI-Generated"
    elif ai_score >= 35.0:
        ai_label = "AI-Assisted / Mixed"
    else:
        ai_label = "Human Written"
        
    # Generate Plain-Language Recruiter Explanation
    reasons = []
    if direct_artifact_found:
        reasons.append("Detected direct unedited conversational AI artifacts or placeholder brackets.")
    elif len(flagged_phrases) >= 3:
        reasons.append(f"Identified {len(flagged_phrases)} repetitive generative AI stock clichés (e.g., '{flagged_phrases[0]['phrase']}').")
    elif len(flagged_phrases) > 0:
        reasons.append(f"Contains {len(flagged_phrases)} typical AI-style phrasing pattern.")
        
    if bullet_homogeneity > 65.0:
        reasons.append("Highly uniform bullet point syntax characteristic of structured ChatGPT prompts.")
        
    if burstiness_uniformity > 75.0:
        reasons.append("Low sentence burstiness with rigid, robotic rhythm.")
        
    if not reasons:
        if ai_score < 35.0:
            reasons.append("Natural sentence variance, organic phrasing, and realistic project narratives typical of human authorship.")
        else:
            reasons.append("Balanced blend of human experience with potential AI grammar polish.")
            
    reasoning = " ".join(reasons)
    
    return {
        "ai_score": ai_score,
        "ai_label": ai_label,
        "confidence": 0.92 if direct_artifact_found else 0.85,
        "flagged_phrases": flagged_phrases[:8], # Cap to top 8
        "metrics": {
            "burstiness_uniformity": round(burstiness_uniformity, 1),
            "buzzword_density": round(buzz_score, 1),
            "bullet_homogeneity": round(bullet_homogeneity, 1),
            "cliche_count": len(flagged_phrases)
        },
        "reasoning": reasoning
    }
