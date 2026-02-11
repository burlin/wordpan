import asyncio
import os
import warnings
from functools import wraps
from typing import Optional

from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client

from crews.random_phrase_crew.crew import RandomPhraseCrew
from crews.random_phrase_crew.schemas import PhraseOutput
from crews.word_pair_enrichment_crew.crew import WordPairEnrichmentCrew
from crews.word_pair_enrichment_crew.schemas import WordPairEnrichmentOutput

from lib.tracer import traceable

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# Initialize Flask app
app = Flask(__name__)

# CORS - allow requests from localhost frontend (incl. 5174 when 5173 is busy)
# supports_credentials=False: fetch не использует credentials, только Authorization header
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False,
    }
})

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
# Admin client bypasses RLS - used for cache insert (user already verified via JWT)
supabase_admin: Client | None = (
    create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_SERVICE_ROLE_KEY else None
)

# Validate keys at startup
if not os.getenv("GROQ_API_KEY"):
    print("WARNING: GROQ_API_KEY is not set. AI phrase generation and enrichment will fail.")
if not SUPABASE_SERVICE_ROLE_KEY:
    print("WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. Generate AI (word_pair_ai_cache) will fail due to RLS.")


def require_auth(f):
    """
    Decorator to require authentication for endpoints.
    Validates the JWT token from the Authorization header.
    """
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "Authorization header is required"}), 401

        # Extract token from "Bearer <token>" format
        try:
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header
        except IndexError:
            return jsonify({"error": "Invalid authorization header format"}), 401

        try:
            # Verify the JWT token with Supabase
            user_response = supabase.auth.get_user(token)
            request.user = user_response.user
        except Exception as e:
            print(f"[DEBUG] Auth failed: {e}")
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401

        return await f(*args, **kwargs)

    return decorated_function


async def get_user_context(user_id: str) -> Optional[str]:
    """
    Fetch user context from Supabase.

    Args:
        user_id: The user's UUID

    Returns:
        User context string or None if not found
    """
    try:
        # Fetch user context from the profiles table (maybe_single: no profile = None)
        response = supabase.table("profiles").select("context").eq("id", user_id).maybe_single().execute()

        if response.data:
            return response.data.get("context", "")
        return None
    except Exception as e:
        print(f"Error fetching user context: {e}")
        return None


@traceable
async def generate_random_phrase(words: list[str], user_context: str) -> PhraseOutput:
    """
    Generate a random phrase using the RandomPhraseCrew.

    Args:
        words: List of words to use in the phrase
        user_context: User context to personalize the phrase

    Returns:
        PhraseOutput with phrase and words used
    """
    inputs = {
        'words': ', '.join(words) if isinstance(words, list) else str(words),
        'user_context': user_context or ''
    }

    result = await RandomPhraseCrew().crew().kickoff_async(inputs=inputs)

    # CrewAI returns a result with a .pydantic attribute containing the Pydantic model
    if hasattr(result, 'pydantic'):
        return result.pydantic

    # Fallback - return a basic PhraseOutput
    return PhraseOutput(phrase=str(result), words=words)


@traceable
async def generate_word_pair_enrichment(word_a: str, word_b: str) -> WordPairEnrichmentOutput:
    """
    Generate examples, similar words, and paraphrases for a word pair.
    """
    inputs = {
        'word_a': jsonify(word_a).get_data(as_text=True),
        'word_b': jsonify(word_b).get_data(as_text=True),
    }

    result = await WordPairEnrichmentCrew().crew().kickoff_async(inputs=inputs)

    if hasattr(result, 'pydantic'):
        return result.pydantic

    return WordPairEnrichmentOutput(
        examples=[str(result)],
        similar_words={word_a: [], word_b: []},
        paraphrases=[]
    )


@app.before_request
def log_request():
    """Log incoming API requests for debugging (skip OPTIONS)."""
    if request.path.startswith("/api/") and request.method != "OPTIONS":
        print(f"[API] {request.method} {request.path}")

@app.route("/health", methods=["GET"])
async def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"}), 200


@app.route("/api/random-phrase", methods=["POST"])
@require_auth
async def get_random_phrase():
    print("[DEBUG] random-phrase: handler started")
    """
    Generate a random phrase based on provided words and user context.

    Request body:
        {
            "words": ["word1", "word2", ...]
        }

    Headers:
        Authorization: Bearer <jwt_token>

    Response:
        {
            "phrase": "generated phrase",
            "words_used": ["word1", "word2"]
        }
    """
    try:
        # Get words from request body
        data = request.get_json()

        if not data or "words" not in data:
            return jsonify({"error": "Request body must include 'words' array"}), 400

        words = data.get("words", [])

        if not isinstance(words, list) or len(words) == 0:
            return jsonify({"error": "'words' must be a non-empty array"}), 400

        # Get user context from Supabase
        user_id = request.user.id
        print(f"[DEBUG] random-phrase: user_id={user_id}, words={words}")
        user_context = await get_user_context(user_id)

        # Generate the phrase
        print("[DEBUG] random-phrase: calling CrewAI...")
        result = await generate_random_phrase(words, user_context or "")
        print(f"[DEBUG] random-phrase: done, phrase_len={len(result.phrase) if result.phrase else 0}")

        # Map "words" to "words_used" for frontend compatibility
        payload = result.model_dump()
        payload["words_used"] = payload.pop("words", [])
        return jsonify(payload), 200

    except Exception as e:
        import traceback
        print(f"[API] random-phrase error: {e}")
        traceback.print_exc()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route("/api/word-pairs/enrich", methods=["POST"])
@require_auth
async def enrich_word_pair():
    """
    Generate or return cached AI enrichment for a word pair.

    Request body:
        { "pair_id": "<uuid>" }
    """
    try:
        data = request.get_json()

        if not data or "pair_id" not in data:
            return jsonify({"error": "Request body must include 'pair_id'"}), 400

        pair_id = data.get("pair_id")
        user_id = request.user.id

        db = supabase_admin if supabase_admin else supabase
        # Check cache (maybe_single: 0 rows = None, not error)
        cache_resp = db.table("word_pair_ai_cache") \
            .select("*") \
            .eq("word_pair_id", pair_id) \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()

        if cache_resp.data:
            return jsonify(cache_resp.data), 200

        # Fetch word pair (maybe_single: 0 rows = pair not found)
        pair_resp = db.table("word_pairs") \
            .select("id, word_a_id, word_b_id, user_id") \
            .eq("id", pair_id) \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()

        if not pair_resp.data:
            return jsonify({"error": "Word pair not found"}), 404

        word_ids = [pair_resp.data["word_a_id"], pair_resp.data["word_b_id"]]
        words_resp = db.table("words") \
            .select("id, word") \
            .in_("id", word_ids) \
            .execute()

        words_map = {w["id"]: w["word"] for w in (words_resp.data or [])}
        word_a = words_map.get(pair_resp.data["word_a_id"])
        word_b = words_map.get(pair_resp.data["word_b_id"])

        if not word_a or not word_b:
            return jsonify({"error": "Word data not found"}), 404

        # Generate enrichment
        enrichment = await generate_word_pair_enrichment(word_a, word_b)
        payload = enrichment.model_dump()
        payload["word_pair_id"] = pair_id
        payload["user_id"] = user_id

        # Store cache (use admin to bypass RLS - user already verified)
        try:
            insert_resp = db.table("word_pair_ai_cache") \
                .insert(payload) \
                .execute()

            if insert_resp.data:
                print(f"[API] word-pairs/enrich: cache saved for pair {pair_id}")
                return jsonify(insert_resp.data[0]), 200
        except Exception as insert_err:
            print(f"[API] word-pairs/enrich: insert failed (returning data anyway): {insert_err}")

        return jsonify(payload), 200

    except Exception as e:
        import traceback
        print(f"[API] word-pairs/enrich error: {e}")
        traceback.print_exc()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


if __name__ == "__main__":
    # Run the Flask app
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)
